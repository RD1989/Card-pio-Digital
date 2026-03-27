import { useState, useEffect } from 'react';
import { 
  Globe, 
  MapPin, 
  MessageCircle, 
  ExternalLink, 
  Share2,
  Copy,
  Layout,
  Save,
  Check
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import api from '../services/api';

export const BioLinkManager = () => {
  const { user } = useAuthStore();
  const { theme, accentColor } = useThemeStore();
  const isLight = theme === 'light';
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className={`text-3xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Link na Bio
          </h2>
          <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
            Sua página central para o Instagram e Redes Sociais.
          </p>
        </div>
        <div className={`flex items-center gap-3 p-2 pl-4 rounded-2xl overflow-hidden max-w-full border ${
          isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
        }`}>
           <span className={`text-xs font-mono truncate hidden sm:block ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
             {bioUrl}
           </span>
           <button 
             onClick={copyToClipboard}
             className="p-2 rounded-xl transition-all flex-shrink-0 text-zinc-950"
             style={{ backgroundColor: accentColor }}
           >
             {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className={`rounded-3xl p-6 space-y-6 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Layout className="w-5 h-5" style={{ color: accentColor }} /> Canais de Contato
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Instagram
                </label>
                <div className="relative">
                  <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                  <input 
                    type="text" 
                    placeholder="@seu_restaurante"
                    className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none border ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
                        : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700'
                    }`}
                    value={links.instagram}
                    onChange={(e) => setLinks({ ...links, instagram: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Bio Curta
                </label>
                <div className="relative">
                  <Layout className={`absolute left-4 top-4 w-5 h-5 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                  <textarea 
                    placeholder="Descrição para a Bio"
                    className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none min-h-[100px] border ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
                        : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700'
                    }`}
                    value={links.bio}
                    onChange={(e) => setLinks({ ...links, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Localização (Google Maps)
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                  <input 
                    type="text" 
                    placeholder="URL do Google Maps"
                    className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none border ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
                        : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700'
                    }`}
                    value={links.maps}
                    onChange={(e) => setLinks({ ...links, maps: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  WhatsApp de Reservas
                </label>
                <div className="relative">
                  <MessageCircle className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none border ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
                        : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700'
                    }`}
                    value={links.whatsapp}
                    onChange={(e) => setLinks({ ...links, whatsapp: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
               onClick={handleSave}
               disabled={loading}
               className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                 isLight 
                   ? 'bg-slate-900 text-white hover:bg-slate-800' 
                   : 'bg-white text-zinc-950 hover:bg-zinc-200'
               }`}
            >
               <Save className="w-5 h-5" />
               {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className={`text-xs font-bold uppercase mb-4 tracking-widest ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
            Preview em Tempo Real
          </p>
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
                <div 
                  className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg text-zinc-950"
                  style={{ backgroundColor: accentColor }}
                >
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
