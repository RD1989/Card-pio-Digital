import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Eye, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';

interface DayData {
  date: string;
  views: number;
  orders: number;
  rate: number;
}

export default function Analytics() {
  const { impersonatedUserId } = useImpersonateStore();
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [dailyData, setDailyData] = useState<DayData[]>([]);

  const fetch = useCallback(async () => {
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userId = user.id;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    const [viewsRes, ordersRes] = await Promise.all([
      (supabase as any).from('menu_views').select('viewed_at').eq('restaurant_user_id', userId).gte('viewed_at', since),
      supabase.from('orders').select('created_at').eq('restaurant_user_id', userId).gte('created_at', since),
    ]);

    const views = (viewsRes.data || []) as any[];
    const orders = (ordersRes.data || []) as any[];

    setTotalViews(views.length);
    setTotalOrders(orders.length);
    setConversionRate(views.length > 0 ? (orders.length / views.length) * 100 : 0);

    // Group by day
    const days: Record<string, { views: number; orders: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { views: 0, orders: 0 };
    }

    views.forEach((v: any) => {
      const key = v.viewed_at.slice(0, 10);
      if (days[key]) days[key].views++;
    });
    orders.forEach((o: any) => {
      const key = o.created_at.slice(0, 10);
      if (days[key]) days[key].orders++;
    });

    const daily = Object.entries(days)
      .map(([date, d]) => ({
        date,
        views: d.views,
        orders: d.orders,
        rate: d.views > 0 ? (d.orders / d.views) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setDailyData(daily);
    setLoading(false);
  }, [impersonatedUserId]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxViews = Math.max(...dailyData.map(d => d.views), 1);

  const cards = [
    { label: 'Visitas (30d)', value: totalViews, icon: Eye, color: 'text-blue-500' },
    { label: 'Pedidos (30d)', value: totalOrders, icon: ShoppingCart, color: 'text-amber-500' },
    { label: 'Taxa de Conversão', value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Métricas de Conversão</h1>
        <p className="text-muted-foreground text-sm mt-1">Acessos ao cardápio vs pedidos realizados (últimos 30 dias)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-sm p-6 hover:scale-[1.02] transition-transform"
          >
            <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Simple bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-sm p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Visitas Diárias
        </h2>
        <div className="flex items-end gap-1 h-32">
          {dailyData.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-colors min-h-[2px]"
                style={{ height: `${(d.views / maxViews) * 100}%` }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: {d.views} visitas, {d.orders} pedidos
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{dailyData[0] ? new Date(dailyData[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}</span>
          <span>Hoje</span>
        </div>
      </motion.div>
    </div>
  );
}

