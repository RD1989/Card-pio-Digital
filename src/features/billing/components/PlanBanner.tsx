import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, Crown, Zap, Copy, Check, QrCode as QrIcon } from 'lucide-react';
import { PlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';

interface Props {
  status: PlanStatus;
  onPixStatusChange?: (hasPending: boolean) => void;
}

export function PlanBanner({ status, onPixStatusChange }: Props) {
  const { plan, planStatus, daysRemaining, isTrialExpired, monthlyOrders, orderLimit } = status;
  const [pixData, setPixData] = useState<{ qrcode: string; copyPaste: string; amount: string; id?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-fetch pending charges on mount
  useEffect(() => {
    async function fetchPending() {
      if (!status.user_id) return;
      
      const { data: intent } = await (supabase as any)
        .from('pix_intents')
        .select('*')
        .eq('user_id', status.user_id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (intent && intent.pix_code) {
        setPixData({
          id: intent.id,
          qrcode: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(intent.pix_code)}&size=300x300`,
          copyPaste: intent.pix_code,
          amount: intent.amount?.toString() || '0.00',
        });
        if (onPixStatusChange) onPixStatusChange(true);
      }
    }
    fetchPending();
  }, [status.user_id, onPixStatusChange]);

  // Listener Realtime
  useEffect(() => {
    if (!status.user_id) return;

    const channel = supabase
      .channel(`pix_updates_${status.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pix_intents',
          filter: pixData?.id ? `id=eq.${pixData.id}` : `user_id=eq.${status.user_id}`,
        },
        (payload) => {
          if (payload.new.status === 'completed') {
            triggerSuccess();
          }
        }
      )
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
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [status.user_id, pixData?.id]);

  const triggerSuccess = () => {
    setIsSuccess(true);
    toast.success('✨ Pagamento Confirmado! Seu acesso foi liberado.', {
      duration: 5000,
      icon: '🎉'
    });
    setTimeout(() => {
      if (onPixStatusChange) onPixStatusChange(false);
    }, 3000);
  };

  const handleCopy = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
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
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto rounded-[2rem] border-2 border-destructive/20 bg-gradient-to-b from-destructive/5 to-background p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest border border-destructive/20 mx-auto">
              <AlertTriangle className="w-3.5 h-3.5" />
              Assinatura Pendente
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tighter leading-tight">Acesso Limitado</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O período de teste do Plano {plan.toUpperCase()} expirou. <br className="hidden md:block" />
              Escolha um plano para reativar seu cardápio e continuar vendendo.
            </p>
          </div>

          <AnimatePresence>
            {pixData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-[380px] mx-auto rounded-[2rem] border-2 border-primary/10 bg-background/40 backdrop-blur-2xl p-6 lg:p-8 relative shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <QrIcon className="w-16 h-16" />
                </div>

                <div className="space-y-8 text-center relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic">PAGAMENTO VIA PIX</span>
                    <div className="text-5xl font-black flex items-center justify-center gap-1 text-foreground tracking-tighter">
                      <span className="text-xl font-medium text-primary/40 mr-1">R$</span>
                      {pixData.amount}
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase opacity-70 tracking-widest">Plano {plan.toUpperCase()} Mensal</p>
                  </div>

                  <div className="relative group mx-auto max-w-[220px]">
                    <div className="absolute -inset-3 bg-gradient-to-r from-primary via-blue-400 to-primary rounded-[2.5rem] blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-pulse" />
                    <div className="relative bg-white p-4 rounded-[2rem] border border-primary/10 shadow-xl overflow-hidden">
                      <img
                        src={pixData.qrcode}
                        alt="QR Code Pix"
                        className="w-full aspect-square object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/95 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                        <p className="text-white font-black text-xs tracking-widest uppercase text-center px-4 leading-tight">Escaneie o QR Code</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex flex-col gap-3">
                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl backdrop-blur-md">
                        <input
                          readOnly
                          value={pixData.copyPaste}
                          className="w-full bg-transparent border-none text-[10px] font-mono text-center focus:ring-0 text-muted-foreground truncate"
                        />
                      </div>
                      <Button 
                        onClick={handleCopy} 
                        size="lg" 
                        className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95 group font-bold"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />}
                        <span className="text-xs font-black uppercase tracking-wider">{copied ? 'Copiado!' : 'Copiar Código Pix'}</span>
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 py-2.5 rounded-lg border border-primary/10">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      Aguardando Pagamento...
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
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
