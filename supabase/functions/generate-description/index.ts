import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName } = await req.json();

    if (!productName || typeof productName !== "string" || productName.length > 200) {
      return new Response(
        JSON.stringify({ error: "Nome do produto inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Buscar API key e modelo da tabela global_settings (igual ao resto do sistema)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settingsData } = await supabase
      .from("global_settings")
      .select("key, value")
      .in("key", ["openrouter_api_key", "openrouter_model"]);

    const settings: Record<string, string> = {};
    (settingsData || []).forEach((row: any) => {
      settings[row.key] = row.value || "";
    });

    const apiKey = settings["openrouter_api_key"];
    if (!apiKey || apiKey.trim() === "") {
      return new Response(
        JSON.stringify({
          error:
            "API Key do OpenRouter não configurada. Acesse Super Admin → Configurações → IA (OpenRouter) e adicione sua chave.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Usar modelo configurado ou fallback para gratuito
    const model =
      settings["openrouter_model"]?.trim() || "google/gemini-2.0-flash-exp:free";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": supabaseUrl,
        "X-Title": "Menu Pro - AI Description Generator",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Você é um copywriter gastronômico premium. Gere descrições curtas (máximo 2 frases) em português do Brasil, sofisticadas e apetitosas para pratos de restaurante. Use linguagem sensorial e elegante. Responda APENAS com a descrição, sem aspas ou formatação adicional.",
          },
          {
            role: "user",
            content: `Gere uma descrição premium e apetitosa para o prato: "${productName}"`,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenRouter API error [${response.status}]:`, errorBody);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes na conta OpenRouter." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "API Key do OpenRouter inválida. Verifique em Super Admin → Configurações." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Erro da API de IA (${response.status}). Verifique as configurações.` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || "";

    if (!description) {
      return new Response(
        JSON.stringify({ error: "A IA não retornou uma descrição. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Erro inesperado:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
