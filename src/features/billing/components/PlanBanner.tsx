import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, Crown, Zap, Copy, Check, X, QrCode as QrIcon } from 'lucide-react';
import { PlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';

interface Props {
  status: PlanStatus;
}

export function PlanBanner({ status }: Props) {
  const { plan, planStatus, daysRemaining, isTrialExpired } = status;
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!status.user_id) return;
    let channel: any = null;

    const setup = async () => {
      try {
        // Nome único para evitar conflito "after subscribe"
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
        // Silenciar erro do realtime para não derrubar o site
        console.warn('⚠️ Falha silenciosa no Realtime do PlanBanner:', err);
      }
    };

    // Pequeno atraso para o setup, reduzindo concorrência em re-renders
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

  // State: Celebration / Success
  if (isSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl mx-auto rounded-3xl border-2 border-primary/40 bg-primary/10 backdrop-blur-xl p-10 flex flex-col items-center justify-center text-center space-y-4 overflow-hidden relative min-h-[300px]"
      >
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 1 }}
          className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.5)]"
        >
          <Check className="w-10 h-10 text-white stroke-[4px]" />
        </motion.div>
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">Plano Ativado!</h2>
          <p className="text-muted-foreground font-medium">Seu acesso foi liberado. Aproveite seu Dashboard.</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
      </motion.div>
    );
  }

  // State: Trial active
  if (planStatus === 'trial' && !isTrialExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-2 md:p-3 flex items-center gap-2 md:gap-4 backdrop-blur-sm shadow-sm"
      >
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-xs font-bold tracking-tight truncate">
            {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
          </p>
          <p className="hidden md:block text-[10px] text-muted-foreground line-clamp-1">
            Plano {plan === 'pro' ? 'Pro' : 'Básico'} • Trial
          </p>
        </div>
        <div className="hidden xs:block px-2 py-0.5 bg-primary text-primary-foreground text-[8px] font-black italic rounded shadow-sm shrink-0">
          TRIAL
        </div>
      </motion.div>
    );
  }

  // Active state UI
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-background p-2 md:p-3 flex items-center gap-2 md:gap-4 backdrop-blur-sm shadow-sm"
    >
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {plan === 'pro' ? <Crown className="w-4 h-4 md:w-5 md:h-5 text-primary" /> : <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] md:text-xs font-bold tracking-tight truncate">
          Plano {plan === 'pro' ? 'Pro' : 'Básico'}
        </p>
        <p className="hidden md:block text-[10px] text-muted-foreground line-clamp-1">
          Acesso Total Liberado
        </p>
      </div>
      <div className="hidden xs:block px-2 py-0.5 bg-green-500 text-white text-[8px] font-black italic rounded shadow-sm shrink-0 uppercase">
        ATIVO
      </div>
    </motion.div>
  );
}
