import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Clock, ChefHat, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  customer_name: string | null;
  status: string;
  total: number;
  notes: string | null;
  created_at: string;
  items: { product_name: string; quantity: number; unit_price: number }[];
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Pedido Recebido', icon: Package, color: 'text-amber-500' },
  { key: 'preparing', label: 'Em Preparo', icon: ChefHat, color: 'text-blue-500' },
  { key: 'ready', label: 'Pronto!', icon: CheckCircle2, color: 'text-green-500' },
];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrder() {
    if (!orderId) return;
    const { data: o } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!o) { setLoading(false); return; }

    const { data: items } = await (supabase as any)
      .from('order_items')
      .select('product_name, quantity, unit_price')
      .eq('order_id', orderId);

    setOrder({ ...o, items: items || [] });
    setLoading(false);
  }

  useEffect(() => {
    fetchOrder();
    // Realtime updates
    const channel = supabase
      .channel(`order-track-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, () => fetchOrder())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center gap-4">
        <Package className="w-12 h-12 text-muted-foreground/40" />
        <h1 className="text-xl font-bold">Pedido não encontrado</h1>
        <p className="text-muted-foreground text-sm">Verifique o link e tente novamente.</p>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md mx-auto px-6 py-12 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-2xl font-bold">Acompanhe seu Pedido</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {order.customer_name && `${order.customer_name} • `}
            {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-sm p-6 space-y-6">
          {STATUS_STEPS.map((step, i) => {
            const isActive = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={step.key} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isActive ? 'bg-primary/20' : 'bg-muted/50'
                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                  <step.icon className={`w-5 h-5 ${isActive ? step.color : 'text-muted-foreground/40'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isActive ? '' : 'text-muted-foreground/60'}`}>{step.label}</p>
                  {isCurrent && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-primary mt-0.5 flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" /> Status atual
                    </motion.p>
                  )}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 absolute ml-5 mt-14 ${isActive ? 'bg-primary/30' : 'bg-muted/30'}`} />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Order Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Itens do Pedido</h2>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
              <span>{item.quantity}x {item.product_name}</span>
              <span className="text-muted-foreground">{formatCurrency(item.unit_price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-sm pt-2">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
          {order.notes && (
            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg mt-2">📝 {order.notes}</p>
          )}
        </motion.div>

        <footer className="text-center text-xs text-muted-foreground/60 pt-4">
          Powered by <span className="text-gradient font-semibold">Menu Pro</span>
        </footer>
      </div>
    </div>
  );
}
