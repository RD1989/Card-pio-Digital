import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, Globe, Smartphone, Store, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMenuAnalytics } from '@/shared/hooks/useMenuAnalytics';

interface Profile {
  user_id: string;
  restaurant_name: string;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  font_style: string;
  is_active: boolean;
  plan_status: string;
  bio_link_text: string | null;
}

interface BioLink {
  id: string;
  title: string;
  url: string;
}

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${h * 360} ${s * 100}% ${l * 100}%`;
}

export default function BioLinkPage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { recordView } = useMenuAnalytics();

  const isSuspended = profile && (profile.is_active === false || profile.plan_status === 'expired' || profile.plan_status === 'inactive');

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (profileData) {
        setProfile(profileData as any);
        
        if (profileData.is_active === false || profileData.plan_status === 'expired' || profileData.plan_status === 'inactive') {
          setLoading(false);
          return;
        }

        // Fetch Links
        const { data: linksData } = await (supabase as any)
          .from('bio_links')
          .select('*')
          .eq('user_id', profileData.user_id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        setLinks(linksData || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [slug]);

  useEffect(() => {
    if (profile && !isSuspended) {
      recordView(profile.user_id, profile.slug || slug || '');
    }
  }, [profile, isSuspended, recordView, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Smartphone className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
        <h1 className="text-xl font-bold">Perfil não encontrado</h1>
        <p className="text-muted-foreground mt-2">Esta página de links não existe ou está desativada.</p>
        <Link to="/" className="mt-6 text-primary font-bold">Voltar para o Início</Link>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --accent-color: ${profile.primary_color || '#10b981'};
            --primary: ${hexToHsl(profile.primary_color || '#10b981')};
          }
        `}} />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full shadow-2xl overflow-hidden mb-8 ring-4 ring-primary/20"
        >
          {profile.logo_url ? (
            <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-3xl">
              {profile.restaurant_name[0]?.toUpperCase()}
            </div>
          )}
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
          {profile.restaurant_name}
        </h1>
        
        <div className="bg-muted/50 rounded-2xl p-8 max-w-md w-full border border-primary/10">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mb-2">Página Temporariamente Offline</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Estamos realizando uma atualização rápida em nosso sistema para melhor atendê-lo. 
            Por favor, retorne em breve!
          </p>
        </div>

        <footer className="mt-12 text-center py-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/30">
          Powered by <span className="text-primary/50">Menu Pro</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center">
      {/* Background/Overlay styling based on theme */}
      <div className="w-full max-w-md bg-background min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Banner Area */}
        <div className="h-40 w-full bg-neutral-200 relative shrink-0">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="Capa" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900" />
          )}
          
          {/* Floating Logo */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 rounded-full border-[6px] border-background bg-white shadow-xl overflow-hidden ring-1 ring-black/5">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-extrabold text-2xl">
                  {profile.restaurant_name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 px-6 flex-1 flex flex-col">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: profile.primary_color }}>
              {profile.restaurant_name}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-60">
                <Globe className="w-3 h-3" /> Página Oficial
            </div>
          </header>

          <main className="space-y-4 pb-20">
             {/* MAIN CARDAPIO LINK */}
             <motion.div
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
             >
               <Link 
                 to={`/menu/${slug}`}
                 className="flex items-center justify-between p-4 rounded-2xl shadow-lg shadow-primary/20 text-white font-black text-base transition-all ring-offset-background focus:ring-2 focus:ring-primary h-16"
                 style={{ backgroundColor: profile.primary_color }}
               >
                 <Store className="w-6 h-6 mr-2 opacity-50" />
                 <span className="flex-1 text-center">{profile.bio_link_text || 'FAZER PEDIDO NO CARDÁPIO'}</span>
                 <ExternalLink className="w-5 h-5 ml-2 opacity-50" />
               </Link>
             </motion.div>

             {/* CUSTOM LINKS */}
             <AnimatePresence>
               {links.map((link, index) => (
                 <motion.a
                   key={link.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.05 }}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   href={link.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center justify-between p-4 rounded-2xl border-2 bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all h-14"
                 >
                   <div className="w-6 h-6 shrink-0 bg-neutral-50 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                     <Globe className="w-4 h-4 text-neutral-400" />
                   </div>
                   <span className="flex-1 text-center font-bold text-neutral-800 dark:text-neutral-100 truncate mx-4">
                     {link.title}
                   </span>
                   <ExternalLink className="w-4 h-4 text-neutral-300 shrink-0" />
                 </motion.a>
               ))}
             </AnimatePresence>

             {links.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <p className="text-sm font-medium">Nenhum link adicional no momento.</p>
                </div>
             )}
          </main>

          <footer className="mt-auto py-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-30">
             Desenvolvido por Cardápio Digital
          </footer>
        </div>
      </div>
    </div>
  );
}
