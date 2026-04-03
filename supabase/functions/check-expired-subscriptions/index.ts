import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * check-expired-subscriptions
 * 
 * Cron Job que varre assinaturas ativas cujo período (period_end) já venceu.
 * Quando encontra, reverte o plan_status do usuário para "expired",
 * forçando-o a gerar uma nova cobrança PIX pelo botão na UI.
 * 
 * NÃO gera cobranças automaticamente — isso é responsabilidade
 * exclusiva do lojista ao clicar em "Pagar com Pix" no PlanBanner.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Buscar todas as faturas pagas cujo período já expirou
    const now = new Date().toISOString();

    const { data: expiredInvoices, error: invoiceErr } = await supabase
      .from("invoices")
      .select("user_id, period_end")
      .eq("status", "paid")
      .lt("period_end", now);

    if (invoiceErr) {
      console.error("Erro ao buscar faturas expiradas:", invoiceErr.message);
      return new Response(
        JSON.stringify({ error: invoiceErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Extrair user_ids únicos das faturas vencidas
    const expiredUserIds = [...new Set((expiredInvoices || []).map((i: any) => i.user_id))];

    if (expiredUserIds.length === 0) {
      console.log("Nenhuma assinatura vencida encontrada.");
      return new Response(
        JSON.stringify({ processed: 0, message: "Nenhuma assinatura vencida." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verificar se esses usuários não têm uma fatura MAIS RECENTE ainda válida
    //    (evita desativar quem renovou antes de vencer)
    const results: any[] = [];

    for (const userId of expiredUserIds) {
      // Checar se existe alguma fatura paga com period_end no futuro
      const { data: validInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "paid")
        .gte("period_end", now)
        .limit(1)
        .maybeSingle();

      if (validInvoice) {
        // Usuário tem fatura válida vigente, não mexer
        console.log(`Usuário ${userId} tem fatura vigente, ignorando.`);
        continue;
      }

      // Checar se o perfil está realmente "active" antes de desativar
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_status")
        .eq("user_id", userId)
        .single();

      if (!profile || profile.plan_status !== "active") {
        // Já expirado ou em outro estado, não interferir
        continue;
      }

      // 4. Desativar a conta — forçar renovação via UI
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ plan_status: "expired" })
        .eq("user_id", userId);

      if (updateErr) {
        console.error(`Erro ao expirar usuário ${userId}:`, updateErr.message);
        results.push({ user_id: userId, status: "error", error: updateErr.message });
      } else {
        console.log(`Assinatura do usuário ${userId} expirada com sucesso.`);
        results.push({ user_id: userId, status: "expired" });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-expired-subscriptions fatal:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
