import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, Trash2, Loader2, BarChart3 } from 'lucide-react';
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
    async function fetch() {
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
    fetch();
  }, []);

  async function addAdmin() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Informe um e-mail válido');
      return;
    }
    
    // Check if already in list
    if (admins.find(a => a.email.toLowerCase() === email)) {
      toast.error('Este e-mail já é um administrador');
      return;
    }

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
    } finally {
      setAdding(false);
    }
  }

  async function removeAdmin(id: string, email: string) {
    if (!confirm(`Remover ${email} como super admin?`)) return;
    const { error } = await (supabase as any).from('super_admins').delete().eq('id', id);
    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      setAdmins(prev => prev.filter(a => a.id !== id));
      toast.success('Removido');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Sistema & Administradores</h1>
          <p className="text-muted-foreground text-sm">Gerencie super admins e veja estatísticas</p>
        </div>
      </div>

      {/* Super Admins */}
      <Card className="glass-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg">Super Administradores</CardTitle>
          <CardDescription>Usuários com acesso total ao painel global</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="email@exemplo.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAdmin()}
              className="flex-1"
            />
            <Button onClick={addAdmin} disabled={adding} size="sm" className="gap-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{a.email}</p>
                  <p className="text-xs text-muted-foreground">Desde {new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAdmin(a.id, a.email)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats per tenant */}
      <Card className="glass-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Estatísticas por Lojista
          </CardTitle>
          <CardDescription>Ranking por número de pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Lojista</th>
                  <th className="pb-3 font-medium">Plano</th>
                  <th className="pb-3 font-medium text-right">Produtos</th>
                  <th className="pb-3 font-medium text-right">Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 20).map((s, i) => (
                  <motion.tr
                    key={s.slug}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5">
                      <p className="font-medium">{s.restaurant_name}</p>
                      <p className="text-xs text-muted-foreground">/menu/{s.slug}</p>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{s.plan}</span>
                    </td>
                    <td className="py-2.5 text-right">{s.products_count}</td>
                    <td className="py-2.5 text-right font-medium">{s.orders_count}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

