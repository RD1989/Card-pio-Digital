import { writeFileSync } from 'fs';
import { join } from 'path';

const OPENROUTER_API_KEY = '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';
const IMAGES_DIR = 'C:\\Users\\Suporte\\.gemini\\antigravity\\brain\\886a3f68-5591-4c6f-922e-cec87c5257b1';

async function main() {
  console.log('🧪 Iniciando TESTE PILOTO (Filé Salada) via OpenRouter Multimodal...');
  
  const prompt = 'Professional studio food photography of a Steak Filé Salad burger. Tender grilled steak fillet strips, fresh green lettuce, and red juicy tomato. Bright studio lighting, clean stone background.';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux.2-pro',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        include_images: true,
        modalities: ['image']
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // Tentar encontrar a imagem no formato esperado pelo subagent
    // choices[0].message.images OR choices[0].message.content[...]
    console.log('Estrutura da resposta recebida:', JSON.stringify(data, null, 2));

    const imageObj = data.choices?.[0]?.message?.images?.[0] || data.choices?.[0]?.message?.content?.[0]?.image_url;
    
    if (!imageObj) {
      throw new Error('Nenhuma imagem encontrada na resposta da API.');
    }

    const imageUrl = imageObj.url;
    
    let buffer;
    if (imageUrl.startsWith('data:image')) {
      // Formato Base64
      const base64Data = imageUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
      console.log('✅ Imagem recebida em formato Base64.');
    } else {
      // Formato URL
      const imgRes = await fetch(imageUrl);
      buffer = Buffer.from(await imgRes.arrayBuffer());
      console.log('✅ Imagem recebida em formato URL.');
    }

    const filename = 'pilot_file_salada.png';
    writeFileSync(join(IMAGES_DIR, filename), buffer);
    
    console.log(`\n🎉 SUCESSO! Piloto salvo em: ${filename}`);
  } catch (error) {
    console.error('❌ Erro no Piloto:', error.message);
  }
}

main().catch(console.error);
