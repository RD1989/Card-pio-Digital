import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Filter, Plus, Download, ChevronUp, ChevronDown, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';

// Hooks & Components
import { useDebounce } from '@/shared/hooks/useDebounce';
import { TenantStats } from '../components/TenantStats';
import { TenantList } from '../components/TenantList';
import { ManageTenantModal } from '../components/ManageTenantModal';
import { CreateTenantModal } from '../components/CreateTenantModal';

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
  suspended: { label: 'Suspensa', color: 'bg-red-500/20 text-red-600 border-red-600/40' },
};

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const navigate = useNavigate();
  const { setImpersonation } = useImpersonateStore();
  const debouncedSearch = useDebounce(search, 300);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, user_id, restaurant_name, slug, whatsapp, email, created_at, is_active, plan, plan_status, trial_ends_at, premium_until, last_login_at, order_limit')
      .order('created_at', { ascending: false });
    setTenants((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleImpersonate = useCallback((tenant: any) => {
    setImpersonation(tenant.user_id, tenant.restaurant_name);
    toast.success(`Iniciando simulação: "${tenant.restaurant_name}"`);
    setTimeout(() => { navigate('/admin'); }, 100);
  }, [setImpersonation, navigate]);

  const handlePlanChange = async (tenantUserId: string, newPlan: string) => {
    await (supabase as any).from('profiles').update({ plan: newPlan }).eq('user_id', tenantUserId);
    setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, plan: newPlan } : t));
    toast.success(`Plano atualizado para ${newPlan === 'pro' ? 'Pro' : 'Básico'}`);
  };

  const handleExtendLicense = async (tenantUserId: string, days: number) => {
    const newPremiumUntil = new Date();
    newPremiumUntil.setDate(newPremiumUntil.getDate() + days);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ premium_until: newPremiumUntil.toISOString(), plan_status: 'active', is_active: true })
      .eq('user_id', tenantUserId);
    if (error) { toast.error('Erro ao ativar licença'); }
    else { 
      toast.success(`Licença ativada por ${days} dias`); 
      fetchTenants(); 
    }
  };

  const handleLimitChange = async (tenantUserId: string, newLimit: number) => {
    await (supabase as any).from('profiles').update({ order_limit: newLimit }).eq('user_id', tenantUserId);
    setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, order_limit: newLimit } : t));
    toast.success(`Limite atualizado para ${newLimit === 0 ? 'Ilimitado' : newLimit}`);
  };

  const handleToggleActive = async (tenantUserId: string, currentActive: boolean) => {
    const newActive = !currentActive;
    setChangingStatus(true);
    try {
      const { error } = await supabase.functions.invoke('admin-user-mgmt', {
        body: { action: 'suspend', payload: { user_id: tenantUserId, active: newActive } }
      });
      if (error) {
        toast.error(`Erro ao alternar status: ${error.message}`);
        return;
      }
      setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, is_active: newActive } : t));
      if (selectedTenant && selectedTenant.user_id === tenantUserId) {
        setSelectedTenant(prev => prev ? { ...prev, is_active: newActive } : null);
      }
      toast.success(newActive ? 'Lojista ativado' : 'Lojista desativado');
    } finally { setChangingStatus(false); }
  };

  const handleCreateTenant = async (payload: any) => {
    setCreating(true);
    const { error } = await supabase.functions.invoke('admin-user-mgmt', {
      body: { action: 'create', payload: { 
        email: payload.email, 
        password: payload.pass, 
        restaurant_name: payload.name, 
        slug: payload.slug, 
        plan: payload.plan, 
        whatsapp: payload.whatsapp 
      } }
    });
    if (error) { toast.error(`Erro ao criar: ${error.message}`); }
    else { 
      toast.success('Lojista criado!'); 
      setShowCreateModal(false); 
      fetchTenants(); 
    }
    setCreating(false);
  };

  const handleDeleteUser = async (tenantUserId: string, restaurantName: string) => {
    if (!confirm(`Deseja EXCLUIR permanentemente "${restaurantName}"? Esta ação é irreversível!`)) return;
    const { error } = await supabase.functions.invoke('admin-user-mgmt', {
      body: { action: 'delete', payload: { user_id: tenantUserId } }
    });
    if (error) { toast.error(`Erro ao excluir: ${error.message}`); }
    else { toast.success('Lojista excluído'); fetchTenants(); }
  };

  const handleSeedDemoProducts = async (tenantUserId: string) => {
    if (!confirm('Deseja injetar 10 produtos de demonstração?')) return;
    setSeeding(true);
    try {
      // Logic for seeding (Simplified for brevity as it's a super admin tool)
      const { error } = await supabase.functions.invoke('admin-user-mgmt', {
        body: { action: 'seed', payload: { user_id: tenantUserId } }
      });
      if (error) throw error;
      toast.success('🚀 Demonstração injetada com sucesso!');
      fetchTenants();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar demonstração');
    } finally {
      setSeeding(false);
    }
  };

  const getLicenseInfo = useCallback((t: Tenant) => {
    const now = new Date();
    if (!t.is_active) return { status: 'suspended' as const, days: 0, label: 'Suspensa', date: '-' };
    if (t.plan_status === 'trial') {
      const trialEnd = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
      const days = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      if (days < 0) return { status: 'expired' as const, days, label: 'Trial Expirado', date: trialEnd?.toLocaleDateString('pt-BR') || '-' };
      return { status: 'trial' as const, days, label: `Trial: ${days}d rest.`, date: trialEnd?.toLocaleDateString('pt-BR') || '-' };
    }
    const premiumUntil = t.premium_until ? new Date(t.premium_until) : null;
    if (!premiumUntil) return { status: 'expired' as const, days: 0, label: 'Sem Licença', date: '-' };
    const days = Math.ceil((premiumUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { status: 'expired' as const, days, label: 'Expirada', date: premiumUntil.toLocaleDateString('pt-BR') };
    if (days <= 5) return { status: 'warning' as const, days, label: `${days}d rest.`, date: premiumUntil.toLocaleDateString('pt-BR') };
    return { status: 'active' as const, days, label: 'Ativa', date: premiumUntil.toLocaleDateString('pt-BR') };
  }, []);

  const filtered = useMemo(() => {
    return tenants.filter(t => {
      const matchSearch = !debouncedSearch || 
        t.restaurant_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.slug.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (t.email && t.email.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (t.whatsapp && t.whatsapp.includes(debouncedSearch));
      const matchPlan = filterPlan === 'all' || t.plan === filterPlan;
      const matchStatus = filterStatus === 'all' || t.plan_status === filterStatus;
      const matchActive = filterActive === 'all' || (filterActive === 'active' && t.is_active) || (filterActive === 'inactive' && !t.is_active);
      return matchSearch && matchPlan && matchStatus && matchActive;
    });
  }, [tenants, debouncedSearch, filterPlan, filterStatus, filterActive]);

  const stats = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter(t => t.is_active && ['active', 'warning', 'trial'].includes(getLicenseInfo(t).status)).length,
    expiring: tenants.filter(t => t.is_active && getLicenseInfo(t).status === 'warning').length,
    expired: tenants.filter(t => !t.is_active || getLicenseInfo(t).status === 'expired').length,
  }), [tenants, getLicenseInfo]);

  const exportCSV = () => {
    const headers = ['Nome', 'Slug', 'E-mail', 'Telefone', 'Plano', 'Status', 'Ativo', 'Cadastro'];
    const rows = filtered.map(t => [t.restaurant_name, t.slug, t.email || '', t.whatsapp || '', t.plan, t.plan_status, t.is_active ? 'Sim' : 'Não', new Date(t.created_at).toLocaleDateString('pt-BR')]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `lojistas_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} lojistas exportados`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <TenantStats stats={stats} />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Gestão de Lojistas</h1>
            <p className="text-muted-foreground text-xs font-medium">
              {tenants.length} cadastrados · {filtered.length} filtrados
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 h-10 font-bold rounded-xl shadow-lg shadow-primary/10">
            <Plus className="w-4 h-4" /> Novo Lojista
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-10 font-bold rounded-xl" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-border/50">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, slug, e-mail ou WhatsApp..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background border-none shadow-sm rounded-xl focus:ring-1"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 gap-2 shrink-0 rounded-xl font-bold border-none shadow-sm bg-background"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 pt-1"
            >
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-40 h-9 rounded-lg bg-background border-none shadow-sm font-medium"><SelectValue placeholder="Plano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="basic">Plano Básico</SelectItem>
                  <SelectItem value="pro">Plano Pro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 h-9 rounded-lg bg-background border-none shadow-sm font-medium"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="trial">Modo Trial</SelectItem>
                  <SelectItem value="active">Pagamento Ativo</SelectItem>
                  <SelectItem value="expired">Acesso Expirado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger className="w-40 h-9 rounded-lg bg-background border-none shadow-sm font-medium"><SelectValue placeholder="Atividade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos usuários</SelectItem>
                  <SelectItem value="active">Contas Ativas</SelectItem>
                  <SelectItem value="inactive">Contas Bloqueadas</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TenantList
        tenants={filtered}
        onImpersonate={handleImpersonate}
        onPlanChange={handlePlanChange}
        onExtendLicense={handleExtendLicense}
        onLimitChange={handleLimitChange}
        onManage={(t) => { setSelectedTenant(t); setShowManageModal(true); }}
        onSeedDemo={handleSeedDemoProducts}
        seeding={seeding}
        getLicenseInfo={getLicenseInfo}
        LICENSE_STATUS={LICENSE_STATUS}
      />

      <ManageTenantModal
        tenant={selectedTenant}
        open={showManageModal}
        onOpenChange={setShowManageModal}
        onPlanChange={handlePlanChange}
        onExtendLicense={handleExtendLicense}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteUser}
        onSeedDemo={handleSeedDemoProducts}
        onImpersonate={handleImpersonate}
        changingStatus={changingStatus}
        seeding={seeding}
      />

      <CreateTenantModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={handleCreateTenant}
        creating={creating}
      />
    </div>
  );
}
