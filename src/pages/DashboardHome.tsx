import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Smartphone, TrendingUp, CreditCard, Layers, Package, Eye, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';
import api from '../services/api';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
  isLight: boolean;
  accentColor: string;
}

const StatCard = ({ icon: Icon, label, value, trend, isLight, accentColor }: StatCardProps) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`p-6 rounded-3xl border transition-colors ${
      isLight 
        ? 'bg-white border-slate-200 shadow-sm' 
        : 'bg-zinc-900 border-zinc-800'
    }`}
  >
    <div className="flex justify-between items-start mb-4">
      <div 
        className="p-3 rounded-2xl"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <Icon className="w-6 h-6" style={{ color: accentColor }} />
      </div>
      {trend && (
        <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <p className={`text-sm mb-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{label}</p>
    <h3 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</h3>
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
  const { theme, accentColor } = useThemeStore();
  const isLight = theme === 'light';
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
        <div 
          className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }}
        />
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
            isLight={isLight}
            accentColor={accentColor}
          />
        ))}
      </div>

      <div className={`p-8 rounded-3xl border ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
      }`}>
        <h3 className={`text-xl font-serif mb-8 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {data.chartTitle}
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isLight ? '#e2e8f0' : '#27272a'} 
                vertical={false} 
              />
              <XAxis 
                dataKey="name" 
                stroke={isLight ? '#94a3b8' : '#52525b'} 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke={isLight ? '#94a3b8' : '#52525b'} 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isLight ? '#ffffff' : '#18181b', 
                  border: `1px solid ${isLight ? '#e2e8f0' : '#27272a'}`, 
                  borderRadius: '16px',
                  color: isLight ? '#0f172a' : '#ffffff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={accentColor} 
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
