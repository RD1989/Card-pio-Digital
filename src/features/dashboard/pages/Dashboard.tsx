import { motion } from 'framer-motion';
import { DashboardSkeleton } from '@/shared/components/common/Skeletons';
import { BarChart3, Users, BookOpen, TrendingUp, Package, ShoppingCart, Check, Sparkles, ExternalLink, Loader2, ChevronRight, ChefHat } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { useOrderNotificationSound } from '@/features/orders/hooks/useOrderNotificationSound';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { PlanBanner } from '@/features/billing/components/PlanBanner';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [chartData, setChartData] = useState<{ day: string; value: number }[]>([]);
  const [pixLoading, setPixLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;
    setCurrentUserId(userId);

    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [prodRes, ordersRes, profRes] = await Promise.all([
        supabase.from('products').select('id, is_active').eq('user_id', userId),
        supabase.from('orders').select('id, total, created_at, status, customer_name').eq('restaurant_user_id', userId).order('created_at', { ascending: false }).limit(100),
        supabase.from('profiles').select('slug').eq('user_id', userId).single(),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (ordersRes.error) throw ordersRes.error;

      if (profRes.error && (profRes.error as any).code !== 'PGRST116') throw profRes.error;

      const products = prodRes.data || [];
      const orders = (ordersRes.data || []) as any[];
      if (profRes.data) setSlug(profRes.data.slug);
      const todayOrders = orders.filter(o => new Date(o.created_at) >= today);

      setStats({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length,
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
        todayRevenue: todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
      });

      setRecentOrders(orders.slice(0, 8));

      // Generate Chart Data (Last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dayOrders = orders.filter(o => isSameDay(new Date(o.created_at), d));
        return {
          day: format(d, 'EEE', { locale: ptBR }),
          value: dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
        };
      });
      setChartData(last7Days);
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
  const { play: playNotification } = useOrderNotificationSound();

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
      const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Meu Painel</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Visão geral do seu negócio em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl h-11" onClick={() => fetchStats()}>
            <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="rounded-2xl h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" onClick={() => window.open('/menu/' + (slug || currentUserId))}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Cardápio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-6 group hover:translate-y-[-4px] transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-16 h-16" />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground font-semibold">{stat.label}</span>
            </div>
            <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass p-8 min-h-[400px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Vendas (Últimos 7 dias)</h2>
              <p className="text-xs text-muted-foreground font-medium">Desempenho semanal em R$</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[11px] font-bold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              +15% esta semana
            </div>
          </div>

          <div className="flex-1 w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' 
                  }}
                  itemStyle={{ fontWeight: 800, color: 'hsl(var(--primary))' }}
                  labelStyle={{ fontSize: 10, fontWeight: 600, color: 'gray', marginBottom: 4 }}
                  formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Vendas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold tracking-tight">Últimos Pedidos</h2>
            <Button variant="ghost" size="sm" className="text-xs h-7 rounded-lg" onClick={() => window.location.href = '/admin/orders'}>Ver todos</Button>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-2 no-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-30 text-center">
                <ShoppingCart className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">Nenhum pedido</p>
              </div>
            ) : (
              recentOrders.map((order, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-transparent hover:border-black/[0.05] dark:hover:border-white/[0.05] transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                    order.status === 'preparing' ? 'bg-blue-500/10 text-blue-500' :
                    order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{order.customer_name || 'Cliente Online'}</p>
                    <p className="text-[11px] text-muted-foreground">{format(new Date(order.created_at), 'HH:mm')} • R$ {Number(order.total).toFixed(2)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <ChefHat className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-primary italic uppercase tracking-wider">Cozinha Ativa</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}



