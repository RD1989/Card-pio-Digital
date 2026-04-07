import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, ShoppingCart, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface DashboardMetricsProps {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    todayOrders: number;
    todayRevenue: number;
    totalRevenue: number;
  };
}

export const DashboardMetrics = React.memo(({ metrics }: DashboardMetricsProps) => {
  const cards = [
    { label: 'Total Lojistas', value: metrics.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Ativos', value: metrics.activeUsers, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Inativos', value: metrics.inactiveUsers, icon: UserX, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Pedidos Hoje', value: metrics.todayOrders, icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Receita Hoje', value: `R$ ${metrics.todayRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Receita Total', value: `R$ ${metrics.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
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
  );
});

DashboardMetrics.displayName = 'DashboardMetrics';
