import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Star, Clock, MapPin, Plus, Loader2 } from 'lucide-react';
import { useCartStore } from '@/features/public-menu/stores/useCartStore';
import { CartDrawer } from '@/features/public-menu/components/CartDrawer';
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

  const isSuspended = profile && (profile.is_active === false || profile.plan_status === 'expired' || profile.plan_status === 'inactive');

  useEffect(() => {
    if (!slug) return;

    async function fetchMenu() {
      setLoading(true);

      // 1. Find profile by slug
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

      // 2. Fetch categories and products in parallel
      const [catRes, prodRes, hoursRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', prof.user_id).order('sort_order'),
        supabase.from('products').select('*').eq('user_id', prof.user_id).eq('is_active', true).order('sort_order'),
        (supabase as any).from('business_hours').select('*').eq('user_id', prof.user_id),
      ]);

      const categories = (catRes.data || []) as Category[];
      const products = (prodRes.data || []) as Product[];

      // Check business hours
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

      // 3. Group products by category
      const grouped: MenuCategory[] = [];

      categories.forEach((cat) => {
        const catProducts = products.filter((p) => p.category_id === cat.id);
        if (catProducts.length > 0) {
          grouped.push({ name: cat.name, items: catProducts });
        }
      });

      // Products without category
      const uncategorized = products.filter((p) => !p.category_id);
      if (uncategorized.length > 0) {
        grouped.push({ name: 'Outros', items: uncategorized });
      }

      setMenuCategories(grouped);
      setLoading(false);

      // Track menu view for conversion metrics
      (supabase as any).from('menu_views').insert({
        restaurant_user_id: prof.user_id,
        slug: slug,
      });
    }

    fetchMenu();
  }, [slug, setRestaurant]);

  // SEO: Inject dynamic meta tags and structured data
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

    // JSON-LD structured data
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

  // Inject restaurant accent color as CSS variable
  useEffect(() => {
    if (profile?.primary_color) {
      const hsl = hexToHsl(profile.primary_color);
      document.documentElement.style.setProperty('--accent-color', profile.primary_color);
      document.documentElement.style.setProperty('--primary', hsl);
      document.documentElement.style.setProperty('--accent', hsl);
      document.documentElement.style.setProperty('--ring', hsl);
    }
    return () => {
      document.documentElement.style.removeProperty('--accent-color');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--ring');
    };
  }, [profile?.primary_color]);

  // Load custom Google Font for this restaurant
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

  return (
    <div className="min-h-screen bg-background relative" style={{ fontFamily: 'var(--menu-font, Inter, sans-serif)' }}>
      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header with Professional Layout */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full"
      >
        {/* Banner Area */}
        <div className="h-44 sm:h-56 w-full bg-muted relative overflow-hidden">
          {profile.banner_url ? (
            <img 
              src={profile.banner_url} 
              alt="Capa" 
              className="w-full h-full object-cover brightness-[0.85]" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
          )}

          {/* Logo Overlapping */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-20">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[6px] border-background bg-white shadow-2xl overflow-hidden ring-1 ring-black/5">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-2xl">
                  {profile.restaurant_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="pt-12 pb-6 px-6 text-center max-w-xl mx-auto">
          <h1 className="font-display italic text-3xl sm:text-4xl font-extrabold tracking-tight">
            {profile.restaurant_name}
          </h1>
          
          <div className="flex items-center justify-center gap-4 mt-3 text-sm font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full">
              <Star className="w-4 h-4 fill-primary" />
              <span>4.9</span>
            </div>
            
            {isOpen !== null ? (
              isOpen ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Aberto Agora</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>Fechado</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full">
                <Clock className="w-4 h-4" />
                <span>Aberto</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground opacity-60">
            <MapPin className="w-3 h-3" /> Pinhais, PR
          </div>
        </div>
      </motion.header>

      {/* Menu */}
      <div className="max-w-2xl mx-auto px-6 pb-28 space-y-6">
        {/* Search */}
        <ProductSearch value={searchQuery} onChange={setSearchQuery} />

        {menuCategories.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nenhum produto disponível no momento.</p>
        ) : (
          (() => {
            const q = searchQuery.toLowerCase().trim();
            const filtered = q
              ? menuCategories.map(cat => ({
                  ...cat,
                  items: cat.items.filter(item =>
                    item.name.toLowerCase().includes(q) ||
                    (item.description && item.description.toLowerCase().includes(q))
                  ),
                })).filter(cat => cat.items.length > 0)
              : menuCategories;

            if (filtered.length === 0) {
              return (
                <p className="text-center text-muted-foreground py-16">
                  Nenhum produto encontrado para "{searchQuery}"
                </p>
              );
            }

            return filtered.map((cat, catIdx) => (
              <motion.section
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIdx * 0.1, duration: 0.5 }}
              >
                <h2 className="text-lg font-bold uppercase tracking-wider text-primary mb-4">{cat.name}</h2>
                <div className="space-y-3">
                  {cat.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      custom={i}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      className="glass-sm p-5 flex justify-between items-start gap-4 hover:scale-[1.01] transition-transform cursor-pointer"
                      onClick={() => handleProductClick(item)}
                    >
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-primary text-sm">{formatCurrency(item.price)}</span>
                          {!item.is_available && (
                            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                              ESGOTADO
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        disabled={!item.is_available}
                        onClick={(e) => { e.stopPropagation(); handleAdd({ id: item.id, name: item.name, price: item.price }); }}
                        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          item.is_available 
                            ? 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground' 
                            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ));
          })()
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAdd}
        />
      )}

      <CartDrawer />

      <footer className="text-center py-6 text-xs text-muted-foreground/60">
        Powered by <span className="text-gradient font-semibold">Menu Pro</span>
      </footer>
    </div>
  );
}



