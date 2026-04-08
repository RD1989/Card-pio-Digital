import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrderNotificationSound } from './useOrderNotificationSound';
import { useBuzzerStore } from '@/shared/stores/global/useBuzzerStore';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { toast } from 'sonner';

export function useGlobalOrderTracker() {
  const { play: playNotification } = useOrderNotificationSound();
  const { setRealtimeStatus } = useBuzzerStore();
  const { impersonatedUserId } = useImpersonateStore();
  
  const previousInstanceOrders = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef<boolean>(false);
  
  const getUserId = useCallback(async () => {
    if (impersonatedUserId) return impersonatedUserId;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, [impersonatedUserId]);

  const fetchOrderIds = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) return;

    // Obtém apenas IDs para poupar banda máxima via polling
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('restaurant_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const currentIds = new Set((data || []).map((o: any) => o.id));

    if (!initialLoadDone.current) {
      previousInstanceOrders.current = currentIds;
      initialLoadDone.current = true;
      return;
    }

    let hasNew = false;
    currentIds.forEach(id => {
       if (!previousInstanceOrders.current.has(id)) {
           hasNew = true;
           // Pode notificar ID a ID ou agrupar
       }
    });

    if (hasNew) {
       console.log('[Buzzer Tracker] Novo(s) pedido(s) encontrado(s) pelo varredor!');
       playNotification();
       toast.info('🔔 Novo pedido recebido!', {
         description: 'Verifique a aba de pedidos do Painel.',
         duration: 8000,
         action: {
           label: 'Abrir Pedidos',
           onClick: () => window.location.href = '/admin/orders'
         }
       });
    }

    previousInstanceOrders.current = currentIds;
  }, [getUserId, playNotification]);

  // Invoca o polling a cada 25s
  useEffect(() => {
    fetchOrderIds(); // loop 1
    const interval = setInterval(fetchOrderIds, 25000); 
    
    return () => clearInterval(interval);
  }, [fetchOrderIds]);

  // Invoca também a engine Websocket para acelerar, mas não depender exclusivamente dele.
  useEffect(() => {
    let channelRef: any;

    const setup = async () => {
      const userId = await getUserId();
      if (!userId) return;

      setRealtimeStatus('connecting');

      const channel = supabase
        .channel(`global-orders-tracker-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `restaurant_user_id=eq.${userId}` },
          () => {
            fetchOrderIds();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
        });
        
      return channel;
    };

    setup().then(ch => { channelRef = ch; });
    return () => { if (channelRef) supabase.removeChannel(channelRef); };
  }, [getUserId, fetchOrderIds, setRealtimeStatus]);
}
