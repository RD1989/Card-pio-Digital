"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, Package, Tag, TrendingUp, Loader2 } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { supabase } from '@/lib/supabase';

interface MetricCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}

interface ChartPoint {
  name: string;
  value: number;
}

interface DashboardData {
  total_produtos: number;
  produtos_ativos: number;
  total_categorias: number;
  visitas_cardapio: number;
  chart_data: ChartPoint[];
}

export default function MetricsPage() {
  const { theme, accentColor } = useThemeStore() as any;
  const isLight = theme === 'light';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true })
        ]);

        const totalProds = prodRes.count || 0;
        const totalCats = catRes.count || 0;

        // Simulando visitas e dados de gráfico (Variação de migração)
        setData({
          total_produtos: totalProds,
          produtos_ativos: totalProds, // Atualmente tratamos todos como ativos na listagem inicial
          total_categorias: totalCats,
          visitas_cardapio: 312, // Mock por enquanto
          chart_data: [
            { name: 'Jan', value: 120 },
            { name: 'Fev', value: 200 },
            { name: 'Mar', value: 150 },
            { name: 'Abr', value: 300 },
            { name: 'Mai', value: 485 },
            { name: 'Jun', value: 600 }
          ]
        });
        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar métricas:', err);
        setError("Não foi possível carregar as métricas detalhadas.");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 rounded-3xl border text-center ${isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-xl text-zinc-950 font-bold"
          style={{ backgroundColor: accentColor }}
        >
          Recarregar
        </button>
      </div>
    );
  }

  const cards: MetricCard[] = [
    { label: 'Visualizações do Cardápio', value: data?.visitas_cardapio ?? 0, icon: Eye, color: accentColor },
    { label: 'Total de Produtos', value: data?.total_produtos ?? 0, icon: Package, color: '#10b981' },
    { label: 'Produtos Ativos', value: data?.produtos_ativos ?? 0, icon: TrendingUp, color: '#38bdf8' },
    { label: 'Categorias', value: data?.total_categorias ?? 0, icon: Tag, color: '#a78bfa' },
  ];

  const chartData = data?.chart_data ?? [];

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className={`text-3xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Métricas
        </h2>
        <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
          Desempenho da sua loja no Menu Pro.
        </p>
      </header>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label} 
              className={`rounded-3xl p-6 border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="p-2 rounded-xl w-fit mb-3" style={{ backgroundColor: `${card.color}18` }}>
                <Icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
              <p className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {card.value}
              </p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Gráfico de Visualizações */}
      <div className={`rounded-3xl p-6 border animate-in fade-in slide-in-from-bottom-4 duration-700 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
      }`}>
        <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Visualizações por Mês
        </h3>
        <p className={`text-xs mb-6 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
          Acesso real ao seu cardápio público nos últimos 6 meses
        </p>
        {(chartData.length === 0) ? (
          <div className={`text-center py-14 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhuma visualização registrada ainda.</p>
            <p className="text-xs mt-1">Compartilhe o link do seu cardápio!</p>
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#27272a'} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: isLight ? '#94a3b8' : '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: isLight ? '#94a3b8' : '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: isLight ? '#ffffff' : '#18181b', 
                    border: `1px solid ${isLight ? '#e2e8f0' : '#3f3f46'}`, 
                    borderRadius: '12px', 
                    color: isLight ? '#0f172a' : '#fff' 
                  }}
                  cursor={{ fill: `${accentColor}10` }}
                />
                <Bar dataKey="value" name="Visualizações" fill={accentColor} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Dica de crescimento */}
      <div className="rounded-3xl p-6 border transition-all hover:shadow-lg" style={{
        backgroundColor: `${accentColor}08`,
        borderColor: `${accentColor}18`
      }}>
        <h4 className="font-bold text-sm mb-2" style={{ color: accentColor }}>
          💡 Como aumentar suas visualizações?
        </h4>
        <ul className={`text-sm space-y-1.5 list-disc list-inside ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
          <li>Coloque o link do cardápio na sua bio do Instagram</li>
          <li>Envie o link para grupos de WhatsApp</li>
          <li>Adicione imagens atrativas aos seus produtos</li>
          <li>Atualize o cardápio regularmente com novidades</li>
        </ul>
      </div>
    </div>
  );
}
