import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, CreditCard, Activity, Building2, UserPlus, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
  color?: string;
}

const StatCard = ({ icon: Icon, label, value, trend, color = "amber" }: StatCardProps) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 transition-colors group-hover:bg-${color}-500/20`}>
        <Icon className={`w-6 h-6 text-${color}-500`} />
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

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    stats: { label: string; value: string; trend: string | null }[];
    chartTitle: string;
    chartData: { name: string; value: number }[];
  } | null>(null);

  useEffect(() => {
    // Reutilizando o endpoint /dashboard que o backend já trata como admin
    api.get('/dashboard')
      .then(response => {
        setData(response.data);
      })
      .catch(error => console.error("Erro ao carregar dashboard admin", error))
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

  const getIconForLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('total lojistas')) return Building2;
    if (lower.includes('novos')) return UserPlus;
    if (lower.includes('receita')) return CreditCard;
    if (lower.includes('scan')) return Zap;
    return Activity;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-serif italic text-white">Panorama Global SaaS</h1>
         <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Sistema Ativo</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats.map((stat, idx) => (
          <StatCard 
            key={idx}
            icon={getIconForLabel(stat.label)} 
            label={stat.label} 
            value={stat.value} 
            trend={stat.trend || undefined} 
            color={idx === 2 ? "emerald" : "amber"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-serif text-white">{data.chartTitle}</h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  +15% Crescimento
               </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorValueAdmin" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#colorValueAdmin)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
           <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-amber-500" />
           </div>
           <h4 className="text-lg font-serif text-white">Saúde da Integração AI</h4>
           <p className="text-zinc-500 text-sm">Todas as requisições estão operando dentro dos limites normais de latência.</p>
           <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-[98%]" />
           </div>
           <span className="text-xs text-zinc-500">98% uptime garantido pelas APIs</span>
           <button className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-2xl text-sm font-medium transition-colors">
              Ver Status Detalhado
           </button>
        </div>
      </div>
    </div>
  );
};
