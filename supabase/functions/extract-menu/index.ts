import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, mimeType, fileName } = await req.json();

    if (!fileBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "fileBase64 and mimeType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OpenRouter config from global_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: settings } = await supabase
      .from("global_settings")
      .select("key, value")
      .in("key", ["openrouter_api_key", "openrouter_model"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

    const apiKey = settingsMap["openrouter_api_key"];
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured. Ask the super admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const model = settingsMap["openrouter_model"] || "google/gemini-2.0-flash-001";

    // Build the prompt
    const systemPrompt = `Você é um assistente especializado em extrair informações de cardápios de restaurantes (imagens e PDFs).
Sua tarefa é analisar o cardápio e listar TODOS os produtos disponíveis.

Retorne APENAS um JSON válido no formato abaixo, sem explicações:
{
  "products": [
    {
      "name": "Nome exato do produto",
      "description": "Breve descrição se disponível",
      "price": 12.90,
      "category": "Categoria lógica (ex: Entradas, Burgers, Bebidas)"
    }
  ]
}

Regras Cruciais:
1. Extraia TUDO o que for produto.
2. Se o preço for unitário ou por peso, tente extrair o valor numérico. Se não existir, use 0.
3. Use categorias que façam sentido conforme o cardápio.
4. Mantenha a resposta estritamente no formato JSON.`;

    let messages: any[];

    if (mimeType === "application/pdf") {
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise este cardápio em PDF (${fileName}) e extraia todos os produtos.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${fileBase64}`, // Fallback type for some vision models
              },
            },
          ],
        },
      ];
    } else {
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise esta imagem de cardápio e extraia todos os produtos:",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${fileBase64}`,
              },
            },
          ],
        },
      ];
    }

    console.log(`Calling OpenRouter with model: ${model} for file: ${fileName}`);

    // Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://menupro.com.br",
        "X-Title": "Menu Pro AI",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: "json_object" } // Support JSON mode if the model supports it
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter API Error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `AI API error: ${response.status}`, details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    
    console.log("AI Response received, length:", content.length);

    // Robust JSON cleaning
    let jsonStr = content.trim();
    
    // Remove Markdown code blocks if present
    if (jsonStr.includes("```")) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    try {
      const parsed = JSON.parse(jsonStr);
      
      // Ensure products array exists
      if (!parsed.products || !Array.isArray(parsed.products)) {
        throw new Error("Invalid structure: missing 'products' array");
      }

      console.log(`Successfully extracted ${parsed.products.length} products`);

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
      console.error("Raw content attempted to parse:", jsonStr);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response", 
          raw: content.substring(0, 500) + "..." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("extract-menu fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
