import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

interface TenantStatsProps {
  stats: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
  };
}

export const TenantStats = React.memo(({ stats }: TenantStatsProps) => {
  const items = [
    { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Ativos', value: stats.active, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Vencendo', value: stats.expiring, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Expirados', value: stats.expired, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass-sm p-4 flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">{stat.label}</p>
            <p className="text-2xl font-black leading-none">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

TenantStats.displayName = 'TenantStats';
