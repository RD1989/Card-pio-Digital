import { useState, useEffect } from 'react';
import { 
  Globe, 
  MapPin, 
  MessageCircle, 
  ExternalLink, 
  Share2,
  Copy,
  Layout,
  Save
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export const BioLinkManager = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState({
    instagram: '',
    maps: '',
    whatsapp: '',
    bio: ''
  });

  const baseUrl = window.location.origin;
  const bioUrl = `${baseUrl}/b/${user?.restaurant?.slug || 'meu-restaurante'}`;

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await api.get('/restaurant');
        const r = response.data;
        setLinks({
          instagram: r.social_links?.instagram || '',
          maps: r.social_links?.maps || '',
          whatsapp: r.whatsapp_number || '',
          bio: r.bio || ''
        });
      } catch (error) {
        console.error('Erro ao buscar links:', error);
      }
    };
    fetchLinks();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        whatsapp_number: links.whatsapp,
        bio: links.bio,
        social_links: {
          instagram: links.instagram,
          maps: links.maps
        }
      };
      await api.post('/restaurant', payload);
      alert('Canais de contato atualizados!');
    } catch {
      alert('Erro ao salvar links.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bioUrl);
    alert('Link copiado!');
  };

  return (
    <div className="max-w-4xl space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif text-white mb-2">Link na Bio</h2>
          <p className="text-zinc-500">Sua página central para o Instagram e Redes Sociais.</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-2 pl-4 rounded-2xl overflow-hidden max-w-full">
           <span className="text-xs text-zinc-500 font-mono truncate hidden sm:block">{bioUrl}</span>
           <button 
             onClick={copyToClipboard}
             className="bg-amber-500 text-zinc-950 p-2 rounded-xl hover:bg-amber-400 transition-all flex-shrink-0"
           >
             <Copy className="w-4 h-4" />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layout className="w-5 h-5 text-amber-500" /> Canais de Contato
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Instagram</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input 
                    type="text" 
                    placeholder="@seu_restaurante"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-zinc-700"
                    value={links.instagram}
                    onChange={(e) => setLinks({ ...links, instagram: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Bio Curta</label>
                <div className="relative">
                  <Layout className="absolute left-4 top-4 w-5 h-5 text-zinc-600" />
                  <textarea 
                    placeholder="Descrição para a Bio"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-zinc-700 min-h-[100px]"
                    value={links.bio}
                    onChange={(e) => setLinks({ ...links, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Localização (Google Maps)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input 
                    type="text" 
                    placeholder="URL do Google Maps"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-zinc-700"
                    value={links.maps}
                    onChange={(e) => setLinks({ ...links, maps: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">WhatsApp de Reservas</label>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-zinc-700"
                    value={links.whatsapp}
                    onChange={(e) => setLinks({ ...links, whatsapp: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
               onClick={handleSave}
               disabled={loading}
               className="w-full bg-white text-zinc-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95"
            >
               <Save className="w-5 h-5" />
               {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-xs text-zinc-500 font-bold uppercase mb-4 tracking-widest">Preview em Tempo Real</p>
          <div className="w-[280px] h-[580px] bg-zinc-950 border-[8px] border-zinc-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
             <div className="h-32 bg-zinc-900 relative">
                 <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-zinc-950 bg-zinc-800 overflow-hidden shadow-xl">
                   <img src={user?.restaurant?.logo_url || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=200"} className="w-full h-full object-cover" />
                 </div>
             </div>
             
             <div className="mt-12 text-center px-4 space-y-1">
                <h4 className="text-white font-bold">{user?.restaurant?.name || 'Burguer House'}</h4>
                <p className="text-zinc-500 text-[10px] break-words">{links.bio || 'O melhor smash da região! 🍔'}</p>
             </div>

             <div className="mt-8 px-4 space-y-3">
                <div className="w-full bg-white text-zinc-950 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
                   Ver Cardápio Digital <ExternalLink className="w-3 h-3" />
                </div>
                {links.whatsapp && (
                    <div className="w-full bg-zinc-900 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-zinc-800">
                       Falar no WhatsApp <MessageCircle className="w-3 h-3" />
                    </div>
                )}
                {links.maps && (
                    <div className="w-full bg-zinc-900 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-zinc-800">
                       Como Chegar <MapPin className="w-3 h-3" />
                    </div>
                )}
             </div>

             <div className="mt-auto mb-8 flex justify-center gap-4">
                {links.instagram && <Globe className="w-4 h-4 text-zinc-500" />}
                <Share2 className="w-4 h-4 text-zinc-500" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
