const OPENROUTER_API_KEY = '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';

async function listModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
    });
    const data = await response.json();
    const fluxIds = ids.filter(id => id.toLowerCase().includes('flux'));
    console.log('Modelos Flux encontrados:', fluxIds);
    
    const blackForestIds = ids.filter(id => id.toLowerCase().includes('black-forest'));
    console.log('Modelos Black Forest encontrados:', blackForestIds);

    const imageIds = ids.filter(id => id.toLowerCase().includes('image'));
    console.log('Modelos com "image" encontrados:', imageIds);
  } catch (e) {
    console.error(e);
  }
}

listModels();
