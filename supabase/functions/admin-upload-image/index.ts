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

    // Verificar se é Super Admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Usuário não encontrado");

    const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    if (!isSuperAdmin) throw new Error("Acesso negado: Somente Super Admin");

    // Recebe: { userId, fileName, base64Image }
    const { userId, fileName, base64Image, productName, categoryName } = await req.json();

    if (!userId || !fileName || !base64Image) {
      throw new Error("Dados incompletos no payload");
    }

    // Decodificar base64 para Uint8Array
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload para o Storage
    const storagePath = `${userId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Buscar o produto pelo nome e categoria para atualizar
    if (productName && categoryName) {
      // Buscar categoria
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", userId);

      const category = categories?.find((c: any) =>
        c.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
      );

      // Buscar produto pelo nome e categoria
      const query = supabase
        .from("products")
        .update({ image_url: publicUrl })
        .eq("user_id", userId)
        .ilike("name", productName);

      if (category) {
        query.eq("category_id", category.id);
      }

      await query;
    }

    return new Response(JSON.stringify({ success: true, publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
