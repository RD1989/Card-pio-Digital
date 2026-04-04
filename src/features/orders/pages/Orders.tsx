import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, ChefHat, CheckCircle2, Loader2, Search, Filter, ExternalLink, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { useOrderNotificationSound } from '@/features/orders/hooks/useOrderNotificationSound';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { OrderPrint } from '@/features/orders/components/OrderPrint';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  total: number;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any; next?: string }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500', icon: Clock, next: 'preparing' },
  preparing: { label: 'Em Preparo', color: 'bg-blue-500/10 text-blue-500', icon: ChefHat, next: 'ready' },
  ready: { label: 'Pronto', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2, next: 'delivered' },
  delivered: { label: 'Entregue', color: 'bg-primary/10 text-primary', icon: Package },
};

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Orders() {
  const { impersonatedUserId } = useImpersonateStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [restaurantName, setRestaurantName] = useState('Restaurante');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { play: playNotification, init: initNotification, isReady: isNotificationReady } = useOrderNotificationSound();
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');

  const getUserId = useCallback(async () => {
    if (impersonatedUserId) return impersonatedUserId;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, [impersonatedUserId]);

  const fetchOrders = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) { setLoading(false); return; }

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    const orderList = (ordersData || []) as any[];

    if (orderList.length > 0) {
      const orderIds = orderList.map(o => o.id);
      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, product_name, quantity, unit_price')
        .in('order_id', orderIds);

      const itemsMap: Record<string, OrderItem[]> = {};
      (items || []).forEach((item: any) => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push(item);
      });

      setOrders(orderList.map(o => ({ ...o, items: itemsMap[o.id] || [] })));

      // Fetch restaurant name
      const { data: profile } = await supabase.from('profiles').select('restaurant_name').eq('user_id', userId).single();
      if (profile) setRestaurantName(profile.restaurant_name);
    } else {
      setOrders([]);
    }
    setLoading(false);
  }, [getUserId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime order list refresh
  useEffect(() => {
    let channelRef: any;
    const setup = async () => {
      const userId = await getUserId();
      if (!userId) return;
      
      const channel = supabase
        .channel(`orders-ui-refresh-${userId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders', 
          filter: `restaurant_user_id=eq.${userId}` 
        }, () => { fetchOrders(); })
        .subscribe();
      return channel;
    };
    setup().then(ch => { channelRef = ch; });
    return () => { if (channelRef) supabase.removeChannel(channelRef); };
  }, [fetchOrders, getUserId]);

  async function updateStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus } as any)
      .eq('id', orderId);
    if (error) { toast.error('Erro ao atualizar status'); return; }
    toast.success(`Status atualizado para ${STATUS_MAP[newStatus]?.label || newStatus}`);
    fetchOrders();
  }

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (o.customer_name?.toLowerCase().includes(q) || o.id.includes(q));
    }
    return true;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Pedidos</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe e gerencie todos os pedidos em tempo real</p>
      </div>


      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'pending', 'preparing', 'ready', 'delivered'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_MAP[s]?.label} ({statusCounts[s]})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-sm p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Package className="w-10 h-10 opacity-40" />
          <p>Nenhum pedido encontrado</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((order) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-sm p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{order.customer_name || 'Cliente'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          {order.customer_phone && ` • ${order.customer_phone}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-border/50 pt-2 space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.notes && (
                      <p className="text-xs bg-muted/30 p-2 rounded-lg mt-1">📝 {order.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {status.next && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, status.next!)}
                        className="gap-1.5 h-8 text-xs"
                      >
                        {status.next === 'preparing' && <><ChefHat className="w-3 h-3" /> Iniciar Preparo</>}
                        {status.next === 'ready' && <><CheckCircle2 className="w-3 h-3" /> Marcar Pronto</>}
                        {status.next === 'delivered' && <><Package className="w-3 h-3" /> Marcar Entregue</>}
                      </Button>
                    )}
                    <a
                      href={`/order/${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Tracking
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(order)}
                      className="gap-1.5 h-8 text-xs ml-auto"
                    >
                      <Printer className="w-3 h-3" /> Imprimir
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Printer Component (Rendered only during print) */}
      {printingOrder && (
        <OrderPrint order={printingOrder} restaurantName={restaurantName} ref={printRef} />
      )}
    </div>
  );
}




