import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Smartphone, TrendingUp, CreditCard, Layers, Package, Eye, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
}

const StatCard = ({ icon: Icon, label, value, trend }: StatCardProps) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="bg-amber-500/10 p-3 rounded-2xl">
        <Icon className="w-6 h-6 text-amber-500" />
      </div>
      {trend && (
        <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <p className="text-zinc-500 text-sm mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-white">{value}</h3>
  </motion.div>
);

const getIconForLabel = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes('lojista')) return Users;
  if (lower.includes('qr')) return Smartphone;
  if (lower.includes('receita')) return CreditCard;
  if (lower.includes('assinantes')) return TrendingUp;
  if (lower.includes('categorias')) return Layers;
  if (lower.includes('produtos')) return Package;
  if (lower.includes('visualizações')) return Eye;
  return Activity;
};

export const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    role: string;
    stats: { label: string; value: string; trend: string | null }[];
    chartTitle: string;
    chartData: { name: string; value: number }[];
  } | null>(null);

  useEffect(() => {
    api.get('/dashboard')
      .then(response => {
        setData(response.data);
      })
      .catch(error => console.error("Erro ao carregar dashboard", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats.map((stat, idx) => (
          <StatCard 
            key={idx}
            icon={getIconForLabel(stat.label)} 
            label={stat.label} 
            value={stat.value} 
            trend={stat.trend || undefined} 
          />
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
        <h3 className="text-xl font-serif text-white mb-8">{data.chartTitle}</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px' }}
                itemStyle={{ color: '#white' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#f59e0b" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
