import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ChartData {
  day: string;
  value: number;
}

interface SalesChartProps {
  data: ChartData[];
}

export const SalesChart = React.memo(({ data }: SalesChartProps) => {
  return (
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
  );
});

SalesChart.displayName = 'SalesChart';
