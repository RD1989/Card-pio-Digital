import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ExternalLink, Eye, ShoppingCart, TrendingUp, Package, BarChart3 } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardSkeleton } from '@/shared/components/common/Skeletons';

// Components
import { MetricCards } from '../components/MetricCards';
import { SalesChart } from '../components/SalesChart';
import { RecentOrders } from '../components/RecentOrders';

export default function Dashboard() {
  const { impersonatedUserId } = useImpersonateStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    todayViews: 0,
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

      const [prodRes, ordersRes, profRes, viewsRes] = await Promise.all([
        supabase.from('products').select('id, is_active').eq('user_id', userId),
        supabase.from('orders').select('id, total, created_at, status, customer_name').eq('restaurant_user_id', userId).order('created_at', { ascending: false }).limit(100),
        supabase.from('profiles').select('slug').eq('user_id', userId).single(),
        (supabase as any).from('menu_views').select('id', { count: 'exact', head: true }).eq('restaurant_user_id', userId).gte('viewed_at', today.toISOString()),
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
        todayViews: (viewsRes as any).count || 0,
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

  const cards = useMemo(() => [
    { label: 'Visitas Hoje', value: String(stats.todayViews), icon: Eye, index: 0 },
    { label: 'Pedidos Hoje', value: String(stats.todayOrders), icon: ShoppingCart, index: 1 },
    { label: 'Receita Hoje', value: `R$ ${stats.todayRevenue.toFixed(2)}`, icon: TrendingUp, index: 2 },
    { label: 'Produtos Ativos', value: `${stats.activeProducts}`, icon: Package, index: 3 },
    { label: 'Total Pedidos', value: String(stats.totalOrders), icon: BarChart3, index: 4 },
  ], [stats]);

  const { status: planStatus, loading: planLoading } = usePlanStatus();

  if (loading || planLoading) return <DashboardSkeleton />;

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
          <Button className="rounded-2xl h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" onClick={() => window.open('/' + (slug || currentUserId))}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Cardápio
          </Button>
        </div>
      </div>

      <MetricCards cards={cards} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesChart data={chartData} />
        <RecentOrders orders={recentOrders} />
      </div>
    </div>
  );
}
