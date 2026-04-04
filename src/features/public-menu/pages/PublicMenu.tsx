import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Star, Clock, MapPin, Plus, Loader2, Home, List, ShoppingCart, Search, Menu as MenuIcon, X } from 'lucide-react';
import { useCartStore } from '@/features/public-menu/stores/useCartStore';
import { CartDrawer } from '@/features/public-menu/components/CartDrawer';
import { BottomNav } from '@/features/public-menu/components/BottomNav';
import { ProductSearch } from '@/shared/components/common/ProductSearch';
import { MenuSkeleton } from '@/shared/components/common/Skeletons';
import { ProductDetailModal, SelectedAddon } from '@/features/public-menu/components/ProductDetailModal';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const FONT_MAP: Record<string, string> = {
  inter: 'Inter, sans-serif',
  poppins: 'Poppins, sans-serif',
  playfair: '"Playfair Display", serif',
  roboto: 'Roboto, sans-serif',
  montserrat: 'Montserrat, sans-serif',
  lora: 'Lora, serif',
};

const GOOGLE_FONT_MAP: Record<string, string> = {
  poppins: 'Poppins:wght@400;600;700',
  playfair: 'Playfair+Display:wght@400;700',
  roboto: 'Roboto:wght@400;500;700',
  montserrat: 'Montserrat:wght@400;600;700',
  lora: 'Lora:wght@400;600;700',
};

interface Profile {
  user_id: string;
  slug: string;
  restaurant_name: string;
  whatsapp: string;
  logo_url: string;
  banner_url?: string;
  primary_color: string;
  delivery_fee: number;
  font_style?: string;
  theme_mode?: 'light' | 'dark' | 'auto';
  menu_layout?: 'classic' | 'premium';
  is_active: boolean;
  plan_status: string;
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

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_upsell: boolean;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuCategory {
  name: string;
  items: Product[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, setRestaurant } = useCartStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const isSuspended = profile && (profile.is_active === false || profile.plan_status === 'expired' || profile.plan_status === 'inactive');

  useEffect(() => {
    if (!slug) return;

    async function fetchMenu() {
      setLoading(true);

      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (profError || !prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(prof as unknown as Profile);
      setRestaurant(slug, prof.user_id, prof.restaurant_name, prof.whatsapp || '');

      if (prof.is_active === false || prof.plan_status === 'expired' || prof.plan_status === 'inactive') {
        setLoading(false);
        return;
      }

      const [catRes, prodRes, hoursRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', prof.user_id).order('sort_order'),
        supabase.from('products').select('*').eq('user_id', prof.user_id).eq('is_active', true).order('sort_order'),
        (supabase as any).from('business_hours').select('*').eq('user_id', prof.user_id),
      ]);

      const categories = (catRes.data || []) as Category[];
      const products = (prodRes.data || []) as Product[];

      const hours = hoursRes.data || [];
      if (hours.length > 0) {
        const now = new Date();
        const todayHours = hours.find((h: any) => h.day_of_week === now.getDay());
        if (todayHours) {
          if (!todayHours.is_open) {
            setIsOpen(false);
          } else if (todayHours.open_time && todayHours.close_time) {
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setIsOpen(currentTime >= todayHours.open_time && currentTime <= todayHours.close_time);
          } else {
            setIsOpen(true);
          }
        }
      }

      const grouped: MenuCategory[] = [];
      categories.forEach((cat) => {
        const catProducts = products.filter((p) => p.category_id === cat.id);
        if (catProducts.length > 0) {
          grouped.push({ name: cat.name, items: catProducts });
        }
      });

      const uncategorized = products.filter((p) => !p.category_id);
      if (uncategorized.length > 0) {
        grouped.push({ name: 'Outros', items: uncategorized });
      }

      setMenuCategories(grouped);
      setLoading(false);

      (supabase as any).from('menu_views').insert({
        restaurant_user_id: prof.user_id,
        slug: slug,
      });
    }

    fetchMenu();
  }, [slug, setRestaurant]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.restaurant_name} — Cardápio Digital`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    const desc = `Peça online no ${profile.restaurant_name}. Cardápio digital com pedidos via WhatsApp.`;
    setMeta('description', desc);
    setMeta('og:title', `${profile.restaurant_name} — Cardápio Digital`);
    setMeta('og:description', desc);
    setMeta('og:type', 'website');
    setMeta('og:url', window.location.href);
    if (profile.logo_url) setMeta('og:image', profile.logo_url);

    const jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    jsonLd.id = 'menu-jsonld';
    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: profile.restaurant_name,
      url: window.location.href,
      ...(profile.logo_url && { image: profile.logo_url }),
      servesCuisine: 'Diversos',
      hasMenu: {
        '@type': 'Menu',
        url: window.location.href,
      },
    });
    document.head.appendChild(jsonLd);

    return () => {
      document.title = 'Menu Pro';
      document.getElementById('menu-jsonld')?.remove();
    };
  }, [profile]);

  useEffect(() => {
    if (profile?.primary_color) {
      const hsl = hexToHsl(profile.primary_color);
      document.documentElement.style.setProperty('--accent-color', profile.primary_color);
      document.documentElement.style.setProperty('--primary', hsl);
      document.documentElement.style.setProperty('--accent', hsl);
      document.documentElement.style.setProperty('--ring', hsl);
    }

    const theme = profile?.theme_mode || 'auto';
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    return () => {
      document.documentElement.style.removeProperty('--accent-color');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--ring');
      root.classList.remove('dark');
    };
  }, [profile?.primary_color, profile?.theme_mode]);

  useEffect(() => {
    const fontKey = profile?.font_style || 'inter';
    const googleFont = GOOGLE_FONT_MAP[fontKey];
    if (googleFont) {
      const linkId = 'menu-google-font';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${googleFont}&display=swap`;
        document.head.appendChild(link);
      }
    }
    const family = FONT_MAP[fontKey] || FONT_MAP.inter;
    document.documentElement.style.setProperty('--menu-font', family);
    return () => {
      document.documentElement.style.removeProperty('--menu-font');
      document.getElementById('menu-google-font')?.remove();
    };
  }, [profile?.font_style]);

  const handleAdd = (item: { id: string; name: string; price: number; addons?: SelectedAddon[] }) => {
    addItem({ id: item.id, name: item.name, price: item.price, addons: item.addons });
    toast.success(`${item.name} adicionado!`, { duration: 1500 });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  if (loading) {
    return <MenuSkeleton />;
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-muted-foreground opacity-20" />
        </div>
        <h1 className="font-display italic text-3xl font-bold">Restaurante não encontrado</h1>
        <p className="text-muted-foreground">O cardápio "{slug}" não existe ou foi desativado.</p>
        <Button onClick={() => window.location.href = '/'} className="mt-4">Página Inicial</Button>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: 'var(--menu-font, Inter, sans-serif)' }}>
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

        <h1 className="font-display italic text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          {profile.restaurant_name}
        </h1>
        
        <div className="glass-sm p-8 max-w-md w-full border-primary/20">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mb-2">Site Temporariamente Offline</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Estamos realizando uma atualização rápida em nosso sistema para melhor atendê-lo. 
            Por favor, retorne em breve!
          </p>
        </div>

        <footer className="mt-12 text-center py-6 text-xs text-muted-foreground/60">
          Powered by <span className="font-semibold text-primary">Menu Pro</span>
        </footer>
      </div>
    );
  }

  const isPremium = profile.menu_layout === 'premium';

  return (
    <div className={`min-h-screen bg-background relative transition-colors duration-500`} style={{ fontFamily: 'var(--menu-font, Inter, sans-serif)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full"
      >
        <div className="h-56 sm:h-72 w-full relative overflow-hidden group">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="Capa" className="w-full h-full object-cover brightness-[0.8] transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-8 max-w-[1600px] mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-[6px] border-background bg-card shadow-2xl overflow-hidden ring-1 ring-black/5 shrink-0"
              >
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-4xl">
                    {profile.restaurant_name[0]?.toUpperCase()}
                  </div>
                )}
              </motion.div>
              <div className="text-center sm:text-left space-y-3">
                <h1 className="font-display italic text-5xl sm:text-7xl font-extrabold tracking-tight text-foreground drop-shadow-sm leading-tight">
                  {profile.restaurant_name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/20 backdrop-blur-md text-primary rounded-full text-xs font-bold ring-1 ring-primary/20 whitespace-nowrap">
                    <Star className="w-3.5 h-3.5 fill-primary" />
                    <span>4.9 • Delivery Premium</span>
                  </div>
                  {isOpen !== null && (
                    <div className={`flex items-center gap-2 px-4 py-1.5 backdrop-blur-md rounded-full text-xs font-bold ring-1 whitespace-nowrap ${
                      isOpen ? 'bg-emerald-500/20 text-emerald-500 ring-emerald-500/20' : 'bg-rose-500/20 text-rose-500 ring-rose-500/20'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span>{isOpen ? 'Aberto Agora' : 'Fechado'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 py-5">
        <div className="max-w-[1600px] mx-auto px-6 overflow-x-auto no-scrollbar flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setActiveCategory(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`rounded-full px-6 text-xs font-black uppercase tracking-widest h-10 ${!activeCategory ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground'}`}
          >
            Tudo
          </Button>
          {menuCategories.map((cat) => (
            <Button 
              key={cat.name}
              variant="ghost" 
              size="sm"
              onClick={() => {
                setActiveCategory(cat.name);
                const el = document.getElementById(`category-${cat.name}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`rounded-full px-6 text-xs font-black uppercase tracking-widest h-10 transition-all ${activeCategory === cat.name ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-primary/10'}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pt-10 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-3 space-y-10">
            {/* Info Cards Grid - Now more flexible */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
              <div className="glass-sm p-6 flex items-center gap-4 flex-1 min-w-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-50">Localização</p>
                  <p className="font-bold text-sm truncate">Pinhais, PR</p>
                </div>
              </div>
              <div className="glass-sm p-6 flex items-center gap-4 flex-1 min-w-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-50">Tempo Médio</p>
                  <p className="font-bold text-sm truncate">30-45 min</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block pt-4">
              <ProductSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>

          <div className="lg:col-span-9 space-y-12">
            <div className="lg:hidden">
              <ProductSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
            {menuCategories.map((cat, catIdx) => (
              <motion.section
                id={`category-${cat.name}`}
                key={cat.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: catIdx * 0.1, duration: 0.6 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">{cat.name}</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cat.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      custom={i}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      className="glass-sm group p-4 flex gap-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer border-primary/5 hover:border-primary/20 relative overflow-hidden"
                      onClick={() => handleProductClick(item)}
                    >
                      <div className="absolute top-0 left-0 w-2 h-0 bg-primary group-hover:h-full transition-all duration-500" />
                      {item.image_url && (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-black text-lg group-hover:text-primary transition-colors leading-tight">{item.name}</h3>
                          {item.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{item.description}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-primary text-xl">{formatCurrency(item.price)}</span>
                            {!item.is_available && (
                              <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black uppercase">ESGOTADO</span>
                            )}
                          </div>
                          <button
                            disabled={!item.is_available}
                            onClick={(e) => { e.stopPropagation(); handleAdd({ id: item.id, name: item.name, price: item.price }); }}
                            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.is_available ? 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-lg hover:shadow-primary/40' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'}`}
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </div>

      {selectedProduct && <ProductDetailModal product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={handleAdd} />}

      {isPremium ? (
        <BottomNav 
          onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onCategoriesClick={() => document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' })}
          onSearchClick={() => { window.scrollTo({ top: 300, behavior: 'smooth' }); setTimeout(() => document.querySelector('input')?.focus(), 600); }}
          onCartClick={() => setIsCartOpen(true)}
        />
      ) : (
        <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
      )}

      {isPremium && <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />}

      <footer className="text-center py-12 px-6 border-t border-border/10">
        <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-widest">Experiência Exclusiva <span className="text-primary">{profile.restaurant_name}</span></p>
        <p className="text-[10px] text-muted-foreground/30 mt-2">Powered by <span className="text-primary/60 font-black">Menu Pro</span></p>
      </footer>
    </div>
  );
}
