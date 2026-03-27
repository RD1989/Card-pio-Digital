import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, Package, Tag, TrendingUp, Loader2 } from 'lucide-react';
import api from '../services/api';

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
  role: string;
  total_produtos?: number;
  produtos_ativos?: number;
  total_categorias?: number;
  visitas_cardapio?: number;
  chart_data?: ChartPoint[];
}

export const MetricsPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        console.error('Erro ao buscar métricas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  const cards: MetricCard[] = [
    { label: 'Visualizações do Cardápio', value: data?.visitas_cardapio ?? 0, icon: Eye, color: 'text-amber-500' },
    { label: 'Total de Produtos', value: data?.total_produtos ?? 0, icon: Package, color: 'text-emerald-400' },
    { label: 'Produtos Ativos', value: data?.produtos_ativos ?? 0, icon: TrendingUp, color: 'text-sky-400' },
    { label: 'Categorias', value: data?.total_categorias ?? 0, icon: Tag, color: 'text-violet-400' },
  ];

  const chartData = data?.chart_data ?? [];

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-3xl font-serif text-white mb-2">Métricas</h2>
        <p className="text-zinc-500">Visualize o desempenho real do seu cardápio digital.</p>
      </header>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <Icon className={`w-6 h-6 mb-3 ${card.color}`} />
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Gráfico de Visualizações */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">Visualizações por Mês</h3>
        <p className="text-xs text-zinc-500 mb-6">Acesso real ao seu cardápio público nos últimos 6 meses</p>
        {chartData.length === 0 ? (
          <div className="text-center py-14 text-zinc-600">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhuma visualização registrada ainda.</p>
            <p className="text-xs mt-1">Compartilhe o link do seu cardápio!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                cursor={{ fill: '#f59e0b10' }}
              />
              <Bar dataKey="value" name="Visualizações" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Dica de crescimento */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6">
        <h4 className="text-amber-500 font-bold text-sm mb-2">💡 Como aumentar suas visualizações?</h4>
        <ul className="text-zinc-400 text-sm space-y-1.5 list-disc list-inside">
          <li>Coloque o link do cardápio na sua bio do Instagram</li>
          <li>Envie o link para grupos de WhatsApp</li>
          <li>Adicione imagens atrativas aos seus produtos</li>
          <li>Atualize o cardápio regularmente com novidades</li>
        </ul>
      </div>
    </div>
  );
};
