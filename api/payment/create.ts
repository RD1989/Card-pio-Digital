import crypto from 'crypto';
import { getEfiInstance } from '../_lib/efi.js';
import { supabaseAdmin, getGlobalSetting } from '../_lib/supabase.js';

export default async function handler(req: any, res: any) {
  // Configurando CORS para Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, plano } = req.body;

    if (!user_id || !plano) {
      return res.status(400).json({ error: 'Parâmetros user_id e plano são obrigatórios' });
    }

    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('restaurant_name')
      .eq('user_id', user_id)
      .single();

    if (!userProfile) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const planosCardapio: any = {
      semestral: { valor: 129.00, tipo: "self_service" },
      anual: { valor: 229.00, tipo: "self_service" },
      semestral_vip: { valor: 197.00, tipo: "vip" },
      anual_vip: { valor: 297.00, tipo: "vip" }
    };

    const p = planosCardapio[plano];
    if (!p) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    const efiApi = await getEfiInstance();
    const chavePix = await getGlobalSetting('efi_pix_key');

    if (!chavePix) {
      return res.status(500).json({ error: 'Chave Pix não configurada no Gateway' });
    }

    // 1. Criar a cobrança Imediata (Cob)
    const cobPayload = {
      calendario: { expiracao: 3600 }, // 1 hora de validade
      valor: { original: p.valor.toFixed(2) },
      chave: chavePix,
      solicitacaoPagador: `Plano ${plano} - ${userProfile.restaurant_name}`,
      infoAdicionais: [
        { nome: 'Plataforma', valor: 'Menu Pro' },
        { nome: 'user_id', valor: user_id },
        { nome: 'plano', valor: plano },
        { nome: 'tipo', valor: p.tipo }
      ]
    };

    // Gera TxId aleatório de 35 chars usando crypto ESM
    const txid = crypto.randomBytes(16).toString('hex') + 'abc'; 

    const response = await efiApi.put(`/v2/cob/${txid}`, cobPayload);
    const chargeData = response.data;

    // 2. Gerar o QR Code para exibir
    const locId = chargeData.loc.id;
    const qrCodeResponse = await efiApi.get(`/v2/loc/${locId}/qrcode`);
    
    // 3. Salvar intenção na tabela `payments`
    await supabaseAdmin.from('payments').insert({
      user_id,
      charge_id: txid,
      plano,
      tipo: p.tipo,
      valor: p.valor,
      status: 'pending',
      pix_qr_code: qrCodeResponse.data.imagemQrcode,
      pix_copy_paste: qrCodeResponse.data.qrcode
    });

    return res.status(200).json({
      ok: true,
      txid,
      qrCodeImage: qrCodeResponse.data.imagemQrcode,
      qrCodeCopyPaste: qrCodeResponse.data.qrcode,
      valor: p.valor
    });

  } catch (error: any) {
    console.error('❌ Erro na geração de cobrança Efí:', error.response?.data || error.message);
    return res.status(500).json({ error: error.message || 'Falha ao processar pagamento' });
  }
}
