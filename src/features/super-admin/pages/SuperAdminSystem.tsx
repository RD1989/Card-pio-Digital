import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, Trash2, Loader2, BarChart3, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface SuperAdmin {
  id: string;
  email: string;
  created_at: string;
}

interface TenantStats {
  restaurant_name: string;
  slug: string;
  plan: string;
  orders_count: number;
  products_count: number;
}

export default function SuperAdminSystem() {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [stats, setStats] = useState<TenantStats[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [adminsRes, profilesRes, ordersRes, productsRes] = await Promise.all([
        (supabase as any).from('super_admins').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, restaurant_name, slug, plan'),
        (supabase as any).from('orders').select('restaurant_user_id'),
        (supabase as any).from('products').select('user_id'),
      ]);

      setAdmins((adminsRes.data || []) as SuperAdmin[]);

      const profiles = (profilesRes.data || []) as any[];
      const orders = (ordersRes.data || []) as any[];
      const products = (productsRes.data || []) as any[];

      const orderCount = new Map<string, number>();
      orders.forEach((o: any) => orderCount.set(o.restaurant_user_id, (orderCount.get(o.restaurant_user_id) || 0) + 1));

      const productCount = new Map<string, number>();
      products.forEach((p: any) => productCount.set(p.user_id, (productCount.get(p.user_id) || 0) + 1));

      const tenantStats: TenantStats[] = profiles.map((p: any) => ({
        restaurant_name: p.restaurant_name,
        slug: p.slug,
        plan: p.plan,
        orders_count: orderCount.get(p.user_id) || 0,
        products_count: productCount.get(p.user_id) || 0,
      })).sort((a: TenantStats, b: TenantStats) => b.orders_count - a.orders_count);

      setStats(tenantStats);
      setLoading(false);
    }
    loadData();
  }, []);

  async function addAdmin() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) { toast.error('Informe um e-mail válido'); return; }
    if (admins.find(a => a.email.toLowerCase() === email)) { toast.error('Este e-mail já é um administrador'); return; }

    setAdding(true);
    try {
      const { data, error } = await (supabase as any)
        .from('super_admins')
        .insert({ email })
        .select()
        .single();
      if (error) throw error;
      toast.success('Super admin adicionado!');
      setAdmins(prev => [data, ...prev]);
      setNewEmail('');
    } catch (error: any) {
      toast.error('Erro ao adicionar: ' + (error.message || 'Erro desconhecido'));
    } finally { setAdding(false); }
  }

  async function removeAdmin(id: string, email: string) {
    if (!confirm(`Remover ${email} como super admin?`)) return;
    const { error } = await (supabase as any).from('super_admins').delete().eq('id', id);
    if (error) { toast.error('Erro: ' + error.message); }
    else { setAdmins(prev => prev.filter(a => a.id !== id)); toast.success('Removido'); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Sistema & Administradores</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Gerencie super admins e veja estatísticas</p>
        </div>
      </div>

      {/* Super Admins Card */}
      <Card className="glass-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Super Administradores
          </CardTitle>
          <CardDescription>Usuários com acesso total ao painel global</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="email@exemplo.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAdmin()}
              className="flex-1 h-10"
            />
            <Button onClick={addAdmin} disabled={adding} className="gap-2 h-10 shrink-0">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>

          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum super admin cadastrado</p>
          ) : (
            <div className="space-y-2">
              {admins.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.email}</p>
                    <p className="text-xs text-muted-foreground">Desde {new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeAdmin(a.id, a.email)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats per tenant */}
      <Card className="glass-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Estatísticas por Lojista
          </CardTitle>
          <CardDescription>Ranking por número de pedidos</CardDescription>
        </CardHeader>
        <CardContent className="p-0">

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left bg-muted/20">
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">Lojista</th>
                  <th className="px-5 py-3 font-semibold">Plano</th>
                  <th className="px-5 py-3 font-semibold text-right">Produtos</th>
                  <th className="px-5 py-3 font-semibold text-right">Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 20).map((s, i) => (
                  <motion.tr
                    key={s.slug}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/10"
                  >
                    <td className="px-5 py-3 text-muted-foreground font-medium">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold">{s.restaurant_name}</p>
                      <p className="text-xs text-muted-foreground">/menu/{s.slug}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize font-bold">{s.plan}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{s.products_count}</td>
                    <td className="px-5 py-3 text-right font-bold text-primary">{s.orders_count}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-border/50">
            {stats.slice(0, 20).map((s, i) => (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="px-4 py-3 flex items-center gap-3"
              >
                <span className="text-muted-foreground font-bold w-5 text-sm shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{s.restaurant_name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold capitalize">{s.plan}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Package className="w-3 h-3" />
                    <span>{s.products_count}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-primary">
                    <ShoppingCart className="w-3 h-3" />
                    <span>{s.orders_count}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {stats.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">Sem dados disponíveis</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
