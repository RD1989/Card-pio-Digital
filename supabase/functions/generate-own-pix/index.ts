import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CRC16 CCITT Implementation
function crc16ccitt(data: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function normalizeText(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function formatField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 0. Autenticação Manual (Pular Gateway 401)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Cabeçalho de autorização ausente");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Não autorizado");

    const { user_id, plan } = await req.json();
    if (!user_id || !plan) throw new Error("user_id and plan are required");

    // Garantir que o usuário só gera Pix para si mesmo (exceto se for super admin, mas aqui focamos no próprio usuário)
    if (user.id !== user_id) {
      // Opcional: verificar se é super admin se quiser permitir que admin gere para outros
      throw new Error("Acesso negado: ID de usuário incompatível");
    }

    // 1. Obter Preço Base conforme o plano
    let baseAmount = 24.90; // Mensal (default)
    if (plan === 'basic') baseAmount = 97.00; // Semestral
    if (plan === 'pro') baseAmount = 169.00; // Anual

    const { data: settings } = await supabase.from("global_settings").select("key, value").in("key", ["own_pix_key", "own_pix_name", "own_pix_city"]);
    const cfg: Record<string, string> = {};
    settings?.forEach((s: any) => { cfg[s.key] = s.value || ""; });

    if (!cfg.own_pix_key) throw new Error("Configuração 'own_pix_key' não encontrada.");

    // 2. Chamar a função RPC para obter o próximo valor único (com centavos)
    const { data: uniqueAmount, error: rpcError } = await supabase.rpc("get_next_pix_amount", { _base_amount: baseAmount });
    if (rpcError) throw rpcError;

    // 3. Gerar o Pix Copia e Cola (BRCode) - Geramos ANTES do insert para salvar o código
    const pixKey = cfg.own_pix_key;
    const merchantName = normalizeText(cfg.own_pix_name || "RECEBEDOR").substring(0, 25);
    const merchantCity = normalizeText(cfg.own_pix_city || "SAO PAULO").substring(0, 15);
    const description = `PLANO ${plan.toUpperCase()}`.substring(0, 72);

    const payloadFormatIndicator = '000201';
    const merchantAccountInfo =
        formatField('00', 'br.gov.bcb.pix') +
        formatField('01', pixKey) +
        formatField('02', normalizeText(description));
    const merchantAccountInfoComplete = formatField('26', merchantAccountInfo);
    
    const merchantCategoryCode = '52040000';
    const transactionCurrency = '5303986';
    const transactionAmount = formatField('54', uniqueAmount.toFixed(2));
    const countryCode = '5802BR';
    const merchantNameField = formatField('59', merchantName);
    const merchantCityField = formatField('60', merchantCity);
    
    // Payload base temporário para gerar o ID da intenção
    const payloadBaseTemp =
        payloadFormatIndicator + merchantAccountInfoComplete + merchantCategoryCode +
        transactionCurrency + transactionAmount + countryCode + merchantNameField +
        merchantCityField;

    // 4. Registrar intenção no banco
    const { data: intent, error: intentError } = await supabase
      .from("pix_intents")
      .insert({
        user_id,
        base_amount: baseAmount,
        amount: uniqueAmount,
        status: "pending",
        plan_type: plan // Salva se é basic ou pro
      })
      .select()
      .single();

    if (intentError) throw intentError;

    // Adicionar ID da transação (62) e CRC (63) usando o ID do banco
    const additionalDataField = formatField('05', `INTENT${intent.id.slice(0, 8)}`);
    const additionalDataFieldComplete = formatField('62', additionalDataField);
    
    const crcInput = payloadBaseTemp + additionalDataFieldComplete + '6304';
    const brCode = crcInput + crc16ccitt(crcInput);

    // 5. Atualizar a intenção com o código gerado
    await supabase.from("pix_intents").update({ pix_code: brCode }).eq("id", intent.id);

    // 6. Retornar dados para o frontend
    return new Response(JSON.stringify({ 
      success: true, 
      brCode, 
      amount: uniqueAmount.toFixed(2),
      intent_id: intent.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
