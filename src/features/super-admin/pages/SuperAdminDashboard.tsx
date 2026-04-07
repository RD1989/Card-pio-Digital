import { useEffect, useState, useCallback } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

// Components
import { DashboardMetrics } from '../components/DashboardMetrics';
import { DashboardCharts } from '../components/DashboardCharts';
import { QuickLinks } from '../components/QuickLinks';
import { RecentTenants } from '../components/RecentTenants';

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  recentUsers: { restaurant_name: string; slug: string; created_at: string; is_active: boolean; plan: string }[];
  chartData: { day: string; users: number; revenue: number }[];
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0, 
    activeUsers: 0, 
    inactiveUsers: 0,
    totalOrders: 0, 
    totalRevenue: 0, 
    todayOrders: 0, 
    todayRevenue: 0,
    recentUsers: [],
    chartData: [],
  });
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('restaurant_name, slug, created_at, is_active, plan'),
        supabase.from('orders' as any).select('total, created_at'),
      ]);

      const profiles = (profilesRes.data || []) as any[];
      const orders = (ordersRes.data || []) as any[];
      const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);

      // Generate Last 7 Days Chart Data
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dayUsers = profiles.filter(p => isSameDay(new Date(p.created_at), d)).length;
        const dayRevenue = orders.filter(o => isSameDay(new Date(o.created_at), d))
                                .reduce((s, o) => s + Number(o.total || 0), 0);
        return {
          day: format(d, 'EEE', { locale: ptBR }),
          users: dayUsers,
          revenue: dayRevenue
        };
      });

      setMetrics({
        totalUsers: profiles.length,
        activeUsers: profiles.filter(p => p.is_active).length,
        inactiveUsers: profiles.filter(p => !p.is_active).length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
        recentUsers: [...profiles].sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 10),
        chartData
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Painel Super Admin</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 font-medium">Métricas globais e gestão estratégica do sistema</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <DashboardMetrics metrics={metrics} />

      {/* Charts Section */}
      <DashboardCharts 
        data={metrics.chartData} 
        totalUsers={metrics.totalUsers} 
        todayRevenue={metrics.todayRevenue} 
      />

      {/* Quick Links */}
      <QuickLinks />

      {/* Recent Users */}
      <RecentTenants tenants={metrics.recentUsers} />
    </div>
  );
}
