import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let amount, token;
    
    // Tentar ler como JSON primeiro (Padrão)
    try {
      const body = await req.json();
      console.log("Corpo JSON recebido:", JSON.stringify(body));
      amount = body.amount;
      token = body.token;
    } catch (e) {
      // Fallback para Form Data (Caso o Google envie como formulário)
      const text = await req.text();
      console.log("Corpo de texto bruto recebido:", text);
      const params = new URLSearchParams(text);
      amount = params.get("amount");
      token = params.get("token");
    }

    if (amount === undefined || amount === null) {
      throw new Error(`Atributo 'amount' não encontrado no corpo enviado (Dica: Verifique se o Script do Google está enviando o campo 'amount')`);
    }

    // Robustez: Remover qualquer caractere que não seja número, ponto ou vírgula (R$, etc)
    const sanitizedAmount = amount.toString().replace(/[^0-9,.]/g, '').replace(',', '.');
    const numericAmount = Number(sanitizedAmount);

    if (isNaN(numericAmount)) {
      throw new Error(`Não foi possível converter o valor "${amount}" em um número válido.`);
    }

    // 1. Validar Token de Segurança (Sync Token)
    const { data: settings } = await supabase
      .from("global_settings")
      .select("value")
      .eq("key", "pix_sync_token")
      .single();

    if (!settings || token?.trim() !== settings.value?.trim()) {
      console.error(`Token INVÁLIDO. Recebido: "${token}" | Esperado no Banco: "${settings?.value}"`);
      return new Response(JSON.stringify({ error: "Unauthorized - Sync Token Mismatch" }), { status: 401, headers: corsHeaders });
    }

    // 2. Buscar a intenção de pagamento pendente para este valor exato
    const { data: intent, error: intentError } = await supabase
      .from("pix_intents")
      .select("*")
      .eq("amount", numericAmount)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (intentError || !intent) {
      console.warn(`Nenhuma intenção de pagamento pendente encontrada para o valor R$ ${numericAmount}`);
      return new Response(JSON.stringify({ success: false, message: `Intent not found for amount ${numericAmount}` }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 3. Determinar duração do Plano
    // monthly = Mensal (30 dias)
    // basic   = Semestral (180 dias)
    // pro     = Anual (365 dias)
    let planDays = 30; // Default mensal
    if (intent.plan_type === 'basic') planDays = 180;
    if (intent.plan_type === 'pro') planDays = 365;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + planDays);

    // 4. Ativar o Plano no perfil
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        plan: intent.plan_type || 'monthly',
        plan_status: "active",
        is_active: true,
        premium_until: expiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", intent.user_id);

    if (profileError) throw profileError;

    // 5. Marcar intenção como concluída
    await supabase
      .from("pix_intents")
      .update({ status: "completed" })
      .eq("id", intent.id);

    // 6. Gerar uma fatura (Invoice) paga para o histórico
    await supabase.from("invoices").insert({
      user_id: intent.user_id,
      amount: intent.amount,
      status: "paid",
      period_start: new Date().toISOString(),
      period_end: expiry.toISOString(),
    });

    console.log(`Pagamento de R$ ${amount} processado com sucesso para o usuário ${intent.user_id}`);

    return new Response(JSON.stringify({ success: true, user_id: intent.user_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Erro no processamento do webhook Pix:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
