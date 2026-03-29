import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Identifica se vem do novo formato (image_base64/pdf_base64)
    const { image_base64, pdf_base64, prompt } = body;

    if (!image_base64 && !pdf_base64) {
      return NextResponse.json({ error: 'Nenhuma imagem ou PDF fornecido.' }, { status: 400 });
    }

    const { data: configRows } = await supabaseAdmin.from('system_settings').select('key, value');
    const openRouterKey = configRows?.find(r => r.key === 'ai_api_key')?.value;
    const modelTarget = configRows?.find(r => r.key === 'ai_model')?.value || 'google/gemini-pro-vision';

    if (!openRouterKey) {
       return NextResponse.json({ error: 'Configuração da Chave de IA ausente no Painel Admin Supremo.' }, { status: 500 });
    }

    let messagesFormated: any[] = [];
    const systemInstruction = 'Você é um assistente cirúrgico que extrai pratos e categorias. Retorne EXCLUSIVAMENTE UM ARRAY JSON contendo: { "products": [{ "name": "Nome", "description": "ingredientes e etc", "price": 10.0, "category": "Categoria Exata" }] }. Nada de introduções ou marcação Markdown.';
    const finalPrompt = prompt || `Converta esse cardápio em JSON estrito.`;

    if (pdf_base64) {
       // Extract text locally from PDF buffer
       try {
           let pdfParse: any;
           if (typeof process !== 'undefined') {
              // Lazy require to avoid breaking Next.js Turbopack SSR static extraction
              pdfParse = require('pdf-parse');
           }
           
           if (!pdfParse) {
              throw new Error("Módulo PDF não suportado neste ambiente.");
           }

           const pdfBuffer = Buffer.from(pdf_base64, 'base64');
           const pdfData = await pdfParse(pdfBuffer);
           messagesFormated = [
             { role: 'system', content: systemInstruction },
             { role: 'user', content: `${finalPrompt}\n\n[CONTEÚDO DO PDF TEXTO]:\n${pdfData.text}` }
           ];
       } catch (err: any) {
           throw new Error('Falha ao desfragmentar texto do PDF. O servidor não pôde ler o formato PDF nativamente (' + err.message + '). Tire prints do PDF e envie como Imagem.');
       }
    } else if (image_base64) {
       // Sends Multimodal array to OpenRouter (works with claude-3, gemini-pro-vision, gpt-4v)
       messagesFormated = [
         { role: 'system', content: systemInstruction },
         { 
           role: 'user', 
           content: [
              { type: 'text', text: finalPrompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
           ]
         }
       ];
    }

    const apiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      { model: modelTarget, messages: messagesFormated },
      {
        headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
        timeout: 55000 
      }
    );

    const contentText = apiResponse.data.choices[0].message.content;
    const cleanedString = contentText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let aiPayload;
    try {
       aiPayload = JSON.parse(cleanedString); 
    } catch {
       return NextResponse.json({ error: 'A I.A perdeu o controle da formatação JSON. Tente de novo.', raw: cleanedString }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, products: aiPayload.products || aiPayload || [] });
    
  } catch (error: any) {
    console.error('AI Menu Import Failure:', error?.response?.data || error.message);
    if(error.code === 'ECONNABORTED') {
      return NextResponse.json({ error: 'O servidor de Inteligência Artificial demorou muito para responder. Tente novamente.' }, { status: 504 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
