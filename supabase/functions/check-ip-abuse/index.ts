import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SB_URL") || Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SB_SERVICE_ROLE") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing environment variables (SB_URL / SB_SERVICE_ROLE)");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Obter Token e Usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ blocked: false, message: "No auth header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ blocked: false, message: "Invalid session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. TENTAR CAPTURAR IP
    const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "";
    const clientIp = ipHeader.split(',')[0].trim();

    if (!clientIp) {
      console.warn("Não foi possível detectar o IP do cliente.");
      return new Response(JSON.stringify({ blocked: false, message: "IP not detected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Buscar Perfil Atual
    const { data: profile } = await supabase
      .from("profiles")
      .select("signup_ip, plan_status, is_active")
      .eq("user_id", user.id)
      .single();

    // 4. Se o usuário já é pago (active), não bloqueamos por IP
    if (profile?.plan_status === 'active') {
      return new Response(JSON.stringify({ blocked: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Se o perfil não tem IP ainda, gravamos o IP atual
    if (!profile?.signup_ip) {
      await supabase
        .from("profiles")
        .update({ signup_ip: clientIp })
        .eq("user_id", user.id);
    }

    // 6. VERIFICAR DUPLICIDADE DE IP PARA TRIAL
    // Procuramos OUTROS usuários com o mesmo IP que estejam ou estiveram em trial
    const { data: duplicateIp, error: duplicateError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("signup_ip", clientIp)
      .neq("user_id", user.id) // Não ser o próprio usuário
      .limit(1)
      .maybeSingle();

    if (duplicateIp) {
      console.warn(`DUPLICIDADE DE IP DETECTADA: ${clientIp}. Conta bloqueada.`);
      
      // BLOQUEIO AUTOMÁTICO: Desativamos a conta se for duplicada
      await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ blocked: true, message: "Limite de 1 conta gratuita por IP excedido." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ blocked: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
