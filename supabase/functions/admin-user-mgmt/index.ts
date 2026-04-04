import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify if requester is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Cabeçalho de autorização ausente");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error("Auth Error:", authError);
      throw new Error(`Não autorizado: ${authError.message}`);
    }
    
    if (!user) {
      console.error("User not found for token");
      throw new Error("Não autorizado: Usuário não encontrado");
    }

    console.log("Checking admin status for:", user.email, " (ID:", user.id, ")");
    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    
    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error(`Erro ao verificar admin: ${rpcError.message}`);
    }

    console.log("Is Super Admin result:", isSuperAdmin);
    if (!isSuperAdmin) {
      console.error("Access denied for user:", user.email);
      throw new Error(`Acesso negado para ${user.email}: Somente Super Admin`);
    }

    console.log("Requisicão recebida");
    const { action, payload } = await req.json();
    console.log("Ação:", action, "Payload:", JSON.stringify(payload));

    if (!action || !payload) {
      throw new Error("Ação ou payload ausentes no corpo da requisição");
    }

    if (action === "create") {
      const { email, password, restaurant_name, slug, plan, whatsapp } = payload;
      
      // 1. Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { restaurant_name, slug }
      });

      if (createError) throw createError;

      // 2. Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          restaurant_name, 
          slug, 
          whatsapp,
          plan: plan || "basic",
          is_active: true,
          plan_status: "active"
        })
        .eq("user_id", newUser.user.id);

      if (profileError) throw profileError;

      return new Response(JSON.stringify({ success: true, user: newUser.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "suspend") {
      const { user_id, active } = payload;
      
      // Update profile status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_active: active })
        .eq("user_id", user_id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;
      console.log("Iniciando exclusão profunda para o usuário:", user_id);

      // 1. Modifier Options (via join indirecto)
      const { data: modifiers } = await supabase.from("product_modifiers").select("id").eq("user_id", user_id);
      if (modifiers && modifiers.length > 0) {
        const modIds = modifiers.map(m => m.id);
        await supabase.from("modifier_options").delete().in("modifier_id", modIds);
        await supabase.from("product_modifiers").delete().in("id", modIds);
      }

      // 2. Order Items (via join indirecto)
      const { data: orders } = await supabase.from("orders").select("id").eq("restaurant_user_id", user_id);
      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        await supabase.from("order_items").delete().in("order_id", orderIds);
        await supabase.from("orders").delete().in("id", orderIds);
      }

      // 3. Simple Table Deletion (by user_id)
      await Promise.all([
        supabase.from("products").delete().eq("user_id", user_id),
        supabase.from("categories").delete().eq("user_id", user_id),
        supabase.from("coupons").delete().eq("user_id", user_id),
        supabase.from("invoices").delete().eq("user_id", user_id),
        supabase.from("menu_views").delete().eq("restaurant_user_id", user_id),
        supabase.from("business_hours").delete().eq("user_id", user_id),
      ]);

      // 4. Finally, Profiles and Auth User
      await supabase.from("profiles").delete().eq("user_id", user_id);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
      
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação inválida");

  } catch (err) {
    console.error("error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
