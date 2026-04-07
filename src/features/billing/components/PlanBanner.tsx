import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Crown, Zap, Check, Star, Info, Rocket } from 'lucide-react';
import { PlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  status: PlanStatus;
}

export function PlanBanner({ status }: Props) {
  const { plan, planStatus, daysRemaining, isTrialExpired } = status;
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Controle de Slide do Letreiro
  const slides = [
    {
      id: 'plan-status',
      icon: planStatus === 'trial' ? <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> : (plan === 'pro' ? <Crown className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> : <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />),
      title: planStatus === 'trial' ? `${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restantes` : `Plano ${plan === 'pro' ? 'Pro' : 'Básico'}`,
      subtitle: planStatus === 'trial' ? `Plano ${plan === 'pro' ? 'Pro' : 'Básico'} • Trial` : 'Acesso Total Liberado',
      tag: planStatus === 'trial' ? 'TRIAL' : 'ATIVO',
      tagColor: planStatus === 'trial' ? 'bg-amber-500 text-amber-950' : 'bg-green-500 text-white'
    },
    {
      id: 'feature-ia',
      icon: <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />,
      title: 'Importe usando PDFs',
      subtitle: 'Use nossa IA para criar seu cardápio em segundos',
      tag: 'NOVIDADE',
      tagColor: 'bg-amber-400 text-amber-950'
    },
    {
      id: 'feature-dashboard',
      icon: <Info className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />,
      title: 'Painel em Tempo Real',
      subtitle: 'Acompanhe todos os seus pedidos online',
      tag: 'DICA',
      tagColor: 'bg-amber-300 text-amber-950'
    },
    {
      id: 'feature-marketing',
      icon: <Rocket className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />,
      title: 'Campanhas via WhatsApp',
      subtitle: 'Envie cupons na seção Ferramentas de Marketing',
      tag: 'NOVIDADE',
      tagColor: 'bg-amber-400 text-amber-950'
    }
  ];

  // Alterna o slide a cada 5 segundos
  useEffect(() => {
    if (isSuccess || (planStatus === 'trial' && isTrialExpired)) return;
    
    const maxIndex = slides.length - 1;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [isSuccess, planStatus, isTrialExpired, slides.length]);

  // Listener para aprovação do Pagamento
  useEffect(() => {
    if (!status.user_id) return;
    let channel: any = null;

    const setup = async () => {
      try {
        const channelName = `active_check_${status.user_id}_${Math.random().toString(36).substring(7)}`;
        
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `user_id=eq.${status.user_id}`,
            },
            (payload: any) => {
              if (payload.new?.is_active === true && (payload.old?.is_active === false || !payload.old)) {
                triggerSuccess();
              }
            }
          );
          
        await channel.subscribe();
      } catch (err) {
        console.warn('⚠️ Falha silenciosa no Realtime do PlanBanner:', err);
      }
    };

    const timer = setTimeout(setup, 100);
 
    return () => { 
      clearTimeout(timer);
      if (channel) supabase.removeChannel(channel).catch(() => {});
    };
  }, [status.user_id]);

  const triggerSuccess = () => {
    setIsSuccess(true);
    toast.success('✨ Acesso Liberado! Aproveite seu Dashboard.', {
      duration: 5000,
      icon: '🎉'
    });
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl mx-auto rounded-3xl border-2 border-amber-500/40 bg-amber-500/10 backdrop-blur-xl p-10 flex flex-col items-center justify-center text-center space-y-4 overflow-hidden relative min-h-[300px]"
      >
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 1 }}
          className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)]"
        >
          <Check className="w-10 h-10 text-white stroke-[4px]" />
        </motion.div>
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-amber-500 tracking-tighter uppercase leading-none">Plano Ativado!</h2>
          <p className="text-muted-foreground font-medium">Seu acesso foi liberado. Aproveite seu Dashboard.</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none" />
      </motion.div>
    );
  }

  // Se expirar o trial, não mostra o banner porque existe um bloqueio de tela inteira
  if (planStatus === 'trial' && isTrialExpired) return null;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center bg-black/50 border-x border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)_inset]">
      <motion.div
        animate={{ x: ["100%", "-100%"] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        className="flex items-center gap-16 whitespace-nowrap px-4 tracking-widest text-lg font-black uppercase text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]"
      >
        <span className="flex items-center gap-3">
          {planStatus === 'trial' ? <Clock className="w-6 h-6" /> : (plan === 'pro' ? <Crown className="w-6 h-6" /> : <Zap className="w-6 h-6" />)}
          {planStatus === 'trial' ? `${daysRemaining} DIAS RESTANTES • PLANO TRIAL` : `PLANO PREMIUM • ATIVO`}
        </span>
        <span className="flex items-center gap-3">
          <Star className="w-6 h-6" /> IMPORTAÇÃO POR PDF: EXPERIMENTE AGORA
        </span>
        <span className="flex items-center gap-3">
          <Rocket className="w-6 h-6" /> CAMPANHAS: ENVIE PARA SEUS CLIENTES
        </span>
        <span className="flex items-center gap-3">
          <Info className="w-6 h-6" /> DASHBOARD EM TEMPO REAL: GERENCIE TUDO
        </span>
      </motion.div>
    </div>
  );
}
