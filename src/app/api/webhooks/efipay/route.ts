import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Verificações Obrigatórias da EFI (Desafio Webhook)
    // A EFI valida o webhook batendo aqui vazio ou com um array de 'pix'.
    if (!body || !body.pix) {
      return NextResponse.json({ received: true });
    }

    const adminDb = getSupabaseAdmin();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
        console.error("ERRO CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.");
        // Não dá return 500 porque a EFI pode desativar o webhook se falhar muito.
        // Apenas geramos log para o engenheiro na Vercel.
    }

    // 2. Loop sobre os pagamentos confirmados
    for (const pix of body.pix) {
      const { txid, valor } = pix;

      console.log(`🤑 Recebendo confirmação PIX: txid=${txid} valor=${valor}`);

      if (txid) {
        // Busca qual restaurante estava esperando esse txid
        const { data: restaurant, error: findError } = await adminDb
          .from("restaurants")
          .select("id, pending_plan_id, pending_plan_period")
          .eq("last_txid", txid)
          .single();

        if (restaurant && !findError) {
           
           // Cálculo de Vencimento
           const isYearly = restaurant.pending_plan_period === 'yearly';
           const expirationDays = isYearly ? 365 : 30;
           
           const newTrialEndsAt = new Date();
           newTrialEndsAt.setDate(newTrialEndsAt.getDate() + expirationDays);

           // 3. Atualiza o status do restaurante liberando com Bypass RLS
           const { error: updateError } = await adminDb
            .from("restaurants")
            .update({
              plan: restaurant.pending_plan_id,
              is_active: true,
              trial_ends_at: newTrialEndsAt.toISOString(),
              // não resetamos last_txid para manter o rastreio da última transação
            })
            .eq("id", restaurant.id);
            
            if (updateError) {
               console.error(`Erro ao ativar plano do txid ${txid}:`, updateError);
            } else {
               console.log(`✅ Restaurante ${restaurant.id} ativado para o plano ${restaurant.pending_plan_id}!`);
            }
        }
      }
    }

    // A Efi Pay requer que seja entregue status HTTP 200 no webhook
    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 200 }); // Status 200 p/ não bloquear na EFI
  }
}
