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
    let isMounted = true;
    const failsafeTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.error("🚨 FAILSAFE: O carregamento do plano demorou mais de 5s. Forçando renderização.");
        setLoading(false);
      }
    }, 5000);

    async function fetch() {
      if (!isMounted) return;
      setLoading(true);
      let foundUserId: string | null = impersonatedUserId;

      try {
        if (!foundUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { setLoading(false); return; }
          foundUserId = user.id;
        }

        console.log(`🔍 Iniciando busca de plano para: ${foundUserId} (Simulado: ${!!impersonatedUserId})`);

        const [profileRes, ordersRes] = await Promise.all([
          (supabase as any).from('profiles').select('plan, plan_status, trial_ends_at, is_active, order_limit, premium_until').eq('user_id', foundUserId).single(),
          (supabase as any).rpc('count_monthly_orders', { _user_id: foundUserId }),
        ]).catch(err => {
          console.error("❌ Erro crítico nas queries do usePlanStatus:", err);
          return [ { data: null, error: err }, { data: 0, error: err } ];
        });

        const profile = profileRes.data;
        const monthlyOrders = ordersRes.data || 0;

        if (!profile) { 
          console.warn(`⚠️ Perfil não encontrado para o usuário ${foundUserId}`);
          if (isMounted) setLoading(false); 
          return; 
        }

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

        console.group('🛡️ Verificação de Plano (usePlanStatus)');
        console.log('User ID:', foundUserId);
        console.log('Status no Perfil:', profile.plan_status);
        console.log('Ativo (is_active):', !isDeactivated);
        console.log('Expirado:', isExpired);
        console.log('Premium Até:', premiumUntil?.toLocaleString('pt-BR'));
        console.log('Duração Trial:', trialEnd?.toLocaleString('pt-BR'));
        console.log('Resulta em Ativo:', isActive);
        console.groupEnd();
        
        const orderLimit = profile.order_limit || 0;

        if (isMounted) {
          setStatus({
            user_id: foundUserId,
            plan: profile.plan || 'basic',
            planStatus: profile.plan_status || 'trial',
            trialEndsAt: profile.trial_ends_at,
            daysRemaining,
            isTrialExpired: isTrialExpired || isExpired || isDeactivated, 
            isActive,
            monthlyOrders,
            orderLimit,
          });
        }
      } catch (err) {
        console.error("❌ Falha catastrófica ao processar status do plano:", err);
        if (isMounted) {
          setStatus({
            user_id: foundUserId || 'unknown',
            plan: 'basic',
            planStatus: 'trial',
            trialEndsAt: null,
            daysRemaining: 0,
            isTrialExpired: false,
            isActive: true, // Failsafe: se falhar tudo, deixamos ativo para não bloquear o usuário por erro do sistema
            monthlyOrders: 0,
            orderLimit: 9999,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(failsafeTimeout);
        }
      }
    }
    
    fetch();

    // Iniciar listener de Tempo Real para o perfil do usuário
    let channel: any = null;
    const setupRealtime = async () => {
      try {
        let currentId = impersonatedUserId;
        if (!currentId) {
          const { data: { user } } = await supabase.auth.getUser();
          currentId = user?.id || null;
        }
        
        if (!currentId) return;

        // Se já houver um canal, remova-o antes de recriar
        if (channel) {
          supabase.removeChannel(channel);
        }

        // Criar novo canal com timestamp para garantir unicidade
        channel = supabase
          .channel(`profile_status_${currentId}_${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles',
              filter: `user_id=eq.${currentId}`,
            },
            (payload: any) => {
              console.log('🔄 Mudança de perfil detectada no Realtime!', payload);
              fetch(); // Forçar nova busca de dados quando o perfil mudar
            }
          )
          .subscribe((status: string) => {
            console.log(`🔌 Conexão Realtime (Status): ${status}`);
          });
      } catch (err) {
        console.error("❌ Erro ao configurar Realtime no usePlanStatus:", err);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      clearTimeout(failsafeTimeout);
      if (channel) {
        console.log('🧹 Limpando canal de Realtime');
        supabase.removeChannel(channel);
      }
    };
  }, [impersonatedUserId]);

  return { status, loading };
}

