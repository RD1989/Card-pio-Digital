import { getEfiInstance } from '../_lib/efi';
import { supabaseAdmin } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  try {
    // Busca até 10 transações para não estourar o limite de tempo do Serverless da Vercel
    const { data: events, error } = await supabaseAdmin
      .from('webhook_events')
      .select('*')
      .eq('processed', false)
      .limit(10);

    if (error || !events || events.length === 0) {
      return res.status(200).json({ processed: 0 });
    }

    const efiApi = await getEfiInstance();
    let count = 0;

    for (const event of events) {
      const charge_id = event.charge_id;

      try {
        // 1. CONFIRMAÇÃO DIRETA NA FONTE
        // Aqui está o "Never Trust The Payload". Não olhamos o event.payload. 
        // Ligamos para o banco central da Efí e perguntamos o status daquela taxa.
        const pixRes = await efiApi.get(`/v2/cob/${charge_id}`);
        const statusReal = pixRes.data.status; // Para PIX da Efí o concluído é "CONCLUIDA"
        
        // Se ela ainda estiver apenas ATIVA ou DEVOLVIDA, ignoramos
        if (statusReal !== 'CONCLUIDA') {
           // Marcamos como pendente eternamente? Não, se expirou marcamos
           continue; 
        }

        // 2. BUSCA EVENTOS NO NOSSO BANCO
        const { data: pagamentoLog } = await supabaseAdmin
          .from('payments')
          .select('*')
          .eq('charge_id', charge_id)
          .single();

        if (!pagamentoLog) {
          // Cobrança via PIX que não foi gerada via nosso sistema (Pode ser doação?) 
          await supabaseAdmin.from('webhook_events').update({ processed: true }).eq('id', event.id);
          continue;
        }

        // Evita entregar a licença 2 vezes caso rodado por recuo duplo
        if (pagamentoLog.status === 'paid') {
          await supabaseAdmin.from('webhook_events').update({ processed: true }).eq('id', event.id);
          continue; 
        }

        const { user_id, plano, tipo } = pagamentoLog;
        const diasAAdicionar = plano.includes('anual') ? 365 : 180;
        const isVip = tipo === 'vip';

        // 3. Atualizar e Estender Validado do Lojista
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('premium_until, plan_status, trial_ends_at')
          .eq('user_id', user_id)
          .single();
        
        const now = new Date();
        let currentPremium = userProfile?.premium_until ? new Date(userProfile.premium_until) : null;
        let baseDate = (currentPremium && currentPremium > now) ? currentPremium : now;
        
        baseDate.setDate(baseDate.getDate() + diasAAdicionar);

        await supabaseAdmin.from('profiles').update({
          plan: plano,
          plan_status: 'active',
          is_active: true,
          premium_until: baseDate.toISOString(),
          setup_pendente: isVip // Marca o painel do Admin que esse usuário precisa de atendimento Onboarding Done-For-You
        }).eq('user_id', user_id);

        // 4. Marca o Log como Pago
        await supabaseAdmin.from('payments').update({
          status: 'paid'
        }).eq('charge_id', charge_id);

        // 5. Baixa o webhook
        await supabaseAdmin.from('webhook_events').update({
          processed: true
        }).eq('id', event.id);

        count++;

      } catch (innerErr) {
        console.error(`Falha ao processar TXID ${charge_id}`, innerErr);
        // Não marcamos processed = true para não perder a transação, ela tentará no próximo minuto
      }
    }

    return res.status(200).json({ processed: count });

  } catch (globalErr: any) {
    return res.status(500).json({ error: globalErr.message });
  }
}
