import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import axios from 'axios';

// =========================================================================
// HACK DA VERCEL: Configuração mágica para impedir o timeout Vercel (Hobby) 
// por limite de 10s. O Next.js autorizará a persistência de até 60 segundos 
// =========================================================================
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileText, restaurantId } = body;

    if (!fileText || !restaurantId) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    // 1. Coleta das chaves lá de dentro do BD novo do Supabase configurado
    const { data: configRows } = await supabaseAdmin.from('system_settings').select('key, value');
    const openRouterKey = configRows?.find(r => r.key === 'ai_api_key')?.value;
    const modelTarget = configRows?.find(r => r.key === 'ai_model')?.value || 'qwen/qwen3.5-9b';

    if (!openRouterKey) {
       return NextResponse.json({ error: 'Configuração da AI-Key ausente no Supabase' }, { status: 500 });
    }

    // 2. Transação Externa Robusta via Axios p/ OpenRouter
    const apiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: modelTarget,
        messages: [
          {
             role: 'system', 
             content: 'Você é um assistente cirúrgico que extrai pratos e categorias de textos brutos. Retorne EXCLUSIVAMENTE UM ARRAY JSON contendo: [{ "name": "Nome", "products": [{ "name": "x", "desc": "y", "price": 10.0 }] }]. Nada de introduções ou marcação Markdown.'
          },
          { role: 'user', content: `Converta esse cardápio em JSON estrito:\n\n${fileText}` }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 55000 // Limite em 55s, evitando cair nos 60s da Vercel para dar tempo de enviar um Erro suave ao Painel Frontend
      }
    );

    // 3. Resultado Limpo. Cabe ao Frontend injetar localmente no Supabase (Ou fazer um map aqui)
    const contentText = apiResponse.data.choices[0].message.content;
    const aiPayload = JSON.parse(contentText); // Garante a sanitização final
    
    return NextResponse.json({ success: true, ai_response: aiPayload });
    
  } catch (error: any) {
    console.error('AI Menu Import Failure:', error?.response?.data || error.message);
    
    // Fallback amigável de tempo estourado
    if(error.code === 'ECONNABORTED') {
      return NextResponse.json({ error: 'O servidor de Inteligência Artificial demorou muito para responder (Vercel Timeout Safe). Tente novamente.' }, { status: 504 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
