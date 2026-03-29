import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    // Valida o Secret configurado na Vercel (CRON_SECRET)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized / Cron Failed" }, { status: 401 });
    }

    const adminDb = getSupabaseAdmin();
    const now = new Date().toISOString();

    console.log(`🧹 Iniciando varredura diária de assinaturas PIX vencidas às ${now}`);

    // Busca restaurantes que estão expirados e ainda não foram marcados
    // Se is_active for null, lidamos como booleano tbm
    const { data: expiredLojistas, error: fetchError } = await adminDb
      .from("restaurants")
      .select("id, name, trial_ends_at, plan, is_active")
      .lt("trial_ends_at", now) // expirou
      .neq("plan", "free")      // não é cortesia/free
      .eq("is_active", true); // e está ativo

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredLojistas || expiredLojistas.length === 0) {
      return NextResponse.json({ message: "Nenhum lojista vencido nesta varredura" });
    }

    const suspendedIds = expiredLojistas.map((lojista) => lojista.id);

    // Rebaixa as Contas na Tabela e bloqueia
    const { error: blockError } = await adminDb
      .from("restaurants")
      .update({
        plan: "free",
        is_active: false, 
      })
      .in("id", suspendedIds);

    if (blockError) {
      console.error("Falha ao bloquear lojas em lote:", blockError);
      throw blockError;
    }

    return NextResponse.json({
      status: "success",
      suspended_count: suspendedIds.length,
      suspensions: suspendedIds
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cron Execution Error:", error.message);
    return NextResponse.json({ error: "Rotina de expiração falhou" }, { status: 500 });
  }
}
