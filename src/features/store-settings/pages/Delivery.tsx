import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Printer, Clock, CheckCircle2, ChefHat, Truck, XCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'>;

interface OrderWithItems extends Order {
  items?: OrderItem[];
  isNew?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pendente', icon: Clock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  preparing: { label: 'Preparando', icon: ChefHat, color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  ready: { label: 'Pronto', icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  delivered: { label: 'Entregue', icon: Truck, color: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export default function Delivery() {
  const { impersonatedUserId } = useImpersonateStore();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribe() {
      let userId = impersonatedUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!userId && user) userId = user.id;
      }
      if (!userId) return;

      channel = supabase
        .channel('live-orders')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_user_id=eq.${userId}` },
          async (payload) => {
            const newOrder = payload.new as Order;
            // Fetch items for this order
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', newOrder.id);

            const orderWithItems: OrderWithItems = { ...newOrder, items: items || [], isNew: true };
            setOrders(prev => [orderWithItems, ...prev]);
            playSound();
            toast.success(`🔔 Novo pedido de ${newOrder.customer_name || 'Cliente'}!`);

            // Remove glow after 10s
            setTimeout(() => {
              setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, isNew: false } : o));
            }, 10000);
          }
        )
        .subscribe();
    }

    subscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [playSound]);

  async function fetchOrders() {
    setLoading(true);
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userId = user.id;
    }

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map(o => o.id);
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      const ordersWithItems: OrderWithItems[] = ordersData.map(o => ({
        ...o,
        items: (itemsData || []).filter(i => i.order_id === o.id),
      }));
      setOrders(ordersWithItems);
    } else {
      setOrders([]);
    }
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: string) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) { toast.error('Erro ao atualizar'); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status } : null);
    toast.success(`Status: ${STATUS_CONFIG[status]?.label}`);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden audio */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVoyfKzN5L2ASzOFt9TnuIBeQJO52eKnb0lDl7fT3J9wT1Cds83UmHBUWKa1xtOUc1ldqa3Ay4x0YmWqp7u/jnpiaqakvriQfnBtqJ+ru5eMgXtwcKGnr7mYjIJ5daOhp7KRkI2JiKqhobCDkpGUn7CilJ6Ci5Keo6yrmJ2HkJifnqGpm5yclp+cmJqYl5qampycnJ6en5ycnJycnJydnZ2dnZ2dnZ6enp6enp6fn5+fn5+fn5+goKCgoKChoaGhoaGhoaGhoaGioqKioqKioqKjo6Ojo6OjpKSkpKSkpKSlpaWlpaWlpaampqampqanp6enp6enp6ioqKioqKipqampqampqaqqqqqqqqurq6urq6ysrKysrKysra2tra2tra2urq6urq6vr6+vr6+vr7CwsLCwsLCxsbGxsbGxsbKysrKysrKzs7Ozs7OztLS0tLS0tLS1tbW1tbW1trW1tbW1trW2tra2tra3t7e3t7e3t7i4uLi4uLi5ubm5ubm5urq6urq6uru7u7u7u7u8vLy8vLy8vb29vb29vb6+vr6+vr6/v7+/v7+/wMDAwMDAwMHBwcHBwcHCwsLCwsLC" type="audio/wav" />
      </audio>

      <div className="space-y-6 print:space-y-2">
        {/* Header - hidden on print */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Centro de Comando</h1>
            <p className="text-muted-foreground text-sm mt-1">Pedidos em tempo real</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={soundEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gap-2"
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {soundEnabled ? 'Som Ativo' : 'Ativar Som'}
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Orders List */}
          <div className="flex-1 space-y-3 print:hidden">
            {orders.length === 0 ? (
              <div className="glass-sm p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <Package className="w-10 h-10 opacity-40" />
                <p>Nenhum pedido ainda</p>
                <p className="text-xs">Pedidos aparecerão aqui em tempo real</p>
              </div>
            ) : (
              <AnimatePresence>
                {orders.map((order) => {
                  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = config.icon;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedOrder(order)}
                      className={`glass-sm p-4 cursor-pointer transition-all hover:scale-[1.01] ${
                        selectedOrder?.id === order.id ? 'ring-2 ring-primary/50' : ''
                      } ${order.isNew ? 'animate-pulse ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${config.color}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{order.customer_name || 'Cliente'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {' • '}
                              {order.items?.length || 0} itens
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-sm">R$ {Number(order.total).toFixed(2)}</p>
                          <Badge variant="outline" className={`text-[10px] mt-1 ${config.color}`}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Order Detail / Print Receipt */}
          <div className="w-96 shrink-0 hidden lg:block">
            {selectedOrder ? (
              <div className="glass-sm p-6 space-y-4 print:shadow-none print:border-none print:p-0 print:rounded-none" id="receipt">
                <div className="flex items-center justify-between print:hidden">
                  <h3 className="font-bold">Detalhes do Pedido</h3>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                    <Printer className="w-3.5 h-3.5" /> Imprimir
                  </Button>
                </div>

                {/* Receipt content */}
                <div className="space-y-3 print:text-black">
                  <div className="text-center border-b border-dashed border-border pb-3 print:border-black">
                    <h2 className="font-bold text-lg print:text-xl">Menu Pro</h2>
                    <p className="text-xs text-muted-foreground print:text-gray-600">
                      {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p><strong>Cliente:</strong> {selectedOrder.customer_name || '—'}</p>
                    <p><strong>Telefone:</strong> {selectedOrder.customer_phone || '—'}</p>
                    {selectedOrder.notes && <p><strong>Obs:</strong> {selectedOrder.notes}</p>}
                  </div>

                  <div className="border-t border-dashed border-border pt-3 print:border-black">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground print:text-gray-600">
                          <th className="text-left pb-2">Item</th>
                          <th className="text-center pb-2">Qtd</th>
                          <th className="text-right pb-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item) => (
                          <tr key={item.id} className="border-b border-border/50 last:border-0 print:border-gray-300">
                            <td className="py-1.5">{item.product_name}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-right">R$ {(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-dashed border-border pt-3 print:border-black">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary print:text-black">R$ {Number(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Status buttons */}
                <div className="grid grid-cols-2 gap-2 print:hidden">
                  {['pending', 'preparing', 'ready', 'delivered'].map((s) => {
                    const c = STATUS_CONFIG[s];
                    const Icon = c.icon;
                    return (
                      <Button
                        key={s}
                        variant={selectedOrder.status === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateStatus(selectedOrder.id, s)}
                        className="gap-1 text-xs"
                      >
                        <Icon className="w-3 h-3" /> {c.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-sm p-12 text-center text-muted-foreground print:hidden">
                <p className="text-sm">Selecione um pedido para ver detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

