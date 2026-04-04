import { motion } from 'framer-motion';
import { DashboardSkeleton } from '@/shared/components/common/Skeletons';
import { BarChart3, Users, BookOpen, TrendingUp, Package, ShoppingCart, Check, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { useOrderNotificationSound } from '@/features/orders/hooks/useOrderNotificationSound';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { PlanBanner } from '@/features/billing/components/PlanBanner';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

export default function Dashboard() {
  const { impersonatedUserId } = useImpersonateStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<{ customer_name: string | null; total: number; created_at: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  // Removido busca de links Cakto pois agora usamos Pix Próprio
  const [pixData, setPixData] = useState<{ qrcode: string; copyPaste: string; amount: string } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userId = user.id;
    }

    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [prodRes, ordersRes] = await Promise.all([
        supabase.from('products').select('id, is_active').eq('user_id', userId),
        supabase.from('orders').select('id, total, created_at, status, customer_name').eq('restaurant_user_id', userId).order('created_at', { ascending: false }).limit(100),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const products = prodRes.data || [];
      const orders = (ordersRes.data || []) as any[];
      const todayOrders = orders.filter(o => new Date(o.created_at) >= today);

      setStats({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length,
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
        todayRevenue: todayOrders.reduce((sum, o) => sum + Number(o.total), 0),
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      console.error("Erro ao carregar estatísticas do dashboard:", err);
      toast.error("Alguns dados do dashboard não puderam ser carregados.");
    } finally {
      setLoading(false);
    }
  }, [impersonatedUserId]);

  useEffect(() => {
    const checkIp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabase.functions.invoke('check-ip-abuse');
        if (data?.blocked) {
          toast.error(data.message, { duration: 10000 });
          fetchStats(); // Recarregar para refletir o is_active = false
        }
      } catch (err) {
        console.error("Erro na verificação de IP:", err);
      }
    };
    
    checkIp();
    fetchStats();
  }, [fetchStats]);

  // Realtime: listen for new/updated orders and auto-refresh
  const playNotification = useOrderNotificationSound();

  useEffect(() => {
    let userId = impersonatedUserId;
    const setup = async () => {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }
      const channel = supabase
        .channel('dashboard-orders-rt')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_user_id=eq.${userId}` },
          () => { playNotification(); fetchStats(); }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_user_id=eq.${userId}` },
          () => { fetchStats(); }
        )
        .subscribe();
      return channel;
    };
    let channelRef: Awaited<ReturnType<typeof setup>>;
    setup().then(ch => { channelRef = ch; });
    return () => { if (channelRef) supabase.removeChannel(channelRef); };
  }, [fetchStats, impersonatedUserId, playNotification]);
  const handleActivatePlan = (planType: 'monthly' | 'basic' | 'pro') => {
    const messages = {
      monthly: "Olá! Quero renovar meu Plano Mensal.",
      basic: "Olá! Quero renovar meu Plano Semestral.",
      pro: "Olá! Quero renovar meu Plano Anual.",
    };
    
    const whatsapp = "22996051620";
    const text = encodeURIComponent(messages[planType]);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  };

  const cards = [
    { label: 'Pedidos Hoje', value: String(stats.todayOrders), icon: ShoppingCart },
    { label: 'Receita Hoje', value: `R$ ${stats.todayRevenue.toFixed(2)}`, icon: TrendingUp },
    { label: 'Produtos Ativos', value: `${stats.activeProducts}`, icon: Package },
    { label: 'Total Pedidos', value: String(stats.totalOrders), icon: BarChart3 },
  ];

  const { status: planStatus, loading: planLoading } = usePlanStatus();
  const { isSuperAdmin } = useSuperAdmin();

  if (loading || planLoading) return <DashboardSkeleton />;

  const isSuspended = planStatus && !planStatus.isActive;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Meu Painel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral do seu restaurante • Atualização em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-sm p-6 group hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-shadow">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="glass-sm p-8"
          >
            <h2 className="text-lg font-semibold mb-4">Pedidos Recentes</h2>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido recebido ainda</p>
              ) : (
                recentOrders.map((order, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      order.status === 'pending' ? 'bg-amber-500' :
                      order.status === 'preparing' ? 'bg-blue-500' :
                      order.status === 'ready' ? 'bg-green-500' : 'bg-muted-foreground'
                    }`} />
                    <span className="text-sm text-muted-foreground flex-1">
                      {order.customer_name || 'Cliente'} — R$ {Number(order.total).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
    </div>
  );
}



