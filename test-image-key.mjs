import { writeFileSync } from 'fs';
import { join } from 'path';

const OPENROUTER_API_KEY = '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';

async function testGeneration() {
  const prompt = 'Professional studio food photography of a gourmet double cheeseburger with melting cheddar, crispy bacon, and caramelized onions. High-end lighting, dark wood background, 8k resolution.';
  const filename = 'test-result.png';

  console.log(`🎨 Testando geração de imagem com a nova chave API...`);
  console.log(`📝 Prompt: ${prompt}`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sourceful/riverflow-v2-fast',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const jsonString = JSON.stringify(data);

    // Estratégia de extração via Regex do script original
    const urlMatch = jsonString.match(/"url":\s*"(https:\/\/openrouter\.ai\/api\/v1\/images\/[^"]+)"/) || 
                     jsonString.match(/"url":\s*"(data:image\/[^"]+)"/);

    if (!urlMatch) {
      console.error('DEBUG - Resposta completa:', jsonString);
      throw new Error('URL da imagem não encontrada na resposta do OpenRouter.');
    }

    const imageUrl = urlMatch[1];
    console.log(`🔗 URL da imagem gerada: ${imageUrl}`);

    console.log(`⏳ Baixando imagem...`);
    const imageRes = await fetch(imageUrl);
    const buffer = await imageRes.arrayBuffer();
    
    const filePath = join(process.cwd(), filename);
    writeFileSync(filePath, Buffer.from(buffer));
    
    console.log(`✅ Sucesso! Imagem salva em: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro no teste:`, error.message);
    return false;
  }
}

testGeneration();
