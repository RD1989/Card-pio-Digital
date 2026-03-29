"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Smartphone, TrendingUp, CreditCard, Layers, Package, Eye, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/useThemeStore';
import { supabase } from '@/lib/supabase';

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

export default function DashboardHome() {
  const { theme, accentColor } = useThemeStore() as any;
  const router = useRouter();
  const isLight = theme === 'light';
  
  // Usando dados mockados para recuperar a estética visual da V1 (Laravel api foi depreciada nessa migração)
  const [stats, setStats] = useState<{ label: string; value: string; trend: string | null }[]>([
    { label: 'Pedidos Hoje', value: '0', trend: null },
    { label: 'Faturamento', value: 'R$ 0,00', trend: null },
    { label: 'Produtos', value: '0', trend: null },
    { label: 'Categorias', value: '0', trend: null }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true })
        ]);

        setStats([
          { label: 'Pedidos Hoje', value: '14', trend: '+12%' }, // Mock
          { label: 'Faturamento', value: 'R$ 485,00', trend: '+5%' }, // Mock
          { label: 'Produtos', value: String(prodRes.count || 0), trend: null },
          { label: 'Categorias', value: String(catRes.count || 0), trend: null }
        ]);
      } catch (error) {
        console.error('Erro ao buscar stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const [data] = useState<{
    role: string;
    chartTitle: string;
    chartData: { name: string; value: number }[];
    limits?: {
      trial_ends_at: string | null;
      should_block: boolean;
    };
  }>({
    role: 'restaurant',
    chartTitle: 'Vendas nos Últimos 7 Dias',
    chartData: [
      { name: 'Seg', value: 120 },
      { name: 'Ter', value: 200 },
      { name: 'Qua', value: 150 },
      { name: 'Qui', value: 300 },
      { name: 'Sex', value: 485 },
      { name: 'Sáb', value: 600 },
      { name: 'Dom', value: 500 }
    ],
    limits: {
      trial_ends_at: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      should_block: false
    }
  });

  const trialEndsAt = data.limits?.trial_ends_at ? new Date(data.limits.trial_ends_at) : null;
  const now = new Date();
  const diffTime = trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isTrialActive = diffDays > 0;

  return (
    <div className="space-y-8">
      {/* Trial Banner */}
      {trialEndsAt && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
            isTrialActive 
              ? 'bg-amber-500/10 border-amber-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isTrialActive ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-400'}`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isTrialActive 
                  ? `Seu período de teste expira em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
                  : 'Seu período de teste expirou'}
              </h4>
              <p className="text-sm text-zinc-500">
                {isTrialActive 
                  ? 'Aproveite todos os recursos Pro gratuitamente. Após o teste, escolha um plano para continuar.'
                  : 'Ficamos felizes em ter você aqui! Escolha um plano agora para reativar seu cardápio.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/checkout')}
            className="px-6 py-2.5 rounded-2xl font-black transition-transform hover:scale-105"
            style={{ 
              backgroundColor: isTrialActive ? accentColor : '#f87171',
              color: isTrialActive ? '#000' : '#fff'
            }}
          >
            {isTrialActive ? 'Assinar Agora' : 'Reativar Conta'}
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
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
}
