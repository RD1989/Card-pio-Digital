import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Store, Eye, Search, UserCheck, UserX, Download, Filter,
  Trash2, Plus, Loader2, AlertCircle, Clock, CreditCard,
  ShieldCheck, Mail, MessageSquare, ExternalLink, TrendingUp, Settings,
  ChevronDown, ChevronUp, PackagePlus,
} from 'lucide-react';
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

  // Management Modal
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [seeding, setSeeding] = useState(false);

  async function fetchTenants() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, user_id, restaurant_name, slug, whatsapp, email, created_at, is_active, plan, plan_status, trial_ends_at, premium_until, last_login_at, order_limit')
      .order('created_at', { ascending: false });
    setTenants((data as any[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchTenants(); }, []);

  const handleImpersonate = (tenant: any) => {
    setImpersonation(tenant.user_id, tenant.restaurant_name);
    toast.success(`Iniciando simulação: "${tenant.restaurant_name}"`);
    setTimeout(() => { navigate('/admin'); }, 100);
  };

  async function handlePlanChange(tenantUserId: string, newPlan: string) {
    await (supabase as any).from('profiles').update({ plan: newPlan }).eq('user_id', tenantUserId);
    setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, plan: newPlan } : t));
    toast.success(`Plano atualizado para ${newPlan === 'pro' ? 'Pro' : 'Básico'}`);
  }

  async function handleExtendLicense(tenantUserId: string, days: number) {
    const newPremiumUntil = new Date();
    newPremiumUntil.setDate(newPremiumUntil.getDate() + days);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ premium_until: newPremiumUntil.toISOString(), plan_status: 'active', is_active: true })
      .eq('user_id', tenantUserId);
    if (error) { toast.error('Erro ao ativar licença'); }
    else { toast.success(`Licença ativada por ${days} dias`); fetchTenants(); }
  }

  async function handleLimitChange(tenantUserId: string, newLimit: number) {
    await (supabase as any).from('profiles').update({ order_limit: newLimit }).eq('user_id', tenantUserId);
    setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, order_limit: newLimit } : t));
    toast.success(`Limite atualizado para ${newLimit === 0 ? 'Ilimitado' : newLimit}`);
  }

  async function handleToggleActive(tenantUserId: string, currentActive: boolean) {
    const newActive = !currentActive;
    setChangingStatus(true);
    try {
      const { error } = await supabase.functions.invoke('admin-user-mgmt', {
        body: { action: 'suspend', payload: { user_id: tenantUserId, active: newActive } }
      });
      if (error) {
        let errorMsg = error.message;
        try {
          const response = (error as any).context;
          if (response && typeof response.json === 'function') {
            const body = await response.json();
            if (body && body.error) errorMsg = body.error;
          }
        } catch (e) { console.error('Erro ao analisar resposta:', e); }
        toast.error(`Erro ao alternar status: ${errorMsg}`);
        return;
      }
      setTenants(prev => prev.map(t => t.user_id === tenantUserId ? { ...t, is_active: newActive } : t));
      if (selectedTenant && selectedTenant.user_id === tenantUserId) {
        setSelectedTenant(prev => prev ? { ...prev, is_active: newActive } : null);
      }
      toast.success(newActive ? 'Lojista ativado' : 'Lojista desativado');
    } finally { setChangingStatus(false); }
  }

  async function handleCreateTenant() {
    if (!newEmail || !newPass || !newName || !newSlug) { toast.error('Preencha os campos obrigatórios'); return; }
    setCreating(true);
    const { error } = await supabase.functions.invoke('admin-user-mgmt', {
      body: { action: 'create', payload: { email: newEmail, password: newPass, restaurant_name: newName, slug: newSlug, plan: newPlan, whatsapp: newWhatsapp } }
    });
    if (error) { toast.error(`Erro ao criar: ${error.message}`); }
    else { toast.success('Lojista criado!'); setShowCreateModal(false); resetForm(); fetchTenants(); }
    setCreating(false);
  }

  async function handleDeleteUser(tenantUserId: string, restaurantName: string) {
    if (!confirm(`Deseja EXCLUIR permanentemente "${restaurantName}"? Esta ação é irreversível!`)) return;
    const { error } = await supabase.functions.invoke('admin-user-mgmt', {
      body: { action: 'delete', payload: { user_id: tenantUserId } }
    });
    if (error) { toast.error(`Erro ao excluir: ${error.message}`); }
    else { toast.success('Lojista excluído'); fetchTenants(); }
  }

  function resetForm() {
    setNewEmail(''); setNewPass(''); setNewName(''); setNewSlug(''); setNewWhatsapp(''); setNewPlan('basic');
  }

  async function handleSeedDemoProducts(tenantUserId: string) {
    if (!confirm('Deseja transformar este lojista em uma demonstração premium? Serão criados 10 produtos, categorias, modificadores, horários e identidade visual.')) return;
    setSeeding(true);
    try {
      // 1. Atualizar Profile (Branding)
      await (supabase as any)
        .from('profiles')
        .update({ primary_color: '#e11d48' }) // Um tom de vermelho/rosa premium
        .eq('user_id', tenantUserId);

      // 2. Criar Horários (Aberto Sempre)
      const days = [0, 1, 2, 3, 4, 5, 6];
      const businessHours = days.map(d => ({
        user_id: tenantUserId,
        day_of_week: d,
        open_time: '08:00:00',
        close_time: '23:59:00',
        is_open: true
      }));
      await (supabase as any).from('business_hours').upsert(businessHours, { onConflict: 'user_id,day_of_week' });

      // 3. Criar Categorias
      const categories = [
        { name: '🍔 Hambúrgueres', sort_order: 1, user_id: tenantUserId },
        { name: '🍕 Pizzas', sort_order: 2, user_id: tenantUserId },
        { name: '🥤 Bebidas', sort_order: 3, user_id: tenantUserId },
        { name: '🍰 Sobremesas', sort_order: 4, user_id: tenantUserId }
      ];
      const { data: catData, error: catError } = await (supabase as any)
        .from('categories')
        .insert(categories)
        .select();

      if (catError || !catData) throw new Error('Erro ao criar categorias: ' + (catError?.message || 'Sem dados'));

      const burgers = catData.find((c: any) => c.name.includes('Hambúrgueres'))?.id;
      const pizzas = catData.find((c: any) => c.name.includes('Pizzas'))?.id;
      const bebidas = catData.find((c: any) => c.name.includes('Bebidas'))?.id;
      const doces = catData.find((c: any) => c.name.includes('Sobremesas'))?.id;

      if (!burgers || !pizzas || !bebidas || !doces) throw new Error('Erro ao mapear IDs das categorias');

      // 4. Criar Produtos (10 intens)
      const productsList = [
        { category_id: burgers, name: 'Smash Duplo Cheddar', description: 'Dois blends de 90g ultra smash, muito cheddar derretido, cebola caramelizada e molho da casa no pão brioche.', price: 34.90, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800' },
        { category_id: burgers, name: 'Bacon Gourmet Special', description: 'Blend 160g de costela, fatias crocantes de bacon artesanal, queijo prato, picles e maionese defumada.', price: 38.50, image_url: 'https://images.unsplash.com/photo-1594212686153-2775f0f3dc10?auto=format&fit=crop&q=80&w=800' },
        { category_id: burgers, name: 'Chicken Crispy Supreme', description: 'Sobrecoxa empanada super crocante, alface americana, tomate verde e maionese verde especial.', price: 29.90, image_url: 'https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&q=80&w=800' },
        { category_id: pizzas, name: 'Pizza Margherita DOC', description: 'Massa de fermentação natural, molho de tomate pelati, muçarela de búfala e manjericão fresco.', price: 54.00, image_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=800' },
        { category_id: pizzas, name: 'Calabresa Artesanal', description: 'Calabresa fatiada fininha com cebola roxa, azeitonas pretas chilenas e toque de orégano.', price: 49.90, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800' },
        { category_id: pizzas, name: 'Quatro Queijos Premium', description: 'Gorgonzola, catupiry original, provolone e muçarela sobre molho artesanal.', price: 62.00, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800' },
        { category_id: bebidas, name: 'Coca-Cola Zero Lata', description: 'Geladíssima 350ml.', price: 6.50, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800' },
        { category_id: bebidas, name: 'Suco de Laranja Natural', description: 'Copo 500ml de suco fresco espremido na hora, sem açúcar.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800' },
        { category_id: doces, name: 'Pudim de Leite Condensado', description: 'Pudim liso de leite condensado com calda de caramelo escura. Receita tradicional.', price: 14.50, image_url: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&q=80&w=800' },
        { category_id: doces, name: 'Brownie com Sorvete', description: 'Brownie quente recheado com nozes, acompanhado de bola de sorvete de baunilha cream.', price: 21.00, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800' }
      ];

      const { data: prodData, error: prodError } = await (supabase as any)
        .from('products')
        .insert(productsList.map((p, i) => ({
          ...p,
          user_id: tenantUserId,
          restaurant_id: tenantUserId,
          sort_order: i,
          is_active: true,
          is_available: true,
        })))
        .select();

      if (prodError || !prodData) throw new Error('Erro ao criar produtos: ' + prodError?.message);

      // 5. Criar Modificadores para o Smash Duplo (O primeiro burger)
      const smashId = prodData.find(p => p.name.includes('Smash'))?.id;
      if (smashId) {
        const { data: modData, error: modError } = await (supabase as any)
          .from('product_modifiers')
          .insert([
            { product_id: smashId, user_id: tenantUserId, name: 'Escolha o ponto da carne', is_required: true, max_selections: 1, sort_order: 1 },
            { product_id: smashId, user_id: tenantUserId, name: 'Adicionais extras?', is_required: false, max_selections: 5, sort_order: 2 }
          ])
          .select();

        if (modData && !modError) {
          const pontoId = modData.find(m => m.name.includes('ponto'))?.id;
          const extrasId = modData.find(m => m.name.includes('Adicionais'))?.id;

          if (pontoId) {
            await (supabase as any).from('modifier_options').insert([
              { modifier_id: pontoId, name: 'Ao Ponto (Rosado no centro)', price: 0, sort_order: 1 },
              { modifier_id: pontoId, name: 'Bem Passado', price: 0, sort_order: 2 }
            ]);
          }

          if (extrasId) {
            await (supabase as any).from('modifier_options').insert([
              { modifier_id: extrasId, name: 'Bacon Crocante', price: 5.00, sort_order: 1 },
              { modifier_id: extrasId, name: 'Queijo Cheddar Extra', price: 4.00, sort_order: 2 },
              { modifier_id: extrasId, name: 'Ovo Frito', price: 3.00, sort_order: 3 }
            ]);
          }
        }
      }

      toast.success('🚀 Demonstração de 10 produtos e horários gerada com sucesso!');
      fetchTenants(); // Recarregar lista para refletir mudanças se necessário
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar demonstração');
    } finally {
      setSeeding(false);
    }
  }



  const filtered = tenants.filter(t => {
    const matchSearch = t.restaurant_name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
      (t.whatsapp && t.whatsapp.includes(search));
    const matchPlan = filterPlan === 'all' || t.plan === filterPlan;
    const matchStatus = filterStatus === 'all' || t.plan_status === filterStatus;
    const matchActive = filterActive === 'all' || (filterActive === 'active' && t.is_active) || (filterActive === 'inactive' && !t.is_active);
    return matchSearch && matchPlan && matchStatus && matchActive;
  });

  function exportCSV() {
    const headers = ['Nome', 'Slug', 'E-mail', 'Telefone', 'Plano', 'Status', 'Ativo', 'Cadastro'];
    const rows = filtered.map(t => [t.restaurant_name, t.slug, t.email || '', t.whatsapp || '', t.plan, t.plan_status, t.is_active ? 'Sim' : 'Não', new Date(t.created_at).toLocaleDateString('pt-BR')]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `lojistas_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} lojistas exportados`);
  }

  function getLicenseInfo(t: Tenant) {
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.is_active && ['active', 'warning', 'trial'].includes(getLicenseInfo(t).status)).length,
    expiring: tenants.filter(t => t.is_active && getLicenseInfo(t).status === 'warning').length,
    expired: tenants.filter(t => !t.is_active || getLicenseInfo(t).status === 'expired').length,
  };

  return (
    <div className="space-y-5">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Ativos', value: stats.active, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Vencendo', value: stats.expiring, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Expirados', value: stats.expired, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-sm p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">{stat.label}</p>
              <p className="text-2xl font-black leading-none">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Lojistas</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {tenants.length} cadastrados · {filtered.length} exibidos
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Novo
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={exportCSV}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span> CSV
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, slug ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Plano" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os planos</SelectItem>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Atividade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── DESKTOP TABLE ─── */}
      <div className="hidden md:block glass-sm overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left bg-muted/30">
                <th className="p-3 font-semibold">Lojista</th>
                <th className="p-3 font-semibold">Contato</th>
                <th className="p-3 font-semibold">Plano/Limite</th>
                <th className="p-3 font-semibold">Licença</th>
                <th className="p-3 font-semibold">Ativação Rápida</th>
                <th className="p-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const info = getLicenseInfo(t);
                const config = LICENSE_STATUS[info.status];
                return (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[160px]">{t.restaurant_name}</p>
                          <p className="text-xs text-muted-foreground">/menu/{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col text-xs gap-0.5">
                        <span className="text-muted-foreground truncate max-w-[140px]">{t.email || '-'}</span>
                        <a href={`https://wa.me/${t.whatsapp?.replace(/\D/g, '')}`} target="_blank" className="text-primary hover:underline font-medium">
                          {t.whatsapp || '-'}
                        </a>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5">
                        <Select value={t.plan} onValueChange={(v) => handlePlanChange(t.user_id, v)}>
                          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">Lim:</span>
                          <input
                            type="number"
                            value={t.order_limit}
                            onChange={(e) => handleLimitChange(t.user_id, parseInt(e.target.value) || 0)}
                            className="w-16 h-5 text-[10px] bg-muted border border-border rounded px-1 focus:outline-none focus:ring-1 focus:ring-primary"
                            title="0 = Ilimitado"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </div>
                        {info.days > 0 && <span className="text-[10px] text-muted-foreground">{info.days}d — {info.date}</span>}
                        {info.days <= 0 && <span className="text-[10px] text-muted-foreground">{info.date}</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] font-bold hover:bg-primary hover:text-white" onClick={() => handleExtendLicense(t.user_id, 180)}>+180d</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] font-bold hover:bg-primary hover:text-white" onClick={() => handleExtendLicense(t.user_id, 365)}>+1 ano</Button>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-bold text-blue-600 border-blue-500/20 hover:bg-blue-500/10"
                          onClick={() => handleSeedDemoProducts(t.user_id)}>
                          {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />}
                          Demo
                        </Button>
                        <Button variant="default" size="sm" className="gap-1.5 h-8 text-xs font-bold"
                          onClick={() => { setSelectedTenant(t); setShowManageModal(true); }}>
                          <Settings className="w-3.5 h-3.5" /> Gerenciar
                        </Button>
                        <Button variant="outline" size="icon" title="Acessar dashboard" className="w-8 h-8" onClick={() => handleImpersonate(t)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-10 text-sm">Nenhum lojista encontrado</div>
          )}
        </div>
      </div>

      {/* ─── MOBILE CARDS ─── */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-10 text-sm glass-sm rounded-xl">
            Nenhum lojista encontrado
          </div>
        )}
        {filtered.map((t, i) => {
          const info = getLicenseInfo(t);
          const config = LICENSE_STATUS[info.status];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-sm rounded-xl overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 flex items-center gap-3 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-sm">{t.restaurant_name}</p>
                  <p className="text-xs text-muted-foreground">/menu/{t.slug}</p>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mb-0.5">Plano</p>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase text-[10px]">{t.plan}</span>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mb-0.5">Licença até</p>
                  <p className="font-medium">{info.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mb-0.5">E-mail</p>
                  <p className="truncate">{t.email || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mb-0.5">WhatsApp</p>
                  <a href={`https://wa.me/${t.whatsapp?.replace(/\D/g, '')}`} target="_blank" className="text-primary font-medium">
                    {t.whatsapp || '—'}
                  </a>
                </div>
              </div>

              {/* Ativação rápida mobile */}
              <div className="px-4 pb-2 flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] font-bold hover:bg-primary hover:text-white transition-colors" onClick={() => handleExtendLicense(t.user_id, 180)}>+180 dias</Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] font-bold hover:bg-primary hover:text-white transition-colors" onClick={() => handleExtendLicense(t.user_id, 365)}>+1 ano</Button>
              </div>

              {/* Card Footer — ações */}
              <div className="px-4 pb-4 flex flex-col gap-2">
                <Button variant="outline" className="w-full gap-2 h-9 text-xs font-bold text-blue-600 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40" onClick={() => handleSeedDemoProducts(t.user_id)}>
                  {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />}
                  {seeding ? 'Injetando...' : 'Injetar Demo (10 Produtos)'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="default" className="flex-1 gap-2 h-9 text-xs font-bold"
                    onClick={() => { setSelectedTenant(t); setShowManageModal(true); }}>
                    <Settings className="w-3.5 h-3.5" /> Gerenciar
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 h-9 text-xs" onClick={() => handleImpersonate(t)}>
                    <Eye className="w-3.5 h-3.5" /> Acessar
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── MODAL: Gestão Detalhada ─── */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="sm:max-w-[700px] gap-0 p-0 overflow-hidden glass-sm border-border max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">
            Painel de gestão detalhada do lojista.
          </DialogDescription>
          {selectedTenant && (
            <>
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-muted/30 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Store className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg sm:text-xl font-bold">{selectedTenant.restaurant_name}</DialogTitle>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">slug: {selectedTenant.slug}</span>
                        <div className={`w-2 h-2 rounded-full ${selectedTenant.is_active ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {selectedTenant.is_active ? 'Conta Ativa' : 'Conta Suspensa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Cadastro</p>
                    <p className="font-medium text-sm">{new Date(selectedTenant.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Coluna Esquerda */}
                <div className="p-5 sm:p-6 md:border-r border-border space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <Users className="w-3 h-3" /> Contato
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">E-mail</p>
                          <p className="text-sm font-medium truncate">{selectedTenant.email || '-'}</p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${selectedTenant.whatsapp?.replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-green-500/30 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">WhatsApp</p>
                          <p className="text-sm font-medium">{selectedTenant.whatsapp || '-'}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Métricas
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Pedidos/Mês</p>
                        <p className="text-lg font-black text-primary">
                          {selectedTenant.order_limit === 0 ? '∞' : selectedTenant.order_limit}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Último Login</p>
                        <p className="text-sm font-medium">
                          {selectedTenant.last_login_at ? new Date(selectedTenant.last_login_at).toLocaleDateString('pt-BR') : 'Nunca'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita */}
                <div className="p-5 sm:p-6 space-y-6 bg-muted/10 border-t md:border-t-0 border-border/50">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> Assinatura
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Plano Atual</label>
                        <Select value={selectedTenant.plan} onValueChange={(v) => handlePlanChange(selectedTenant.user_id, v)}>
                          <SelectTrigger className="glass-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Básico (Essencial)</SelectItem>
                            <SelectItem value="pro">Pro (Com IA e Adicionais)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Adicionar Tempo de Licença</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="text-[10px] font-bold py-4 h-auto" onClick={() => handleExtendLicense(selectedTenant.user_id, 180)}>+180 DIAS (6 MESES)</Button>
                          <Button variant="outline" size="sm" className="text-[10px] font-bold py-4 h-auto" onClick={() => handleExtendLicense(selectedTenant.user_id, 365)}>+1 ANO (12 MESES)</Button>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground italic">
                          Ao adicionar tempo a conta é ativada automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-red-500/80 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" /> Segurança e Acesso
                    </h3>
                    <Button
                      variant={selectedTenant.is_active ? 'destructive' : 'default'}
                      className="w-full gap-2 font-bold uppercase text-xs h-10"
                      onClick={() => handleToggleActive(selectedTenant.user_id, selectedTenant.is_active)}
                      disabled={changingStatus}
                    >
                      {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        selectedTenant.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      {changingStatus ? 'Processando...' : selectedTenant.is_active ? 'Suspender Acesso' : 'Reativar Lojista'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full gap-2 font-bold uppercase text-[10px] h-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { setShowManageModal(false); handleDeleteUser(selectedTenant.user_id, selectedTenant.restaurant_name); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Conta Permanentemente
                    </Button>
                    <div className="pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        className="w-full gap-2 font-bold uppercase text-[10px] h-9 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40"
                        onClick={() => handleSeedDemoProducts(selectedTenant.user_id)}
                        disabled={seeding}
                      >
                        {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />}
                        {seeding ? 'Injetando...' : 'INJETAR 10 PRODUTOS (DEMO)'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-5 sm:px-6 py-4 bg-muted/30 border-t border-border flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowManageModal(false)} className="font-bold border-border/50 w-full sm:w-auto">
                  Fechar Painel
                </Button>
                <Button className="gap-2 font-bold w-full sm:w-auto" onClick={() => handleImpersonate(selectedTenant)}>
                  <Eye className="w-4 h-4" /> Acessar Dashboard do Lojista
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Novo Lojista ─── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md glass-sm border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Novo Lojista
            </DialogTitle>
            <DialogDescription>Crie uma conta de lojista manualmente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">E-mail *</label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Senha *</label>
                <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Nome do Restaurante *</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Meu Restaurante" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Slug *</label>
                <Input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="meu-restaurante" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">WhatsApp</label>
                <Input value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)} placeholder="5511999999999" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Plano</label>
                <Select value={newPlan} onValueChange={setNewPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateTenant} disabled={creating} className="w-full gap-2 mt-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Criando...' : 'Criar Lojista'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
