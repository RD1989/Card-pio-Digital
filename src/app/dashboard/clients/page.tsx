"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Users,
  Zap,
  TrendingUp,
  Filter,
  Calendar,
  CreditCard,
  Phone,
  ArrowRight,
  Loader2,
  Trash2,
  LogIn,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  whatsapp_number: string | null;
  created_at: string;
  plan: 'free' | 'starter' | 'pro';
  trial_ends_at: string | null;
  slug: string;
  is_active: boolean;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'starter' | 'pro'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [newMerchant, setNewMerchant] = useState({ name: '', email: '', whatsapp: '', password: '', plan: 'free' });
  const [creating, setCreating] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id, user_id, name, whatsapp_number, created_at, plan, trial_ends_at, is_active, slug
        `);
      
      if (error) throw error;
      setClients((data as any[]) || []);
    } catch (error) {
      console.error("Erro ao carregar clientes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const toggleClientStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setClients(clients.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (error) {
      console.error("Erro ao alterar status", error);
      alert('Erro ao alterar status do cliente.');
    }
  };

  const updatePlan = async (id: string, plan: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ plan: plan as any })
        .eq('id', id);

      if (error) throw error;
      setClients(clients.map(c => c.id === id ? { ...c, plan: plan as any } : c));
    } catch (error) {
       console.error("Erro ao atualizar plano", error);
       alert("Erro ao atualizar plano.");
    }
  };

  const deleteMerchant = async (userId: string, restaurantName: string) => {
    if (!confirm(`TEM CERTEZA ABSOLUTA? Isso apagará a loja ${restaurantName} inteira, menus, imagens e faturas. Não há volta.`)) return;
    
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/delete-merchant?userId=${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionData.session?.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Loja e usuário erradicados com sucesso!');
      fetchClients();
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar Lojista');
      setLoading(false);
    }
  };

  const createMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
       const { data: sessionData } = await supabase.auth.getSession();
       const res = await fetch('/api/admin/create-merchant', {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${sessionData.session?.access_token}` 
          },
          body: JSON.stringify(newMerchant)
       });
       const data = await res.json();
       if (!res.ok) throw new Error(data.error);

       alert('Lojista registrado com sucesso e já pronto pra uso!');
       setIsCreateModalOpen(false);
       setNewMerchant({ name: '', email: '', whatsapp: '', password: '', plan: 'free' });
       fetchClients();
    } catch(err: any) {
       alert(err.message || "Erro no cadastro manual.");
    } finally {
       setCreating(false);
    }
  };

  const impersonate = (userId: string) => {
    sessionStorage.setItem('impersonate_user_id', userId);
    window.location.href = '/dashboard/products';
  };

  const exportCSV = () => {
    const headers = ['ID,Nome,Slug,WhatsApp,Plano,Criado_Em,Ativo,Vencimento'];
    const rows = filteredClients.map(c => 
      `"${c.id}","${c.name}","${c.slug}","${c.whatsapp_number||''}","${c.plan}","${c.created_at}","${c.is_active}","${c.trial_ends_at||''}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lojistas_cardapio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = useMemo(() => {
    return {
      total: clients.length,
      active: clients.filter(c => c.is_active).length,
      starter: clients.filter(c => c.plan === 'starter').length,
      pro: clients.filter(c => c.plan === 'pro').length,
    };
  }, [clients]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (client.slug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (client.whatsapp_number || '').includes(searchTerm);
    
    const matchesStatus = filter === 'all' || (filter === 'active' ? client.is_active : !client.is_active);
    const matchesPlan = planFilter === 'all' || client.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header Profissional */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-4xl font-serif italic gold-gradient-text flex items-center gap-4">
             <ShieldCheck className="w-10 h-10 text-amber-500" />
             Gestão de Clientes
          </h1>
          <p className="text-zinc-500 mt-1 font-medium tracking-tight">Painel Executivo de Lojistas e Faturamento</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={exportCSV} title="Exportar Planilha CSV" className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm text-zinc-400 hover:text-emerald-500">
              <Download className="w-5 h-5 flex-shrink-0" />
           </button>
           <button onClick={fetchClients} title="Recarregar" className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
              <TrendingUp className="w-5 h-5 text-zinc-400" />
           </button>
           <button onClick={() => setIsCreateModalOpen(true)} className="bg-zinc-950 dark:bg-amber-500 text-white dark:text-zinc-950 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/10 active:scale-95 transition-all">
              Novo Lojista
           </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Lojistas', value: metrics.total, icon: Users, color: 'zinc' },
          { label: 'Lojistas Ativos', value: metrics.active, icon: CheckCircle2, color: 'emerald' },
          { label: 'Assinantes Starter', value: metrics.starter, icon: Zap, color: 'amber' },
          { label: 'Assinantes PRO', value: metrics.pro, icon: TrendingUp, color: 'indigo' },
        ].map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden group hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{m.label}</p>
              <m.icon className={`w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="text-4xl font-serif italic dark:text-white text-zinc-900">{m.value}</p>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${
              m.color === 'emerald' ? 'from-emerald-500/50 to-transparent' : 
              m.color === 'amber' ? 'from-amber-500/50 to-transparent' : 
              m.color === 'indigo' ? 'from-indigo-500/50 to-transparent' : 
              'from-zinc-500/50 to-transparent'
            }`} />
          </motion.div>
        ))}
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-zinc-100 dark:bg-zinc-900/40 p-3 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Pesquisar lojista, email, whatsapp..."
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500/50 transition-all font-medium placeholder:text-zinc-600 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-2xl w-full lg:w-fit overflow-x-auto no-scrollbar shadow-sm">
          <Filter className="w-4 h-4 text-zinc-400 mx-2 flex-shrink-0" />
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <div className="flex gap-1">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${filter === f ? 'bg-zinc-950 text-white dark:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'}`}
              >
                {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <div className="flex gap-1">
            {(['all', 'free', 'starter', 'pro'] as const).map((p) => (
              <button 
                key={p}
                onClick={() => setPlanFilter(p)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${planFilter === p ? 'bg-amber-500 text-zinc-950 shadowed-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="px-8 py-6 text-zinc-500 font-black text-[10px] uppercase tracking-widest">Estabelecimento</th>
                <th className="px-8 py-6 text-zinc-500 font-black text-[10px] uppercase tracking-widest">Plano / Faturamento</th>
                <th className="px-8 py-6 text-zinc-500 font-black text-[10px] uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-zinc-500 font-black text-[10px] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin w-10 h-10 text-amber-500" />
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Carregando lojistas...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 text-zinc-400 dark:text-zinc-600">
                        <Users className="w-12 h-12 opacity-20" />
                        <p className="font-serif italic text-lg">Nenhum lojista encontrado.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <motion.tr 
                      key={client.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors group"
                    >
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all border border-zinc-200 dark:border-zinc-700 shadow-sm">
                             <Building2 className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-zinc-900 dark:text-white font-black text-lg group-hover:text-amber-500 transition-colors tracking-tight">
                              {client.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                               <span className="flex items-center gap-1 text-zinc-500 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                                <CreditCard className="w-3 h-3" /> /{client.slug}
                               </span>
                               {client.whatsapp_number && (
                                 <span className="flex items-center gap-1 text-zinc-500 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                                  <Phone className="w-3 h-3" /> {client.whatsapp_number}
                                 </span>
                               )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="space-y-2">
                           <div className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${
                             client.plan === 'pro' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                             client.plan === 'starter' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                             'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                           }`}>
                             {client.plan === 'pro' && <Zap className="w-3 h-3" />}
                             {client.plan}
                           </div>
                           <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{client.trial_ends_at ? `Expira: ${new Date(client.trial_ends_at).toLocaleDateString()}` : 'Vitalício'}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <button 
                          onClick={() => toggleClientStatus(client.id, client.is_active)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black transition-all border shadow-sm ${
                            client.is_active 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${client.is_active ? 'bg-emerald-400' : 'bg-red-500'}`} />
                          {client.is_active ? 'Ativo' : 'Bloqueado'}
                        </button>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            value={client.plan}
                            onChange={(e) => updatePlan(client.id, e.target.value)}
                            className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-black uppercase px-2 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none shadow-sm mr-2"
                          >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                          </select>
                          
                          <button
                            title="Administrar Resturante"
                            onClick={() => impersonate(client.user_id)}
                            className="p-3 text-indigo-500 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 rounded-2xl transition-all shadow-sm"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>

                          {client.slug && (
                            <a 
                              title="Página Pública"
                              href={`/${client.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 text-amber-500 hover:text-white bg-amber-500/10 hover:bg-amber-500 rounded-2xl transition-all shadow-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          
                          <button
                            title="Excluir Definitivamente"
                            onClick={() => deleteMerchant(client.user_id, client.name)}
                            className="p-3 text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-2xl transition-all shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <motion.form 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onSubmit={createMerchant} 
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative"
           >
              <h2 className="text-2xl font-serif italic text-zinc-900 dark:text-white mb-6">Novo Lojista</h2>
              
              <div className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Nome do Restaurante</label>
                   <input required value={newMerchant.name} onChange={e => setNewMerchant({...newMerchant, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">E-mail (Login)</label>
                   <input type="email" required value={newMerchant.email} onChange={e => setNewMerchant({...newMerchant, email: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">WhatsApp</label>
                   <input required value={newMerchant.whatsapp} onChange={e => setNewMerchant({...newMerchant, whatsapp: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Plano Inicial</label>
                   <select value={newMerchant.plan} onChange={e => setNewMerchant({...newMerchant, plan: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white">
                      <option value="free">Free</option>
                      <option value="monthly">PRO Mensal</option>
                      <option value="yearly">PRO Anual</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Senha do Cliente</label>
                   <input required minLength={6} type="text" value={newMerchant.password} onChange={e => setNewMerchant({...newMerchant, password: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white" placeholder="Mínimo 6 chars" />
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
                   Cancelar
                 </button>
                 <button type="submit" disabled={creating} className="flex-1 py-3 bg-amber-500 text-black rounded-xl text-sm font-black uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50">
                   {creating ? 'Criando...' : 'Cadastrar Mestre'}
                 </button>
              </div>
           </motion.form>
        </div>
      )}
    </div>
  );
}
