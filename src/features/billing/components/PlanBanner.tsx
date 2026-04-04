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

    const channel = supabase
      .channel(`profile_active_check_${status.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${status.user_id}`,
        },
        (payload) => {
          if (payload.new.is_active === true && (payload.old?.is_active === false || !payload.old)) {
            triggerSuccess();
          }
        }
      );
      
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
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
        className="w-full max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4 backdrop-blur-sm shadow-sm"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center gradient-border shadow-inner">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold tracking-tight">
            Trial Gratuito — {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            Plano {plan === 'pro' ? 'Pro' : 'Básico'} • Pedidos e recursos ilimitados
          </p>
        </div>
        <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black italic rounded-md shadow-lg shadow-primary/20">
          TESTE GRÁTIS
        </div>
      </motion.div>
    );
  }

  // State: Suspended / Pending payment
  if (isTrialExpired) {
    return null; // O Dashboard já mostra os cards de redirecionamento para WhatsApp
  }

  // Active state UI
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-background p-4 flex items-center gap-4 backdrop-blur-sm shadow-sm"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center gradient-border shadow-inner">
        {plan === 'pro' ? <Crown className="w-6 h-6 text-primary" /> : <Zap className="w-6 h-6 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold tracking-tight">
          Sua conta está Ativa — Plano {plan === 'pro' ? 'Pro' : 'Básico'}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          Pedidos e recursos ilimitados liberados
        </p>
      </div>
      <div className="px-3 py-1 bg-green-500 text-white text-[10px] font-black italic rounded-md shadow-lg shadow-green-500/20 uppercase">
        ATIVO
      </div>
    </motion.div>
  );
}
