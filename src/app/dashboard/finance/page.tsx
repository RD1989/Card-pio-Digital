"use client";

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/lib/supabase';

interface FinanceStats {
  total_revenue: number;
  monthly_revenue: number;
  avg_order: number;
  growth: number;
  chart_data: Array<{ date: string; value: number }>;
}

interface Order {
  id: string;
  total_amount: number;
  customer_name: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export default function FinancePage() {
  const { theme, accentColor } = useThemeStore() as any;
  const isLight = theme === 'light';

  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFinanceData();
  }, [search, statusFilter]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      
      // Consultando ordens reais do Supabase
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (search) {
        query = query.ilike('customer_name', `%${search}%`);
      }

      const { data: ordersData, error: ordersError } = await query;
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Calculando stats básicas baseadas nas ordens (Simulação de agregados)
      const confirmedOrders = (ordersData || []).filter(o => o.status === 'confirmed');
      const totalRevenue = confirmedOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
      const avgOrder = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;
      
      // Mock de dados mensais e crescimento para estética visual da migração
      setStats({
        total_revenue: totalRevenue,
        monthly_revenue: totalRevenue * 0.4, // Simulado
        avg_order: avgOrder,
        growth: 12.5, // Simulado
        chart_data: [
          { date: '2026-03-23', value: totalRevenue * 0.1 },
          { date: '2026-03-24', value: totalRevenue * 0.15 },
          { date: '2026-03-25', value: totalRevenue * 0.05 },
          { date: '2026-03-26', value: totalRevenue * 0.2 },
          { date: '2026-03-27', value: totalRevenue * 0.25 },
          { date: '2026-03-28', value: totalRevenue * 0.15 },
          { date: '2026-03-29', value: totalRevenue * 0.1 },
        ]
      });

    } catch (err) {
      console.error('Erro ao buscar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from('orders')
        .update({ status: status as any })
        .eq('id', id);

      if (error) throw error;
      
      // Atualiza localmente para feedback instantâneo
      setOrders(orders.map(o => o.id === id ? { ...o, status: status as any } : o));
      
      // Recarrega stats para atualizar faturamento
      fetchFinanceData();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Confirmado</span>;
      case 'cancelled':
        return <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Cancelado</span>;
      default:
        return <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Pendente</span>;
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className={`text-3xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Controle Financeiro
        </h2>
        <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
          Gerencie seu faturamento e status de pedidos estratégicos.
        </p>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-3xl p-6 border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${isLight ? 'bg-emerald-500/10' : 'bg-emerald-500/20'} text-emerald-500`}>
              <DollarSign className="w-6 h-6" />
            </div>
            {stats && (
              <span className={`text-[10px] font-bold flex items-center gap-1 ${stats.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(stats.growth)}%
              </span>
            )}
          </div>
          <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            R$ {stats?.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1 tracking-wider">Faturamento Total</p>
        </div>

        <div className={`rounded-3xl p-6 border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${isLight ? 'bg-amber-500/10' : 'bg-amber-500/20'} text-amber-500`}>
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            R$ {stats?.monthly_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1 tracking-wider">Faturamento Mensal</p>
        </div>

        <div className={`rounded-3xl p-6 border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${isLight ? 'bg-blue-500/10' : 'bg-blue-500/20'} text-blue-500`}>
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            R$ {stats?.avg_order.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1 tracking-wider">Ticket Médio</p>
        </div>

        <div className={`rounded-3xl p-6 border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${isLight ? 'bg-purple-500/10' : 'bg-purple-500/20'} text-purple-500`}>
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {stats && stats.total_revenue > 0 ? 'Ativo' : 'Inativo'}
          </p>
          <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1 tracking-wider">Status de Crescimento</p>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      <div className={`rounded-3xl p-8 border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Desempenho Semanal</h3>
            <p className="text-xs text-zinc-500">Vendas confirmadas nos últimos 7 dias</p>
          </div>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.chart_data || []}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? '#e5e7eb' : '#27272a'} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#71717a'}} 
                tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a'}} />
              <Tooltip 
                contentStyle={{ 
                  background: isLight ? '#fff' : '#18181b', 
                  border: `1px solid ${isLight ? '#e5e7eb' : '#27272a'}`,
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="value" stroke={accentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className={`rounded-3xl border overflow-hidden ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
        <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${isLight ? 'border-slate-100' : 'border-zinc-800'}`}>
          <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Gestão de Pedidos</h3>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Buscar por cliente ou ID..."
                className={`pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-2 transition-all ${
                  isLight 
                    ? 'bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-slate-100' 
                    : 'bg-zinc-950 border border-zinc-800 focus:ring-white/10'
                }`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select
              className={`px-3 py-2 rounded-xl text-xs outline-none border transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 focus:border-slate-400' 
                  : 'bg-zinc-950 border border-zinc-800 focus:border-zinc-700'
              }`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`text-[10px] uppercase font-bold tracking-widest ${isLight ? 'bg-slate-50 text-slate-400' : 'bg-black/20 text-zinc-500'}`}>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-zinc-800'}`}>
              <AnimatePresence mode="popLayout">
                {orders.map((order) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`text-sm transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-black/10'}`}
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-500">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')} 
                      <span className="block opacity-40">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      {order.customer_name || 'Anônimo'}
                    </td>
                    <td className={`px-6 py-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              disabled={updatingId === order.id}
                              className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                              title="Confirmar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              disabled={updatingId === order.id}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                              title="Cancelar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {updatingId === order.id && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {orders.length === 0 && !loading && (
            <div className="py-20 text-center space-y-4">
              <Clock className="w-12 h-12 text-zinc-800 mx-auto opacity-20" />
              <p className="text-zinc-500 italic text-sm">Nenhum pedido registrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
