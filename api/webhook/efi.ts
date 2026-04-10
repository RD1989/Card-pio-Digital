import { supabaseAdmin, getGlobalSetting } from '../_lib/supabase.js';

export default async function handler(req: any, res: any) {
  // O Webhook é acionado exclusivamente via POST pela Efí
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    // 1. TRAVA DE SEGURANÇA: Token Automático (Opção 1 - Suporte a URL Query)
    // Busca o Token de Webhook previamente cadastrado na sua página de Painel Super Admin
    const efiWebhookToken = await getGlobalSetting('efi_webhook_token');
    
    // Suporte tanto para Header quanto para Query String (mais garantido para Efí)
    const receivedToken = req.query.token || req.headers['x-webhook-token'];
    
    if (efiWebhookToken && receivedToken !== efiWebhookToken) {
      console.error('🚨 Tentativa de Webhook não autorizada. Token inválido ou ausente.');
      return res.status(401).end();
    }

    // 2. TRAVA DO DESAFIO (Handshake da API Efí)
    // O primeiro PING que a Efí faz para cadastrar o webhook vem VAZIO sem array "pix"
    if (!req.body || !req.body.pix) {
      return res.status(200).json({ received: true });
    }

    // 3. Recebe o Evento real (A matriz devolve um array 'pix')
    const eventosPix = req.body.pix;

    // Inserimos todos na fila de processamento sem bloquear o Vercel Timeout
    for (const pix of eventosPix) {
      const charge_id = pix.txid;
      
      // Inserção na Tabela Assíncrona de Eventos
      await supabaseAdmin.from('webhook_events').insert({
        charge_id,
        payload: pix
      });
    }

    // 4. RETORNO IMEDIATO (< 2s) PARA EVITAR QUE A EFÍ PARE DE MANDAR
    return res.status(200).json({ ok: true });

  } catch (err: any) {
    // Erros críticos de processamento nunca devem estourar 4xx ou 5xx para a API bancária,
    // Senão ela tenta refazer o ping a cada 1 hora ou desativa o sistema.
    console.error('❌ Falha interna ao processar Efí Webhook:', err.message);
    return res.status(200).json({ error_ignored: true });
  }
}
