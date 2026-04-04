import { Navigate, Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/shared/components/layout/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';
import { X, Eye, Loader2, Menu, Bell } from 'lucide-react';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { SuspensionOverlay } from '@/features/billing/components/SuspensionOverlay';
import { PlanBanner } from '@/features/billing/components/PlanBanner';
import { Button } from '@/shared/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBuzzerStore } from '@/shared/stores/global/useBuzzerStore';
import { useOrderNotificationSound } from '@/features/orders/hooks/useOrderNotificationSound';
import { toast } from 'sonner';

export function AdminLayout() {
  const { impersonatedUserId, impersonatedName, clearImpersonation } = useImpersonateStore();
  const { isSuperAdmin, loading: adminLoading } = useSuperAdmin();
  const { status: planStatus, loading: planLoading } = usePlanStatus();
  const { setRealtimeStatus } = useBuzzerStore();
  const { play: playNotification } = useOrderNotificationSound();

  const setupRealtime = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;

    console.log('[Buzzer] Configurando ouvinte global para:', userId);
    setRealtimeStatus('connecting');

    const channel = supabase
      .channel(`global-orders-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_user_id=eq.${userId}` },
        (payload) => {
          console.log('[Buzzer] Novo pedido detectado!', payload);
          playNotification();
          toast.info('🔔 Novo pedido recebido!', { 
            description: 'Verifique a aba de pedidos.',
            duration: 6000,
            action: {
              label: 'Ver Pedido',
              onClick: () => window.location.href = '/admin/orders'
            }
          });
        }
      )
      .subscribe((status) => {
        console.log(`[Buzzer] Status da conexão Realtime (${userId}):`, status);
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
      });

    return channel;
  }, [impersonatedUserId, playNotification, setRealtimeStatus]);

  useEffect(() => {
    let channelRef: any;
    setupRealtime().then(ch => { channelRef = ch; });
    return () => { if (channelRef) supabase.removeChannel(channelRef); };
  }, [setupRealtime]);

  if (adminLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          <div className="relative">
            <Loader2 className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-black tracking-widest uppercase opacity-70 animate-pulse">
                Iniciando Sessão Segura
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Preparando seu ambiente administrativo...
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
          >
            Clique para recarregar
          </button>
        </div>
      </div>
    );
  }

  if (isSuperAdmin && !impersonatedUserId && window.location.pathname === '/admin') {
    return <Navigate to="/super-admin" replace />;
  }

  const isSuspended = planStatus && !planStatus.isActive;
  // SÓ mostrar overlay se for um lojista logado ou um superadmin impersonando esse lojista
  const showSuspension = isSuspended && (!isSuperAdmin || !!impersonatedUserId);

  try {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background relative">
          <AdminSidebar />

          <div className="flex-1 flex flex-col min-w-0">
            {/* Impersonation Banner */}
            {impersonatedName && (
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between z-40">
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <Eye className="w-4 h-4" />
                  <span>Visualizando como: <strong className="font-bold">{impersonatedName}</strong></span>
                </div>
                <button
                  onClick={clearImpersonation}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1 rounded transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                  title="Sair da simulação"
                >
                  <X className="w-4 h-4" /> Sair
                </button>
              </div>
            )}

            <header className="h-14 flex items-center px-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
              <div className="md:hidden mr-3">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
              </div>
              <span className="text-gradient font-black text-lg md:hidden tracking-tight">Menu Pro</span>
              <div className="flex-1" />
              {planStatus && <PlanBanner status={planStatus} />}
            </header>
            
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-safe">
              <div className="max-w-[1600px] mx-auto w-full">
                {showSuspension ? (
                  <SuspensionOverlay />
                ) : (
                  <Outlet />
                )}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  } catch (renderError) {
    console.error('😭 Render Failure in AdminLayout:', renderError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-950 p-10 text-white">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Erro de Interface</h1>
          <p className="text-sm opacity-80">Falha ao desenhar os componentes do painel administrativo.</p>
          <Button 
            className="w-full bg-white text-red-950 hover:bg-white/90 font-bold"
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          >
            Limpar Cache e Recarregar
          </Button>
        </div>
      </div>
    );
  }
}
