import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, UserCheck, UserX, TrendingUp, ShoppingCart, DollarSign, Activity, Store, Settings, Layout, BarChart3 } from 'lucide-react';
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
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0, activeUsers: 0, inactiveUsers: 0,
    totalOrders: 0, totalRevenue: 0, todayOrders: 0, todayRevenue: 0,
    recentUsers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('restaurant_name, slug, created_at, is_active, plan'),
        supabase.from('orders' as any).select('total, created_at'),
      ]);

      const profiles = (profilesRes.data || []) as any[];
      const orders = (ordersRes.data || []) as any[];

      const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);

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
      });
      setLoading(false);
    }
    fetch();
  }, []);

  const cards = [
    { label: 'Total Lojistas', value: metrics.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Ativos', value: metrics.activeUsers, icon: UserCheck, color: 'text-green-500' },
    { label: 'Inativos', value: metrics.inactiveUsers, icon: UserX, color: 'text-red-500' },
    { label: 'Pedidos Hoje', value: metrics.todayOrders, icon: ShoppingCart, color: 'text-amber-500' },
    { label: 'Receita Hoje', value: `R$ ${metrics.todayRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Receita Total', value: `R$ ${metrics.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
  ];

  const quickLinks = [
    { title: 'Configurações Globais', desc: 'API OpenRouter, Efí Bank', icon: Settings, href: '/super-admin/settings' },
    { title: 'Customizar Landing', desc: 'Planos, textos, CTA', icon: Layout, href: '/super-admin/landing' },
    { title: 'Gerenciar Lojistas', desc: 'Acessar, impersonar, suporte', icon: Store, href: '/super-admin/tenants' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Painel Super Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Métricas globais e gestão do sistema</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-sm p-5 group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <Activity className="w-3 h-3 text-muted-foreground/40" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <Link to={link.href} className="block glass-sm p-5 hover:scale-[1.02] transition-transform group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:glow-primary transition-shadow">
                <link.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{link.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{link.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Lojistas Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="pb-3 font-medium">Restaurante</th>
                <th className="pb-3 font-medium hidden sm:table-cell">Slug</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium hidden md:table-cell">Plano</th>
                <th className="pb-3 font-medium hidden lg:table-cell">Cadastro</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentUsers.map((u, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-medium">{u.restaurant_name}</td>
                  <td className="py-3 text-muted-foreground hidden sm:table-cell">/menu/{u.slug}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                      {u.plan || 'free'}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/super-admin/tenants`}
                      className="text-xs text-primary hover:underline"
                    >
                      Gerenciar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
