import { NextRequest, NextResponse } from "next/server";
import { getEfiInstance } from "@/lib/efi";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, period, amount } = body;

    if (!planId || !amount) {
      return NextResponse.json({ error: "Faltam parâmetros obrigatórios" }, { status: 400 });
    }

    // Identificando o lojista
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    // 1. Inicia o SDK da Efi Pay (MTLS com o P12 em Base64)
    const efiApi = await getEfiInstance();
    const pixKey = process.env.EFI_PIX_KEY;

    if (!pixKey) {
      return NextResponse.json({ error: "Chave PIX (EFI_PIX_KEY) não configurada no servidor." }, { status: 500 });
    }

    // 2. Cria a Cobrança (COB) na Efi Pay
    const cobBody = {
      calendario: { expiracao: 3600 },
       valor: { original: Number(amount).toFixed(2) },
       chave: pixKey,
       infoAdicionais: [
         { nome: 'Plano', valor: `${planId} ${period}` },
         { nome: 'ID', valor: restaurant.id.slice(0,8) }
       ]
    };

    const cobResponse = await efiApi.post('/v2/cob', cobBody);
    const txid = cobResponse.data.txid;
    const locId = cobResponse.data.loc.id;

    // 3. Puxa a string EMV (Copia e Cola) e a imagem do QRCode
    const qrCodeResponse = await efiApi.get(`/v2/loc/${locId}/qrcode`);
    const { qrcode, imagemQrcode } = qrCodeResponse.data;

    // 4. Salva a transação temporariamente no banco de dados, para o Webhook saber 
    // qual restaurante ativar quando a notificação de confirmação chegar
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        last_txid: txid,
        pending_plan_id: planId,
        pending_plan_period: period
      })
      .eq('id', restaurant.id);

    if (updateError) {
      console.error("Erro Supabase Update:", updateError);
      return NextResponse.json({ error: "Falha ao gravar intent no banco" }, { status: 500 });
    }

    // Retorna para o Frontend desenhar
    return NextResponse.json({
      txid,
      qr_code_base64: imagemQrcode,
      copia_e_cola: qrcode
    });

  } catch (error: any) {
    console.error("EFI Pix Generation Error:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: error?.response?.data?.mensagem || "Falha ao gerar o PIX" },
      { status: 500 }
    );
  }
}
