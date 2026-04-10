import { writeFileSync } from 'fs';
import { join } from 'path';

const OPENROUTER_API_KEY = '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';
const IMAGES_DIR = 'C:\\Users\\Suporte\\.gemini\\antigravity\\brain\\886a3f68-5591-4c6f-922e-cec87c5257b1';

const ITEMS_TO_GENERATE = [
  { name: 'Filé Salada', filename: 'file_salada_standard.png', prompt: 'Professional studio food photography of a Steak Filé Salad burger. Tender grilled steak fillet strips, fresh green lettuce, and red juicy tomato. Bright studio lighting, clean stone background.' },
  { name: 'Filé Tudo', filename: 'file_tudo_standard.png', prompt: 'Professional studio food photography of a massive "Filé Tudo" burger. Thinly sliced grilled steak, ham, melted mozzarella, crispy bacon, fried egg, corn, and fresh salad. Stacked high, appetizing, gourmet look.' },
  { name: 'Filé Completo', filename: 'file_completo_standard.png', prompt: 'Professional studio food photography of a "Filé Completo" burger. Grilled steak strips, ham, mozzarella, fried egg, bacon, and salad. Clean presentation, high-end burger shop style.' },
  { name: 'Batata Frita Pequena', filename: 'batata_pequena_standard.png', prompt: 'Professional studio food photography of a small portion of golden, crispy french fries in a premium wooden bowl. Scattered sea salt, side of ketchup, warm lighting.' },
  { name: 'Batata Frita Grande', filename: 'batata_grande_standard.png', prompt: 'Professional studio food photography of a large, overflowing basket of crispy golden french fries. Steam rising, gourmet dipping sauces on the side, clean background.' },
  { name: 'Refrigerante Litro', filename: 'refrigerante_litro_standard.png', prompt: 'Professional studio product photography of a 1L soda bottle, ice cold with water droplets, condensation. Glossy finish, vibrant colors, clean studio background.' },
  { name: 'Refrigerante Lata', filename: 'refrigerante_lata_standard.png', prompt: 'Professional studio product photography of a cold soda can surrounded by ice cubes. Condensation droplets, refreshing look, bright lighting.' },
  { name: 'Cerveja Lata', filename: 'cerveja_lata_standard.png', prompt: 'Professional studio product photography of a cold beer can. Frosted texture, condensation, premium beer look, dark elegant background.' },
  { name: 'Molho de Alho', filename: 'molho_alho_standard.png', prompt: 'Professional studio food photography of a small ceramic bowl containing creamy white garlic sauce. Herbs on top, side of bread sticks, warm appetizer lighting.' },
  { name: 'Molho de Casa', filename: 'molho_casa_standard.png', prompt: 'Professional studio food photography of a small bowl with a special pink/orange house sauce. Signature look, gourmet dip, high-end burger restaurant presentation.' },
];

async function generateImage(item) {
  console.log(`🎨 Gerando imagem para: ${item.name}...`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-schnell', // Modelo de alta qualidade e rapidez
        prompt: item.prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    const imageUrl = data.data[0].url;
    console.log(`🔗 URL obtida: ${imageUrl}`);

    // Download da imagem
    const imageRes = await fetch(imageUrl);
    const buffer = await imageRes.arrayBuffer();
    
    const filePath = join(IMAGES_DIR, item.filename);
    writeFileSync(filePath, Buffer.from(buffer));
    
    console.log(`✅ Salvo em: ${item.filename}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao gerar "${item.name}":`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando geração do Lote 2 via OpenRouter (10 imagens)...\n');
  
  let successCount = 0;
  for (const item of ITEMS_TO_GENERATE) {
    const success = await generateImage(item);
    if (success) successCount++;
    // Pequeno atraso para evitar rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n🎉 Finalizado! ${successCount}/10 imagens geradas.`);
}

main().catch(console.error);
