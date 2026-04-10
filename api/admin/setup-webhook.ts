import { getEfiInstance } from '../_lib/efi';
import { getGlobalSetting, supabaseAdmin } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  // Configurando CORS para Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas chamadas via POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { webhookUrl, admin_key } = req.body; // webhookUrl sugerida: https://seudominio.com/api/webhook/efi
    
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Falta webhookUrl' });
    }
    
    // Simples proteção de autorização baseada no banco
    if (!admin_key || admin_key !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
       // fallback de Auth (ideal passar session, mas para serverless setup admin bypass simplificado)
       // Vamos permitir se vier da origem configurada ou usando um Master Password
       return res.status(401).json({ error: 'Sem autorização' });
    }

    const chavePix = await getGlobalSetting('efi_pix_key');
    if (!chavePix) {
      return res.status(400).json({ error: 'Chave Pix não encontrada nas configurações em Global Settings.' });
    }

    const efiApi = await getEfiInstance();

    // REGISTRO DE WEBHOOK PULAR MTLS (REGRA DA SKILL PARA VERCEL)
    const response = await efiApi.put(
      `/v2/webhook/${chavePix}`, 
      { webhookUrl },
      { headers: { 'x-skip-mtls-checking': 'true' } }
    );

    return res.status(200).json({ 
      ok: true, 
      message: 'Webhook registrado com sucesso!',
      efi_response: response.data 
    });

  } catch (err: any) {
    console.error('Falha ao registrar webhook Efí:', err.response?.data || err.message);
    return res.status(500).json({ 
      error: 'Erro na Efí Bank', 
      details: err.response?.data || err.message 
    });
  }
}
