"use client";

import { useState, useEffect } from 'react';
import { 
  Globe, 
  MapPin, 
  MessageCircle, 
  Layout,
  Save,
  Check,
  Copy,
  ExternalLink,
  Share2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { supabase } from '@/lib/supabase';

export default function BioLinkPage() {
  const { user, setUser } = useAuthStore() as any;
  const { theme, accentColor } = useThemeStore() as any;
  const isLight = theme === 'light';
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState({
    instagram: '',
    maps: '',
    whatsapp: '',
    bio: ''
  });

  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedMenu, setCopiedMenu] = useState(false);

  // No Next.js, window.location.origin só está disponível no cliente
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const slug = user?.restaurant?.slug || 'meu-restaurante';
  const bioUrl = `${origin}/b/${slug}`;
  const menuUrl = `${origin}/${slug}`;

  useEffect(() => {
    if (user?.restaurant) {
      setLinks({
        instagram: user.restaurant.social_links?.instagram || '',
        maps: user.restaurant.social_links?.maps || '',
        whatsapp: user.restaurant.whatsapp_number || '',
        bio: user.restaurant.bio || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = {
        whatsapp_number: links.whatsapp,
        bio: links.bio,
        social_links: {
          instagram: links.instagram,
          maps: links.maps
        }
      };
      
      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', user?.restaurant?.id)
        .select()
        .single();

      if (error) throw error;
      
      if (setUser && user) {
        setUser({ ...user, restaurant: data });
      }
      
      alert('Canais de contato atualizados!');
    } catch (error: any) {
      console.error('Erro ao salvar links:', error);
      alert(error.message || 'Erro ao salvar links.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-10 pb-20">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className={`text-3xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Link na Bio
            </h2>
            <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
              Personalize sua página central de links e cardápio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bio Link */}
          <div className={`flex items-center justify-between gap-4 p-4 rounded-3xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase mb-1 tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                Página da Bio (Agregador)
              </p>
              <p className={`text-xs font-mono truncate ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                {bioUrl}
              </p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(bioUrl);
                setCopiedBio(true);
                setTimeout(() => setCopiedBio(false), 2000);
              }}
              className="p-3 rounded-2xl transition-all flex-shrink-0 text-zinc-950 shadow-lg active:scale-95"
              style={{ backgroundColor: accentColor }}
            >
              {copiedBio ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Direct Menu Link */}
          <div className={`flex items-center justify-between gap-4 p-4 rounded-3xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase mb-1 tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                Link Direto do Cardápio
              </p>
              <p className={`text-xs font-mono truncate ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                {menuUrl}
              </p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(menuUrl);
                setCopiedMenu(true);
                setTimeout(() => setCopiedMenu(false), 2000);
              }}
              className="p-3 rounded-2xl transition-all flex-shrink-0 text-zinc-950 shadow-lg active:scale-95 border-2 border-transparent hover:border-black/10"
              style={{ backgroundColor: accentColor }}
            >
              {copiedMenu ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className={`rounded-3xl p-6 space-y-6 border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
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
                    className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none border transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400' 
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
                    className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none min-h-[100px] border transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400' 
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
                    className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none border transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400' 
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
                    className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none border transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400' 
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
               className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                 isLight 
                   ? 'bg-slate-900 text-white hover:bg-slate-800' 
                   : 'bg-white text-zinc-950 hover:bg-zinc-200'
               }`}
               style={!isLight ? { backgroundColor: accentColor } : {}}
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
                   <img 
                    src={user?.restaurant?.logo_url || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=200"} 
                    alt="Logo"
                    className="w-full h-full object-cover" 
                   />
                 </div>
             </div>
             
             <div className="mt-12 text-center px-4 space-y-1">
                <h4 className="text-white font-bold">{user?.restaurant?.name || 'Seu Restaurante'}</h4>
                <p className="text-zinc-500 text-[10px] break-words">{links.bio || 'Sua bio aparecerá aqui...'}</p>
             </div>

             <div className="mt-8 px-4 space-y-3">
                <div 
                  className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg text-zinc-950 cursor-pointer transition-transform active:scale-95"
                  style={{ backgroundColor: accentColor }}
                >
                   Acessar Cardápio <ExternalLink className="w-3 h-3" />
                </div>
                {links.whatsapp && (
                    <div className="w-full bg-zinc-900 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-zinc-800">
                       WhatsApp <MessageCircle className="w-3 h-3" />
                    </div>
                )}
                {links.maps && (
                    <div className="w-full bg-zinc-900 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-zinc-800">
                       Localização <MapPin className="w-3 h-3" />
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
}
