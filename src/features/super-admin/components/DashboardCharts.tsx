import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  day: string;
  users: number;
  revenue: number;
}

interface DashboardChartsProps {
  data: ChartData[];
  totalUsers: number;
  todayRevenue: number;
}

export const DashboardCharts = React.memo(({ data, totalUsers, todayRevenue }: DashboardChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lojistas Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-sm p-6 sm:p-8 flex flex-col min-h-[350px]"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Crescimento de Lojistas</h2>
            <p className="text-xs text-muted-foreground font-medium">Novas contas nos últimos 7 dias</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
            Total: {totalUsers}
          </div>
        </div>

        <div className="flex-1 w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} 
                dy={10} 
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' 
                }}
                itemStyle={{ fontWeight: 800, color: 'hsl(var(--primary))', fontSize: 12 }}
                labelStyle={{ fontSize: 10, fontWeight: 700, color: 'gray', marginBottom: 4 }}
                formatter={(val: number) => [val, 'Novos Lojistas']}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="hsl(var(--primary))" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorUsers)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="glass-sm p-6 sm:p-8 flex flex-col min-h-[350px]"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Faturamento Global (R$)</h2>
            <p className="text-xs text-muted-foreground font-medium">Volume transacionado no sistema</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            Hoje: R$ {todayRevenue.toFixed(0)}
          </div>
        </div>

        <div className="flex-1 w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} 
                dy={10} 
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' 
                }}
                itemStyle={{ fontWeight: 800, color: '#10b981', fontSize: 12 }}
                labelStyle={{ fontSize: 10, fontWeight: 700, color: 'gray', marginBottom: 4 }}
                formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Vendas']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorRev)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
});

DashboardCharts.displayName = 'DashboardCharts';
