"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Package, Layers, ShoppingBag, DollarSign, TrendingUp, Loader2, Clock, 
  Activity, AlertCircle, Building2, UserPlus, CreditCard, Zap, Crown, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

// --- HELPERS E CONSTANTES ---

const PLAN_LIMITS: Record<string, { name: string, products: number, orders: number, price: number }> = {
  free: { name: 'Free', products: 30, orders: 50, price: 0 },
  starter: { name: 'Starter', products: 150, orders: 300, price: 49.90 },
  pro: { name: 'Pro', products: -1, orders: -1, price: 99.90 },
};

function getTrialDays(trialEndsAt: string | null) {
  if (!trialEndsAt) return null;
  const ends = new Date(trialEndsAt);
  const now = new Date();
  const diff = ends.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// --- SUPER ADMIN DASHBOARD ---

function SuperAdminDashboard() {
  const { theme, accentColor } = useThemeStore() as any;
  const isLight = theme === 'light';
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLojistas: 0,
    lojistasAtivos: 0,
    novosMensal: 0,
    receitaEstimada: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('created_at, is_active, plan');
        
      if (error) throw error;
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let ativos = 0;
      let novosMensal = 0;
      let receita = 0;
      
      // Gráfico de novos lojistas nos últimos 6 meses
      const moNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const chartMap: Record<string, number> = {};
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        chartMap[moNames[d.getMonth()]] = 0;
      }

      restaurants.forEach((r: any) => {
        if (r.is_active) ativos++;
        
        const rDate = new Date(r.created_at);
        if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
          novosMensal++;
        }
        
        const moName = moNames[rDate.getMonth()];
        if (chartMap[moName] !== undefined) {
          chartMap[moName]++;
        }
        
        // Estimar receita
        const planLimit = PLAN_LIMITS[r.plan || 'free'];
        if (r.is_active && planLimit) {
          receita += planLimit.price;
        }
      });
      
      setStats({
        totalLojistas: restaurants.length,
        lojistasAtivos: ativos,
        novosMensal,
        receitaEstimada: receita,
      });
      
      setChartData(Object.entries(chartMap).map(([name, value]) => ({ name, value })));
    } catch (err) {
      console.error('Erro Admin', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <h1 className={`text-3xl font-serif italic ${isLight ? 'text-slate-900' : 'text-white'}`}>
           Panorama Global SaaS
         </h1>
         <div className={`border px-4 py-2 rounded-2xl flex items-center gap-2 ${isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className={`text-xs font-medium uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Sistema Ativo</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Lojistas', value: stats.totalLojistas, icon: Building2, color: '#38bdf8' },
          { label: 'Lojistas Ativos', value: stats.lojistasAtivos, icon: Activity, color: '#10b981' },
          { label: 'Novos Lojistas (Mês)', value: stats.novosMensal, icon: UserPlus, color: '#a78bfa' },
          { label: 'MRR Estimado', value: `R$ ${stats.receitaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: accentColor },
        ].map((card, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -4 }}
            className={`p-6 rounded-3xl border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div className="p-3 rounded-2xl w-fit mb-4" style={{ backgroundColor: `${card.color}18` }}>
              <card.icon className="w-6 h-6" style={{ color: card.color }} />
            </div>
            <p className={`text-sm mb-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{card.label}</p>
            <h3 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Novos Lojistas */}
        <div className={`lg:col-span-2 border p-8 rounded-3xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-xl font-serif ${isLight ? 'text-slate-900' : 'text-white'}`}>Crescimento de Lojistas</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAdminChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#27272a'} vertical={false} />
                <XAxis dataKey="name" stroke={isLight ? '#94a3b8' : '#52525b'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={isLight ? '#94a3b8' : '#52525b'} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isLight ? '#ffffff' : '#18181b', 
                    border: `1px solid ${isLight ? '#e2e8f0' : '#27272a'}`, 
                    borderRadius: '16px' 
                  }}
                  itemStyle={{ color: isLight ? '#0f172a' : '#ffffff' }}
                />
                <Area type="monotone" dataKey="value" name="Lojistas" stroke={accentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorAdminChart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status */}
        <div className={`border p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
           <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}10` }}>
              <Zap className="w-8 h-8" style={{ color: accentColor }} />
           </div>
           <h4 className={`text-lg font-serif ${isLight ? 'text-slate-900' : 'text-white'}`}>Saúde da Integração & DB</h4>
           <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>As requisições e conexões ao Supabase estão operando dentro dos limites normais.</p>
           <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-zinc-800'}`}>
              <div className="h-full w-[98%]" style={{ backgroundColor: accentColor }} />
           </div>
           <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>98% uptime garantido pela infraestrutura</span>
        </div>
      </div>
    </div>
  );
}


// --- MERCHANT DASHBOARD ---

function MerchantDashboard() {
  const { theme, accentColor } = useThemeStore() as any;
  const { user } = useAuthStore() as any;
  const router = useRouter();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalCategorias: 0,
    pedidosHoje: 0,
    faturamentoHoje: 0,
    pedidosSemana: 0,
    faturamentoTotal: 0,
    pedidosMesCorrente: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.restaurant?.id) return;
    fetchDashboardData();
  }, [user?.restaurant?.id]);

  const fetchDashboardData = async () => {
    const restaurantId = user?.restaurant?.id;
    if (!restaurantId) return;

    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const [prodRes, catRes, ordersHojeRes, ordersTotalRes, ordersSemanais, ordersMesRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId).eq('is_active', true),
        supabase.from('categories').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
        supabase.from('orders').select('total_amount, status').eq('restaurant_id', restaurantId).gte('created_at', todayISO),
        supabase.from('orders').select('id, total_amount, status, created_at, customer_name').eq('restaurant_id', restaurantId).eq('status', 'confirmed').order('created_at', { ascending: false }).limit(50),
        supabase.from('orders').select('total_amount, status, created_at').eq('restaurant_id', restaurantId).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: true }),
        supabase.from('orders').select('id').eq('restaurant_id', restaurantId).gte('created_at', firstDayOfMonth)
      ]);

      const pedidosHoje = ordersHojeRes.data?.length || 0;
      const faturamentoHoje = (ordersHojeRes.data || []).filter(o => o.status === 'confirmed').reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const faturamentoTotal = (ordersTotalRes.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const pedidosMesCorrente = ordersMesRes.data?.length || 0;

      setStats({
        totalProdutos: prodRes.count || 0,
        totalCategorias: catRes.count || 0,
        pedidosHoje,
        faturamentoHoje,
        pedidosSemana: ordersSemanais.data?.length || 0,
        faturamentoTotal,
        pedidosMesCorrente,
      });

      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const grafico: Record<string, { pedidos: number; receita: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        grafico[dias[d.getDay()]] = { pedidos: 0, receita: 0 };
      }

      (ordersSemanais.data || []).forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = dias[d.getDay()];
        if (grafico[key]) {
          grafico[key].pedidos++;
          if (o.status === 'confirmed') grafico[key].receita += o.total_amount || 0;
        }
      });

      setChartData(Object.entries(grafico).map(([name, v]) => ({ name, ...v })));
      setRecentOrders((ordersTotalRes.data || []).slice(0, 5));
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  // Lógica de Planos e Limites
  const rplan = user?.restaurant?.plan || 'free';
  const planInfo = PLAN_LIMITS[rplan] || PLAN_LIMITS.free;
  const trialDays = getTrialDays(user?.restaurant?.trial_ends_at);
  const isTrialActive = trialDays !== null && trialDays > 0;
  
  const isLimitReached = planInfo.orders !== -1 && stats.pedidosMesCorrente >= planInfo.orders;
  const shouldBlock = user?.restaurant?.is_active === false || (trialDays === 0);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Alerta Crítico (Bloqueio) */}
      {shouldBlock && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500 border border-red-600 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/20"
        >
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-xl">
                Acesso Restrito: Conta Bloqueada ou Vencida
              </h3>
              <p className="text-red-100 text-sm opacity-90">
                Seu cardápio público está desativado. Verifique os dados de pagamento ou o período de teste.
              </p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard/checkout')}
            className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-zinc-100 transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            Regularizar Agora
          </button>
        </motion.div>
      )}

      {/* Alerta de Trial Ativo */}
      {!shouldBlock && isTrialActive && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}30` }}
          className="border p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}30` }}>
              <Zap className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <p className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Aproveite seu Teste Grátis!</p>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Restam <strong>{trialDays} {trialDays === 1 ? 'dia' : 'dias'}</strong> de trial.</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard/checkout')}
            className="text-zinc-950 px-4 py-2 rounded-xl font-bold text-xs transition-opacity hover:opacity-80 whitespace-nowrap"
            style={{ backgroundColor: accentColor }}
          >
            Assinar Agora
          </button>
        </motion.div>
      )}

      {/* Caixa de Plano / Limites */}
      <div className={`border p-6 rounded-3xl relative overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5" style={{ color: accentColor }} />
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Plano Atual: <span style={{ color: accentColor }}>{planInfo.name}</span>
              </h3>
            </div>
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Acompanhe o limite mensal do seu plano para não pausar suas vendas.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex flex-col gap-2 min-w-[150px] w-full md:w-auto">
              <div className="flex justify-between text-xs font-medium">
                  <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Produtos Ativos</span>
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>
                    {stats.totalProdutos} / {planInfo.products === -1 ? '∞' : planInfo.products}
                  </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-zinc-800'}`}>
                  <div 
                    className="h-full" 
                    style={{ 
                      width: `${planInfo.products === -1 ? 100 : Math.min((stats.totalProdutos / planInfo.products) * 100, 100)}%`,
                      backgroundColor: (planInfo.products !== -1 && stats.totalProdutos >= planInfo.products) ? '#ef4444' : accentColor
                    }} 
                  />
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[150px] w-full md:w-auto">
              <div className="flex justify-between text-xs font-medium">
                  <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Pedidos (Mês)</span>
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>
                    {stats.pedidosMesCorrente} / {planInfo.orders === -1 ? '∞' : planInfo.orders}
                  </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-zinc-800'}`}>
                  <div 
                    className="h-full" 
                    style={{ 
                      width: `${planInfo.orders === -1 ? 100 : Math.min((stats.pedidosMesCorrente / planInfo.orders) * 100, 100)}%`,
                      backgroundColor: isLimitReached ? '#ef4444' : accentColor
                    }} 
                  />
              </div>
            </div>

            <button 
              onClick={() => router.push('/dashboard/checkout')}
              className="text-zinc-950 px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 w-full md:w-auto"
              style={{ backgroundColor: accentColor }}
            >
              Fazer Upgrade
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: ShoppingBag, label: 'Pedidos Hoje', value: String(stats.pedidosHoje), sub: `${stats.pedidosSemana} nessa semana`, color: accentColor },
          { icon: DollarSign, label: 'Faturamento Hoje', value: `R$ ${stats.faturamentoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: `Total: R$ ${stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: '#10b981' },
          { icon: Package, label: 'Produtos Ativos', value: String(stats.totalProdutos), sub: 'no seu cardápio', color: '#38bdf8' },
          { icon: Layers, label: 'Categorias', value: String(stats.totalCategorias), sub: 'grupos de itens', color: '#a78bfa' },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4 }}
            className={`p-6 rounded-3xl border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div className="p-3 rounded-2xl w-fit mb-4" style={{ backgroundColor: `${card.color}18` }}>
              <card.icon className="w-6 h-6" style={{ color: card.color }} />
            </div>
            <p className={`text-sm mb-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{card.label}</p>
            <h3 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{card.value}</h3>
            {card.sub && (
              <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className={`p-8 rounded-3xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
        <h3 className={`text-xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Vendas dos Últimos 7 Dias</h3>
        <p className="text-xs text-zinc-500 mb-6">Pedidos confirmados por dia</p>
        <div className="h-[260px] w-full">
          {chartData.every(d => d.pedidos === 0) ? (
            <div className={`flex flex-col items-center justify-center h-full opacity-30 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <ShoppingBag className="w-12 h-12 mb-3" />
              <p className="text-sm font-bold">Nenhum pedido ainda.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#27272a'} vertical={false} />
                <XAxis dataKey="name" stroke={isLight ? '#94a3b8' : '#52525b'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={isLight ? '#94a3b8' : '#52525b'} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#18181b', border: `1px solid ${isLight ? '#e2e8f0' : '#27272a'}`, borderRadius: '16px' }} />
                <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke={accentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorPedidos)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className={`rounded-3xl border overflow-hidden ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className={`px-6 py-4 border-b ${isLight ? 'border-slate-100' : 'border-zinc-800'}`}>
            <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Pedidos Recentes Confirmados</h3>
          </div>
          <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-zinc-800'}`}>
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{order.customer_name || 'Cliente anônimo'}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-sm" style={{ color: accentColor }}>
                  R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN EXPORT ---

export default function DashboardHome() {
  const { user } = useAuthStore() as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (user?.is_super_admin) {
    return <SuperAdminDashboard />;
  }

  return <MerchantDashboard />;
}
