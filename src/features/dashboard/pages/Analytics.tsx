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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;

    try {
      const { data, error } = await supabase.rpc('get_daily_metrics', { 
        _restaurant_user_id: userId, 
        _days: 30 
      });

      if (error) throw error;

      const metrics = (data || []) as any[];
      
      const viewsTotal = metrics.reduce((sum, d) => sum + Number(d.views), 0);
      const ordersTotal = metrics.reduce((sum, d) => sum + Number(d.orders), 0);
      
      setTotalViews(viewsTotal);
      setTotalOrders(ordersTotal);
      setConversionRate(viewsTotal > 0 ? (ordersTotal / viewsTotal) * 100 : 0);

      const daily = metrics.map(d => ({
        date: d.metric_date,
        views: Number(d.views),
        orders: Number(d.orders),
        rate: Number(d.views) > 0 ? (Number(d.orders) / Number(d.views)) * 100 : 0,
      }));

      setDailyData(daily);
    } catch (err) {
      console.error("Erro ao carregar analytics:", err);
    } finally {
      setLoading(false);
    }
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

