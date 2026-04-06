import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, UserCheck, UserX, TrendingUp,
  ShoppingCart, DollarSign, Activity, Store, Settings, Layout, BarChart3,
  Calendar, ArrowUpRight, TrendingDown,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

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
    totalUsers: 0, activeUsers: 0, inactiveUsers: 0,
    totalOrders: 0, totalRevenue: 0, todayOrders: 0, todayRevenue: 0,
    recentUsers: [],
    chartData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
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
        totalRevenue: orders.reduce((s: number, o: any) => s + Number(o.total), 0),
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s: number, o: any) => s + Number(o.total), 0),
        recentUsers: profiles.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 10),
        chartData
      });
      setLoading(false);
    }
    loadMetrics();
  }, []);

  const cards = [
    { label: 'Total Lojistas', value: metrics.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Ativos', value: metrics.activeUsers, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Inativos', value: metrics.inactiveUsers, icon: UserX, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Pedidos Hoje', value: metrics.todayOrders, icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Receita Hoje', value: `R$ ${metrics.todayRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Receita Total', value: `R$ ${metrics.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const quickLinks = [
    { title: 'Configurações Globais', desc: 'API OpenRouter, Pix', icon: Settings, href: '/super-admin/settings', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Customizar Landing', desc: 'Planos, textos, CTA', icon: Layout, href: '/super-admin/landing', color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { title: 'Gerenciar Lojistas', desc: 'Acessar, impersonar, suporte', icon: Store, href: '/super-admin/tenants', color: 'text-primary', bg: 'bg-primary/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Painel Super Admin</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Métricas globais e gestão do sistema</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-sm p-4 sm:p-5 group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
              </div>
              <Activity className="w-3 h-3 text-muted-foreground/30" />
            </div>
            <p className="text-xl sm:text-2xl font-black leading-none">{card.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-sm p-6 sm:p-8 flex flex-col min-h-[350px]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Crescimento de Lojistas</h2>
              <p className="text-xs text-muted-foreground font-medium">Novas contas nos últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
              Total: {metrics.totalUsers}
            </div>
          </div>

          <div className="flex-1 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 800, color: 'hsl(var(--primary))', fontSize: 12 }}
                  labelStyle={{ fontSize: 10, fontWeight: 700, color: 'gray', marginBottom: 4 }}
                  formatter={(val: number) => [val, 'Novos Lojistas']}
                />
                <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-sm p-6 sm:p-8 flex flex-col min-h-[350px]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Faturamento Global (R$)</h2>
              <p className="text-xs text-muted-foreground font-medium">Volume transacionado no sistema</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              Hoje: R$ {metrics.todayRevenue.toFixed(0)}
            </div>
          </div>

          <div className="flex-1 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 800, color: '#10b981', fontSize: 12 }}
                  labelStyle={{ fontSize: 10, fontWeight: 700, color: 'gray', marginBottom: 4 }}
                  formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Vendas']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {quickLinks.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
          >
            <Link
              to={link.href}
              className="flex items-center gap-4 sm:flex-col sm:items-start glass-sm p-4 sm:p-5 hover:translate-y-[-4px] transition-all group rounded-2xl border-white/40"
            >
              <div className={`w-10 h-10 rounded-2xl ${link.bg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                <link.icon className={`w-5 h-5 ${link.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{link.title}</h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{link.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Users */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-sm rounded-xl overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Lojistas Recentes
          </h2>
          <Link to="/super-admin/tenants" className="text-xs text-primary hover:underline font-medium">
            Ver todos →
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left bg-muted/20">
                <th className="px-5 py-3 font-medium">Restaurante</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Plano</th>
                <th className="px-5 py-3 font-medium">Cadastro</th>
                <th className="px-5 py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentUsers.map((u, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                  <td className="px-5 py-3 font-medium">{u.restaurant_name}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">/menu/{u.slug}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize font-semibold">
                      {u.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link to="/super-admin/tenants" className="text-xs text-primary hover:underline font-medium">
                      Gerenciar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-border/50">
          {metrics.recentUsers.map((u, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{u.restaurant_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${u.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {u.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold capitalize">
                    {u.plan || 'free'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(u.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
