import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, Eye, Search, UserCheck, UserX, Download, Filter, Calendar, Trash2, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';

interface Tenant {
  id: string;
  user_id: string;
  restaurant_name: string;
  slug: string;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
  is_active: boolean;
  plan: string;
  plan_status: string;
  trial_ends_at: string | null;
  premium_until: string | null;
  last_login_at: string | null;
  order_limit: number;
}

const LICENSE_STATUS = {
  active: { label: 'Ativa', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  warning: { label: 'Vencendo', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  expired: { label: 'Expirada', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  trial: { label: 'Trial', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
};

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const navigate = useNavigate();
  const { setImpersonation } = useImpersonateStore();
  
  // New Tenant Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newPlan, setNewPlan] = useState('basic');

  async function fetch() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, user_id, restaurant_name, slug, whatsapp, email, created_at, is_active, plan, plan_status, trial_ends_at, premium_until, last_login_at, order_limit')
      .order('created_at', { ascending: false });
    setTenants((data as any[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetch();
  }, []);

  function handleImpersonate(tenant: Tenant) {
    setImpersonation(tenant.user_id, tenant.restaurant_name);
    toast.success(`Acessando dashboard de "${tenant.restaurant_name}"`);
    navigate('/admin');
  }

  async function handlePlanChange(tenantUserId: string, newPlan: string) {
    await (supabase as any).from('profiles').update({ plan: newPlan }).eq('user_id', tenantUserId);
    setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, plan: newPlan } : t));
    toast.success(`Plano atualizado para ${newPlan === 'pro' ? 'Pro' : 'Básico'}`);
  }

  async function handleStatusChange(tenantUserId: string, newStatus: string) {
    await (supabase as any).from('profiles').update({ plan_status: newStatus }).eq('user_id', tenantUserId);
    setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, plan_status: newStatus } : t));
    toast.success(`Status atualizado para ${newStatus}`);
  }

  async function handleExtendLicense(tenantUserId: string, days: number) {
    const newPremiumUntil = new Date();
    newPremiumUntil.setDate(newPremiumUntil.getDate() + days);
    
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ 
        premium_until: newPremiumUntil.toISOString(),
        plan_status: 'active',
        is_active: true
      })
      .eq('user_id', tenantUserId);

    if (error) {
      toast.error('Erro ao ativar licença');
    } else {
      toast.success(`Licença ativada por ${days} dias`);
      fetch();
    }
  }

  async function handleLimitChange(tenantUserId: string, newLimit: number) {
    await (supabase as any).from('profiles').update({ order_limit: newLimit }).eq('user_id', tenantUserId);
    setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, order_limit: newLimit } : t));
    toast.success(`Limite de pedidos atualizado para ${newLimit === 0 ? 'Ilimitado' : newLimit}`);
  }

  async function handleToggleActive(tenantUserId: string, currentActive: boolean) {
    const newActive = !currentActive;
    
    const { data, error } = await supabase.functions.invoke('admin-user-mgmt', {
      body: { action: 'suspend', payload: { user_id: tenantUserId, active: newActive } }
    });

    if (error) { 
      console.error("Function error details:", error);
      let errorMsg = error.message;
      
      // Tentativa de extrair mensagem detalhada do corpo da resposta
      try {
        // No SDK v2, o erro das funções pode ter um .context se for FunctionsHttpError
        const response = (error as any).context;
        if (response && typeof response.json === 'function') {
          const body = await response.json();
          if (body && body.error) errorMsg = body.error;
        }
      } catch (e) {
        console.error("Erro ao analisar resposta de erro:", e);
      }

      toast.error(`Erro ao alternar status: ${errorMsg}`); 
      return; 
    }
    
    setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, is_active: newActive } : t));
    toast.success(newActive ? 'Lojista ativado' : 'Lojista desativado');
  }

  async function handleCreateTenant() {
    if (!newEmail || !newPass || !newName || !newSlug) { toast.error('Preencha os campos obrigatórios'); return; }
    setCreating(true);
    
    const { data, error } = await supabase.functions.invoke('admin-user-mgmt', {
      body: { 
        action: 'create', 
        payload: { 
          email: newEmail, 
          password: newPass, 
          restaurant_name: newName, 
          slug: newSlug, 
          plan: newPlan,
          whatsapp: newWhatsapp
        } 
      }
    });

    if (error) { toast.error(`Erro ao criar: ${error.message}`); } else {
      toast.success('Lojista criado com sucesso!');
      setShowCreateModal(false);
      resetForm();
      fetch();
    }
    setCreating(false);
  }

  async function handleDeleteUser(tenantUserId: string, restaurantName: string) {
    if (!confirm(`Deseja realmente EXCLUIR permanentemente o lojista "${restaurantName}"? Esta ação é irreversível!`)) return;
    
    const { data, error } = await supabase.functions.invoke('admin-user-mgmt', {
      body: { action: 'delete', payload: { user_id: tenantUserId } }
    });

    if (error) { 
      console.error("Function error:", error);
      toast.error(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`); 
    } else {
      toast.success('Lojista excluído');
      fetch();
    }
  }

  function resetForm() {
    setNewEmail('');
    setNewPass('');
    setNewName('');
    setNewSlug('');
    setNewWhatsapp('');
    setNewPlan('basic');
  }

  const filtered = tenants.filter(t => {
    const matchSearch = t.restaurant_name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
      (t.whatsapp && t.whatsapp.includes(search));
    const matchPlan = filterPlan === 'all' || t.plan === filterPlan;
    const matchStatus = filterStatus === 'all' || t.plan_status === filterStatus;
    const matchActive = filterActive === 'all' ||
      (filterActive === 'active' && t.is_active) ||
      (filterActive === 'inactive' && !t.is_active);
    return matchSearch && matchPlan && matchStatus && matchActive;
  });

  function exportCSV() {
    const headers = ['Nome', 'Slug', 'E-mail', 'Telefone', 'Plano', 'Status', 'Ativo', 'Cadastro', 'Trial até'];
    const rows = filtered.map(t => [
      t.restaurant_name,
      t.slug,
      t.email || '',
      t.whatsapp || '',
      t.plan,
      t.plan_status,
      t.is_active ? 'Sim' : 'Não',
      new Date(t.created_at).toLocaleDateString('pt-BR'),
      t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString('pt-BR') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lojistas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} lojistas exportados`);
  }

  function getLicenseInfo(t: Tenant) {
    const now = new Date();
    
    if (t.plan_status === 'trial') {
      const trialEnd = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
      const days = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return { 
        status: 'trial' as const, 
        days, 
        label: `Trial: ${days}d rest.`,
        date: trialEnd?.toLocaleDateString('pt-BR') || '-'
      };
    }

    const premiumUntil = t.premium_until ? new Date(t.premium_until) : null;
    if (!premiumUntil) return { status: 'expired' as const, days: 0, label: 'Sem Licença', date: 'Manual' };

    const days = Math.ceil((premiumUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { status: 'expired' as const, days, label: 'Expirada', date: premiumUntil.toLocaleDateString('pt-BR') };
    if (days <= 5) return { status: 'warning' as const, days, label: `${days} dias rest.`, date: premiumUntil.toLocaleDateString('pt-BR') };
    
    return { status: 'active' as const, days, label: 'Ativa', date: premiumUntil.toLocaleDateString('pt-BR') };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Lojistas</h1>
            <p className="text-muted-foreground text-sm">{tenants.length} cadastrados · {filtered.length} exibidos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Lojista
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos planos</SelectItem>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Atividade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-sm overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left bg-muted/30">
                <th className="p-3 font-medium">Lojista</th>
                <th className="p-3 font-medium hidden sm:table-cell">Contato</th>
                <th className="p-3 font-medium hidden lg:table-cell">Plano/Limite</th>
                <th className="p-3 font-medium">Status da Licença</th>
                <th className="p-3 font-medium hidden lg:table-cell">Ativação Rápida</th>
                <th className="p-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t.restaurant_name}</p>
                        <p className="text-xs text-muted-foreground">/menu/{t.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <div className="flex flex-col text-xs">
                      <span className="text-muted-foreground truncate max-w-32">{t.email || '-'}</span>
                      <a href={`https://wa.me/${t.whatsapp?.replace(/\D/g, '')}`} target="_blank" className="font-medium text-primary hover:underline">
                        {t.whatsapp || '-'}
                      </a>
                    </div>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex flex-col gap-1.5">
                      <Select value={t.plan} onValueChange={(v) => handlePlanChange(t.user_id, v)}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Limite:</span>
                        <input
                          type="number"
                          value={t.order_limit}
                          onChange={(e) => handleLimitChange(t.user_id, parseInt(e.target.value) || 0)}
                          className="w-20 h-5 text-[10px] bg-muted border border-border rounded px-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          title="0 = Ilimitado"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {(() => {
                        const info = getLicenseInfo(t);
                        const config = LICENSE_STATUS[info.status];
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${config.color}`}>
                                {config.label}
                              </div>
                              {info.status !== 'expired' && info.days > 0 && (
                                <span className="text-[10px] font-bold text-muted-foreground">{info.days}d</span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground opacity-70">Venc: {info.date}</span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] font-bold hover:bg-primary hover:text-white transition-colors" onClick={() => handleExtendLicense(t.user_id, 30)}>+30d</Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] font-bold hover:bg-primary hover:text-white transition-colors" onClick={() => handleExtendLicense(t.user_id, 180)}>+180d</Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] font-bold hover:bg-primary hover:text-white transition-colors" onClick={() => handleExtendLicense(t.user_id, 365)}>+365d</Button>
                    </div>
                  </td>
                   <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => handleImpersonate(t)}>
                        <Eye className="w-3 h-3" />
                        Acessar
                      </Button>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteUser(t.user_id, t.restaurant_name)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">Nenhum lojista encontrado</div>
        )}
      </div>

      {/* Modal: Novo Lojista */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Lojista</DialogTitle>
            <DialogDescription className="sr-only">
              Crie uma nova conta de lojista manualmente no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Restaurante</label>
              <Input placeholder="Ex: Burguer House" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (URL)</label>
              <Input placeholder="ex: burguer-house" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail de Acesso</label>
              <Input type="email" placeholder="cliente@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input type="password" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp</label>
              <Input placeholder="Ex: 11999998888" value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plano Inicial</label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateTenant} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar Lojista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


