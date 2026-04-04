import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Star, Clock, MapPin, Plus, Loader2, Home, List, ShoppingCart, Search, Menu as MenuIcon, X, Pizza, Utensils as Burger, Coffee, Utensils, Drumstick, Salad, IceCream, Cake, Grape, ChefHat, Truck } from 'lucide-react';
import { useCartStore } from '@/features/public-menu/stores/useCartStore';
import { CartDrawer } from '@/features/public-menu/components/CartDrawer';
import { BottomNav } from '@/features/public-menu/components/BottomNav';
import { ProductSearch } from '@/shared/components/common/ProductSearch';
import { MenuSkeleton } from '@/shared/components/common/Skeletons';
import { ProductDetailModal, SelectedAddon } from '@/features/public-menu/components/ProductDetailModal';
import { toast } from 'sonner';
import { useEffect, useState, useMemo } from 'react';
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
  show_delivery_info?: boolean;
  custom_delivery_label?: string;
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

const CATEGORY_ICONS: Record<string, { icon: any, color: string }> = {
  hamburguer: { icon: Burger, color: '#f59e0b' },
  burger: { icon: Burger, color: '#f59e0b' },
  pizza: { icon: Pizza, color: '#ef4444' },
  massa: { icon: Utensils, color: '#ef4444' },
  prato: { icon: Utensils, color: '#10b981' },
  bebida: { icon: Coffee, color: '#3b82f6' },
  suco: { icon: Grape, color: '#3b82f6' },
  doce: { icon: Cake, color: '#ec4899' },
  sobremesa: { icon: IceCream, color: '#ec4899' },
  frango: { icon: Drumstick, color: '#f97316' },
  salada: { icon: Salad, color: '#22c55e' },
  carnes: { icon: ChefHat, color: '#b91c1c' },
  default: { icon: List, color: '#64748b' }
};

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  const key = Object.keys(CATEGORY_ICONS).find(k => lower.includes(k));
  return CATEGORY_ICONS[key || 'default'];
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

  // Memoize randomized ratings to avoid re-renders changing them
  const itemRatings = useMemo(() => {
    const ratings: Record<string, { star: string, count: number }> = {};
    menuCategories.forEach(cat => {
      cat.items.forEach(item => {
        ratings[item.id] = {
          star: (4.5 + Math.random() * 0.4).toFixed(1),
          count: Math.floor(15 + Math.random() * 150)
        };
      });
    });
    return ratings;
  }, [menuCategories]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return menuCategories;
    
    const query = searchQuery.toLowerCase();
    return menuCategories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(item => 
          item.name.toLowerCase().includes(query) || 
          (item.description?.toLowerCase() || '').includes(query)
        )
      }))
      .filter(cat => cat.items.length > 0);
  }, [menuCategories, searchQuery]);

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
      <div className="min-h-screen bg-[#f8fafc] dark:bg-background flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: 'var(--menu-font, Inter, sans-serif)' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-32 h-32 rounded-[40px] shadow-2xl overflow-hidden mb-8 bg-white p-4"
        >
          {profile.logo_url ? (
            <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-3xl">
              {profile.restaurant_name[0]?.toUpperCase()}
            </div>
          )}
        </motion.div>

        <h1 className="font-display italic text-3xl font-black mb-2">{profile.restaurant_name}</h1>
        
        <div className="bg-white dark:bg-card p-10 rounded-[32px] max-w-md w-full shadow-sm border border-border/5">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight mb-4">Já Voltamos!</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Estamos atualizando nossos itens e preparativos para te atender melhor. 
            Obrigado pela paciência!
          </p>
        </div>

        <footer className="mt-12 text-[10px] uppercase font-black tracking-widest text-muted-foreground/30">
          Powered by <span className="text-primary/60">Menu Pro</span>
        </footer>
      </div>
    );
  }

  const isPremium = profile.menu_layout === 'premium';

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-background relative transition-colors duration-500" style={{ fontFamily: 'var(--menu-font, Inter, sans-serif)' }}>
      {/* Background Blobs - Refined for Ultra-Wide */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      <motion.header 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="relative z-10 w-full"
      >
        {/* Banner Section - Isolated for Overflow clipping */}
        <div className="h-64 sm:h-80 md:h-96 w-full relative group overflow-hidden">
          {profile.banner_url ? (
            <img 
              src={profile.banner_url} 
              alt="Capa" 
              className="w-full h-full object-cover brightness-[0.7] contrast-[1.1] transition-transform duration-1000 group-hover:scale-105" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
          )}
          
          {/* Enhanced Gradients for Ultra-Wide */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] dark:from-background via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
          
          {/* Header Top Items - Stays fixed on top of banner */}
          <div className="absolute top-6 left-0 right-0 z-20">
            <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-12 flex items-center justify-between">
              <div className="glass-sm px-4 py-2 flex items-center gap-2.5 text-white border-white/10 shadow-xl">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-[10px] leading-tight font-semibold">
                  <p className="opacity-70 uppercase tracking-widest text-[8px]">Entregando em:</p>
                  <p className="font-bold text-xs truncate max-w-[120px] sm:max-w-none">Pinhais, PR</p>
                </div>
              </div>
              
              {isOpen !== null && (
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md ring-1 shadow-xl transition-all ${
                  isOpen ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' : 'bg-rose-500/20 text-rose-400 ring-rose-500/30'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span>{isOpen ? 'Aberto' : 'Fechado'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Identity Section - Moved OUTSIDE overflow-hidden banner container */}
        <div className="relative z-30 -mt-14 sm:-mt-18 md:-mt-22">
          <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-12 flex items-end gap-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-[32px] sm:rounded-[48px] bg-white dark:bg-card p-1.5 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden shrink-0 relative"
            >
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-cover rounded-[24px] sm:rounded-[40px]" />
              ) : (
                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary font-black text-3xl">
                  {profile.restaurant_name[0]}
                </div>
              )}
            </motion.div>

            <div className="flex-1 pb-2 sm:pb-6 space-y-4 sm:space-y-6">
              <div className="space-y-1">
                <motion.h1 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-2xl sm:text-4xl lg:text-5xl font-[900] tracking-tighter text-white drop-shadow-lg"
                >
                  {profile.restaurant_name}
                </motion.h1>
                <div className="flex items-center gap-2 text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                   <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md">
                     <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 4.9
                   </div>
                   <span className="opacity-40">•</span>
                   <span>250+ Avaliações</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="glass-white px-3 py-1.5 sm:px-5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-xl">
                  <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <div className="text-[9px] sm:text-[11px] leading-tight font-black uppercase tracking-tighter">
                    <p className="opacity-40 text-[7px] sm:text-[8px]">Preparo</p>
                    <p className="text-foreground">30-45 min</p>
                  </div>
                </div>

                {/* Delivery Info - Now Optional and Customizable */}
                {(profile.show_delivery_info ?? true) && (
                  <div className="glass-white px-3 py-1.5 sm:px-5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-xl">
                    <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <div className="text-[9px] sm:text-[11px] leading-tight font-black uppercase tracking-tighter">
                      <p className="opacity-40 text-[7px] sm:text-[8px]">Entrega</p>
                      <p className="text-foreground">
                        {profile.custom_delivery_label || (profile.delivery_fee === 0 ? 'Frete Grátis' : formatCurrency(profile.delivery_fee))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-[1600px] w-full mx-auto px-6 mt-12 sm:mt-16 space-y-12">

        {/* Search Bar - Robust for Desktop */}
        <div className="relative group max-w-3xl mx-auto z-10 transition-all duration-500 hover:max-w-4xl">
          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="O que você quer comer hoje? Busque pratos, burgers ou bebidas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 h-16 sm:h-20 rounded-[32px] bg-white dark:bg-card border-none shadow-xl focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg placeholder:font-medium placeholder:opacity-40"
          />
        </div>

        {/* Category Bar - Aligned to Content */}
        <div className="sticky top-0 z-40 bg-[#f8fafc]/80 dark:bg-background/80 backdrop-blur-xl py-6 mx-[-24px] px-6 border-b border-border/5">
          <div className="max-w-[1600px] w-full mx-auto flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
            <CategoryButton 
              label="Populares" 
              icon={Star} 
              active={!activeCategory} 
              onClick={() => { setActiveCategory(null); window.scrollTo({ top: 300, behavior: 'smooth' }); }} 
              color="#f59e0b"
            />
            {filteredCategories.map((cat) => {
               const { icon, color } = getCategoryIcon(cat.name);
               return (
                 <CategoryButton 
                   key={cat.name}
                   label={cat.name} 
                   icon={icon} 
                   active={activeCategory === cat.name} 
                   onClick={() => {
                     setActiveCategory(cat.name);
                     document.getElementById(`category-${cat.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                   }} 
                   color={color}
                 />
               );
            })}
          </div>
        </div>

        <div className="pb-40">
          {filteredCategories.length === 0 && searchQuery && (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-medium italic">Nenhum prato encontrado para "{searchQuery}"</p>
            </div>
          )}
          {filteredCategories.map((cat, catIdx) => (
            <motion.section
              id={`category-${cat.name}`}
              key={cat.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="mt-20 first:mt-0"
            >
              <div className="flex items-center gap-6 mb-10">
                <div className="h-12 w-2 bg-primary rounded-full" />
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{cat.name}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
                <span className="text-xs font-black text-muted-foreground opacity-40 tracking-widest uppercase">{cat.items.length} itens</span>
              </div>
              
              {/* Layout Switcher: Premium Grid vs Classic List */}
              <div className={isPremium 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"
                : "flex flex-col gap-4 max-w-4xl mx-auto"
              }>
                {cat.items.map((item, i) => {
                  const rating = itemRatings[item.id] || { star: '4.8', count: 120 };
                  
                  if (!isPremium) {
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        onClick={() => handleProductClick(item)}
                        className="bg-white dark:bg-card p-4 rounded-2xl flex gap-4 cursor-pointer hover:shadow-lg transition-all border border-border/5 group"
                      >
                        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-muted/20">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10">
                              <Utensils className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="space-y-1">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                            {item.description && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight italic font-medium">{item.description}</p>}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                             <span className="text-primary font-black text-lg">{formatCurrency(item.price)}</span>
                             <button
                               onClick={(e) => { e.stopPropagation(); handleAdd({ id: item.id, name: item.name, price: item.price }); }}
                               className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform"
                             >
                               <Plus className="w-5 h-5 stroke-[3px]" />
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-card rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500 group flex flex-col border border-border/5 h-full relative"
                    >
                      <div className="h-56 relative overflow-hidden cursor-pointer" onClick={() => handleProductClick(item)}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-muted/30 flex items-center justify-center transition-colors group-hover:bg-muted/50">
                            <Utensils className="w-12 h-12 opacity-10" />
                          </div>
                        )}
                        
                        {/* Status Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        
                        <div className="absolute top-5 right-5 h-9 px-4 bg-white/95 dark:bg-card/95 backdrop-blur rounded-2xl flex items-center gap-1.5 shadow-xl font-bold border border-border/5">
                           <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                           <span className="text-[13px]">{rating.star}</span>
                           <span className="text-[11px] text-muted-foreground opacity-70">({rating.count})</span>
                        </div>
                      </div>

                      <div className="p-8 flex flex-col flex-1 gap-6">
                        <div className="space-y-3">
                          <h3 className="font-black text-xl leading-snug group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                          {item.description && <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed min-h-[40px] font-medium italic">{item.description}</p>}
                        </div>
                        
                        <div className="flex flex-col gap-6 border-t border-border/10 pt-6 mt-auto">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 opacity-50">Preço</span>
                              <span className="text-primary font-black text-2xl tracking-tighter">{formatCurrency(item.price)}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-card/50 rounded-lg text-[10px] font-black uppercase text-foreground/70">
                               <Clock className="w-3 h-3 text-primary" /> 30m
                            </div>
                          </div>
                          
                          <button
                            disabled={!item.is_available}
                            onClick={(e) => { e.stopPropagation(); handleAdd({ id: item.id, name: item.name, price: item.price }); }}
                            className={`w-full h-14 rounded-[22px] flex items-center justify-center gap-3 transition-all font-black text-sm uppercase tracking-widest ${
                              item.is_available 
                                ? 'bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20' 
                                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            }`}
                          >
                            <Plus className="w-5 h-5 stroke-[3px]" /> Adicionar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>
      </div>

      {isPremium ? (
        <>
          <BottomNav 
            onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onCategoriesClick={() => document.getElementById('category-Populares')?.scrollIntoView({ behavior: 'smooth' })}
            onSearchClick={() => { window.scrollTo({ top: 200, behavior: 'smooth' }); setTimeout(() => document.querySelector('input')?.focus(), 600); }}
            onCartClick={() => setIsCartOpen(true)}
          />
          <CartDrawer />
        </>
      ) : (
        <CartDrawer />
      )}

      {selectedProduct && <ProductDetailModal product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={handleAdd} />}
      
      <footer className="text-center py-16 px-6 border-t border-border/10 bg-white/50 backdrop-blur-sm">
        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] mb-4">Experiência Exclusiva <span className="text-primary">{profile.restaurant_name}</span></p>
        <div className="w-12 h-1 bg-primary/20 mx-auto rounded-full mb-4" />
        <p className="text-[10px] text-muted-foreground/30">Powered by <span className="text-primary/60 font-black">Menu Pro</span></p>
      </footer>
    </div>
  );
}

function CategoryButton({ label, icon: Icon, active, onClick, color }: { label: string, icon: any, active: boolean, onClick: () => void, color: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 group min-w-[64px] shrink-0 transition-all ${active ? 'scale-110' : 'hover:scale-105'}`}
    >
      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all bg-white dark:bg-card shadow-sm border-2 ${active ? 'border-primary ring-4 ring-primary/10' : 'border-transparent'}`}>
        <Icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: active ? 'var(--accent-color)' : color }} />
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest text-center ${active ? 'text-primary' : 'text-muted-foreground opacity-60'}`}>{label}</span>
    </button>
  );
}
