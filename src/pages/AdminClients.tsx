import { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  ShieldCheck,
  Building2
} from 'lucide-react';
import api from '../services/api';

interface Client {
  id: number;
  name: string;
  email: string;
  created_at: string;
  restaurant?: {
    id: number;
    name: string;
    slug: string;
  };
  is_active: boolean;
}

export const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/clients');
      setClients(response.data);
    } catch (error) {
      console.error("Erro ao carregar clientes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const toggleClientStatus = async (id: number) => {
    try {
      const response = await api.post(`/admin/clients/${id}/toggle`);
      setClients(clients.map(c => c.id === id ? { ...c, is_active: response.data.is_active } : c));
    } catch (error) {
      console.error("Erro ao alterar status", error);
      alert('Erro ao alterar status do cliente.');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.restaurant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'active') return matchesSearch && client.is_active;
    if (filter === 'inactive') return matchesSearch && !client.is_active;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif italic text-white flex items-center gap-3">
             <ShieldCheck className="text-amber-500 w-8 h-8" />
             Gestão de Clientes
          </h1>
          <p className="text-zinc-500 mt-1">Gerencie todos os lojistas cadastrados na plataforma.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Total Lojistas</p>
                <p className="text-xl font-bold text-white">{clients.length}</p>
             </div>
             <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="text-amber-500 w-6 h-6" />
             </div>
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou restaurante..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-2xl">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'active' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            Ativos
          </button>
          <button 
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'inactive' ? 'bg-red-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            Inativos
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm">Cliente / Restaurante</th>
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm">Cadastro</th>
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm">Status</th>
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{client.name}</p>
                        <p className="text-zinc-500 text-xs">{client.email}</p>
                        {client.restaurant && (
                          <div className="flex items-center gap-1 mt-1 text-amber-500/80 text-xs">
                             <Building2 className="w-3 h-3" />
                             <span>{client.restaurant.name}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {client.is_active ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-lg w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ativo
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded-lg w-fit">
                          <XCircle className="w-3.5 h-3.5" />
                          Inativo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => toggleClientStatus(client.id)}
                          title={client.is_active ? "Desativar" : "Ativar"}
                          className={`p-2 rounded-lg transition-colors ${client.is_active ? 'text-red-400 hover:bg-red-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                        >
                          {client.is_active ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </button>
                        <a 
                          href={`/b/${client.restaurant?.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
