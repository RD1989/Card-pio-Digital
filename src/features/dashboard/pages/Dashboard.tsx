import { motion } from 'framer-motion';
import { DashboardSkeleton } from '@/shared/components/common/Skeletons';
import { BarChart3, Users, BookOpen, TrendingUp, Package, ShoppingCart, Check, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { useOrderNotificationSound } from '@/features/orders/hooks/useOrderNotificationSound';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { PlanBanner } from '@/features/billing/components/PlanBanner';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

export default function Dashboard() {
  const { impersonatedUserId } = useImpersonateStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<{ customer_name: string | null; total: number; created_at: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  // Removido busca de links Cakto pois agora usamos Pix Próprio
  const [pixData, setPixData] = useState<{ qrcode: string; copyPaste: string; amount: string } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userId = user.id;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [prodRes, ordersRes] = await Promise.all([
      supabase.from('products').select('id, is_active').eq('user_id', userId),
      supabase.from('orders').select('id, total, created_at, status, customer_name').eq('restaurant_user_id', userId).order('created_at', { ascending: false }).limit(100),
    ]);

    const products = prodRes.data || [];
    const orders = (ordersRes.data || []) as any[];
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);

    setStats({
      totalProducts: products.length,
      activeProducts: products.filter(p => p.is_active).length,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
      todayRevenue: todayOrders.reduce((sum, o) => sum + Number(o.total), 0),
    });

    setRecentOrders(orders.slice(0, 5));
    setLoading(false);
  }, [impersonatedUserId]);

  useEffect(() => {
    const checkIp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabase.functions.invoke('check-ip-abuse');
        if (data?.blocked) {
          toast.error(data.message, { duration: 10000 });
          fetchStats(); // Recarregar para refletir o is_active = false
        }
      } catch (err) {
        console.error("Erro na verificação de IP:", err);
      }
    };
    
    checkIp();
    fetchStats();
  }, [fetchStats]);

  // Realtime: listen for new/updated orders and auto-refresh
  const playNotification = useOrderNotificationSound();

  useEffect(() => {
    let userId = impersonatedUserId;
    const setup = async () => {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }
      const channel = supabase
        .channel('dashboard-orders-rt')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_user_id=eq.${userId}` },
          () => { playNotification(); fetchStats(); }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_user_id=eq.${userId}` },
          () => { fetchStats(); }
        )
        .subscribe();
      return channel;
    };
    let channelRef: Awaited<ReturnType<typeof setup>>;
    setup().then(ch => { channelRef = ch; });
    return () => { if (channelRef) supabase.removeChannel(channelRef); };
  }, [fetchStats, impersonatedUserId, playNotification]);
  const handleActivatePlan = (planType: 'monthly' | 'basic' | 'pro') => {
    const messages = {
      monthly: "Olá! Quero renovar meu Plano Mensal.",
      basic: "Olá! Quero renovar meu Plano Semestral.",
      pro: "Olá! Quero renovar meu Plano Anual.",
    };
    
    const whatsapp = "22996051620";
    const text = encodeURIComponent(messages[planType]);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  };

  const cards = [
    { label: 'Pedidos Hoje', value: String(stats.todayOrders), icon: ShoppingCart },
    { label: 'Receita Hoje', value: `R$ ${stats.todayRevenue.toFixed(2)}`, icon: TrendingUp },
    { label: 'Produtos Ativos', value: `${stats.activeProducts}`, icon: Package },
    { label: 'Total Pedidos', value: String(stats.totalOrders), icon: BarChart3 },
  ];

  const { status: planStatus, loading: planLoading } = usePlanStatus();
  const { isSuperAdmin } = useSuperAdmin();

  if (loading || planLoading) return <DashboardSkeleton />;

  const isSuspended = planStatus && !planStatus.isActive;

  return (
    <div className="space-y-8">
      {/* Plan Banner — hidden for super admins unless impersonating */}
      {planStatus && (!isSuperAdmin || impersonatedUserId) && (
        <PlanBanner status={planStatus} />
      )}

      <div>
        <h1 className="text-2xl font-bold">Meu Painel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isSuspended 
            ? 'Sua conta está suspensa. Escolha um plano para reativar seu acesso.' 
            : 'Visão geral do seu restaurante • Atualização em tempo real'}
        </p>
      </div>

      {isSuspended && !isSuperAdmin ? (
        (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 max-w-7xl mx-auto">
            {/* Monthly Plan Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-sm p-6 flex flex-col border-2 border-border relative overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold">Plano Mensal</h3>
                <p className="text-xs text-muted-foreground font-medium">Pagamento Mês a Mês</p>
                <div className="mt-4">
                  <p className="text-3xl font-black text-foreground">R$ 1,00</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">para teste</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                <li className="text-[13px] flex items-center gap-3 font-bold text-primary italic">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Pedidos ILIMITADOS</span>
                </li>
                <li className="text-[13px] flex items-center gap-3 font-medium opacity-80">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Gestão Completa</span>
                </li>
                <li className="text-[13px] flex items-center gap-3 font-medium opacity-80">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Suporte via Chat</span>
                </li>
              </ul>

              <Button 
                className="w-full h-11 gap-2 font-bold text-sm" 
                variant="outline"
                onClick={() => handleActivatePlan('monthly')}
              >
                <ExternalLink className="w-4 h-4" />
                Renovar Mensal
              </Button>
            </motion.div>

            {/* Basic Plan Card (Semestral) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-sm p-6 flex flex-col border-2 border-primary/40 relative overflow-hidden bg-primary/5 shadow-xl"
            >
              <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[9px] font-black px-3 py-1 uppercase tracking-wider">
                Melhor Custo-Benefício
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold">Plano Semestral</h3>
                <p className="text-xs text-muted-foreground font-medium">6 Meses de Acesso</p>
                <div className="mt-4">
                  <p className="text-3xl font-black text-primary">R$ 97,00</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">economize 35%</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                <li className="text-[13px] flex items-center gap-3 font-bold text-primary italic">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Pedidos ILIMITADOS</span>
                </li>
                <li className="text-[13px] flex items-center gap-3 font-bold text-primary">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Produtos ILIMITADOS</span>
                </li>
                <li className="text-[13px] flex items-center gap-3 font-medium">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>IA (Importação Ilimitada)</span>
                </li>
              </ul>

              <Button 
                className="w-full h-11 gap-2 font-bold text-sm bg-primary hover:bg-primary/90 text-white" 
                onClick={() => handleActivatePlan('basic')}
              >
                <Sparkles className="w-4 h-4" />
                Renovar Semestral
              </Button>
            </motion.div>

            {/* Pro Plan Card (Anual) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-sm p-6 flex flex-col border-2 border-foreground relative overflow-hidden bg-foreground/[0.02]"
            >
              <div className="absolute top-0 right-0 bg-foreground text-background text-[9px] font-black px-3 py-1 uppercase tracking-wider">
                Plano Full (1 Ano)
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">Plano Anual</h3>
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Acesso Total ILIMITADO</p>
                <div className="mt-4">
                  <p className="text-3xl font-black text-foreground">R$ 169,00</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">economize 45%</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                <li className="text-[13px] flex items-center gap-3 font-bold text-foreground">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Pedidos ILIMITADOS</span>
                </li>
                <li className="text-[13px] flex items-center gap-3 font-bold text-foreground">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>IA ILIMITADA</span>
                </li>
                <li className="text-[13px] flex items-center gap-3 font-bold text-foreground">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>VIP Support</span>
                </li>
              </ul>

              <Button 
                className="w-full h-11 gap-2 font-bold text-sm bg-foreground hover:bg-foreground/90 text-background"
                onClick={() => handleActivatePlan('pro')}
              >
                <ExternalLink className="w-4 h-4" />
                Renovar Anual
              </Button>
            </motion.div>

            <div className="md:col-span-3 text-center space-y-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground opacity-80">
                Liberação instantânea via Pix Próprio • Sem taxas de transação
              </p>
            </div>
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-sm p-6 group hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-shadow">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="glass-sm p-8"
          >
            <h2 className="text-lg font-semibold mb-4">Pedidos Recentes</h2>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido recebido ainda</p>
              ) : (
                recentOrders.map((order, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      order.status === 'pending' ? 'bg-amber-500' :
                      order.status === 'preparing' ? 'bg-blue-500' :
                      order.status === 'ready' ? 'bg-green-500' : 'bg-muted-foreground'
                    }`} />
                    <span className="text-sm text-muted-foreground flex-1">
                      {order.customer_name || 'Cliente'} — R$ {Number(order.total).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}



