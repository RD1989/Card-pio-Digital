import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';

export interface PlanStatus {
  user_id: string;
  plan: string;
  planStatus: string;
  trialEndsAt: string | null;
  daysRemaining: number;
  isTrialExpired: boolean;
  isActive: boolean;
  monthlyOrders: number;
  orderLimit: number; // 0 = unlimited
}

export function usePlanStatus() {
  const { impersonatedUserId } = useImpersonateStore();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      let userId = impersonatedUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        userId = user.id;
      }

      const [profileRes, ordersRes] = await Promise.all([
        (supabase as any).from('profiles').select('plan, plan_status, trial_ends_at, is_active, order_limit, premium_until').eq('user_id', userId).single(),
        (supabase as any).rpc('count_monthly_orders', { _user_id: userId }),
      ]);

      const profile = profileRes.data;
      const monthlyOrders = ordersRes.data || 0;

      if (!profile) { setLoading(false); return; }

      const now = new Date();
      const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const premiumUntil = profile.premium_until ? new Date(profile.premium_until) : null;
      
      // Se tiver plano pago, os dias restantes são baseados no premium_until, senão no trial
      const expirationDate = premiumUntil || trialEnd;
      const daysRemaining = expirationDate ? Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
      
      const isTrialExpired = profile.plan_status === 'trial' && (!trialEnd || trialEnd < now);
      const isPremiumExpired = profile.plan_status === 'active' && premiumUntil && premiumUntil < now;
      const isExpired = profile.plan_status === 'expired' || profile.plan_status === 'inactive' || isPremiumExpired;
      const isDeactivated = profile.is_active === false;
      
      const isActive = !isDeactivated && !isExpired && (
        (profile.plan_status === 'active' && (!premiumUntil || premiumUntil > now)) || 
        (profile.plan_status === 'trial' && !isTrialExpired)
      );
      
      const orderLimit = 0; // Pedidos ilimitados para todos os planos por padrão

      setStatus({
        user_id: userId,
        plan: profile.plan || 'basic',
        planStatus: profile.plan_status || 'trial',
        trialEndsAt: profile.trial_ends_at,
        daysRemaining,
        isTrialExpired: isTrialExpired || isExpired || isDeactivated, 
        isActive,
        monthlyOrders,
        orderLimit,
      });
      setLoading(false);
    }
    fetch();

    // Iniciar listener de Tempo Real para o perfil do usuário
    let userIdSync: string | null = null;
    const setupRealtime = async () => {
      let currentId = impersonatedUserId;
      if (!currentId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentId = user?.id || null;
      }
      
      if (!currentId) return;
      userIdSync = currentId;

      const channel = supabase
        .channel(`profile_status_${userIdSync}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${userIdSync}`,
          },
          (payload) => {
            console.log('🔄 Mudança de perfil detectada!', payload);
            fetch(); // Forçar nova busca de dados quando o perfil mudar
          }
        )
        .subscribe((status) => {
          console.log(`🔌 Status da conexão Realtime: ${status}`);
        });

      return channel;
    };

    const channelPromise = setupRealtime();

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, [impersonatedUserId]);

  return { status, loading };
}

