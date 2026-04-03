import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * check-expired-trials
 * 
 * Cron Job que varre contas em "trial" cujo trial_ends_at já passou.
 * Apenas marca o plan_status como "expired" de forma silenciosa.
 * 
 * NÃO gera cobranças PIX automaticamente.
 * A geração de cobranças é responsabilidade exclusiva do lojista
 * ao clicar no botão "Pagar com Pix" no PlanBanner da interface.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Buscar usuários com trial vencido que ainda estão com status "trial"
    const { data: expiredUsers, error } = await supabase
      .from("profiles")
      .select("user_id, plan, restaurant_name, plan_status, trial_ends_at")
      .eq("plan_status", "trial")
      .lt("trial_ends_at", new Date().toISOString());

    if (error) {
      console.error("Erro ao buscar trials expirados:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Encontrados ${expiredUsers?.length || 0} trials expirados`);

    const results: any[] = [];

    for (const user of expiredUsers || []) {
      // Apenas marcar como expirado — sem gerar cobranças automáticas
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ plan_status: "expired" })
        .eq("user_id", user.user_id);

      if (updateErr) {
        console.error(`Erro ao expirar trial do usuário ${user.user_id}:`, updateErr.message);
        results.push({
          user_id: user.user_id,
          restaurant: user.restaurant_name,
          status: "error",
          error: updateErr.message,
        });
      } else {
        console.log(`Trial do usuário ${user.user_id} (${user.restaurant_name}) expirado.`);
        results.push({
          user_id: user.user_id,
          restaurant: user.restaurant_name,
          status: "expired",
        });
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
    console.error("check-expired-trials error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
