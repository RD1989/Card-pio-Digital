import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Star, Clock, MapPin, Plus, Loader2, Home, List,
  ShoppingCart, Search, X, Pizza, Coffee, Utensils,
  Drumstick, Salad, IceCream, Cake, Grape, ChefHat, Truck,
  Flame, Heart, ChevronRight,
} from 'lucide-react';
import { useCartStore } from '@/features/public-menu/stores/useCartStore';
import { CartDrawer } from '@/features/public-menu/components/CartDrawer';
import { BottomNav } from '@/features/public-menu/components/BottomNav';
import { MenuSkeleton } from '@/shared/components/common/Skeletons';
import { ProductDetailModal, SelectedAddon } from '@/features/public-menu/components/ProductDetailModal';
import { toast } from 'sonner';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

/* ─── Font maps ─────────────────────────────────────────────── */
const FONT_MAP: Record<string, string> = {
  inter: 'Inter, sans-serif',
  poppins: 'Poppins, sans-serif',
  playfair: '"Playfair Display", serif',
  roboto: 'Roboto, sans-serif',
  montserrat: 'Montserrat, sans-serif',
  lora: 'Lora, serif',
  jakarta: '"Plus Jakarta Sans", sans-serif',
};

const GOOGLE_FONT_MAP: Record<string, string> = {
  poppins: 'Poppins:wght@400;600;700',
  playfair: 'Playfair+Display:ital,wght@0,400;0,700;1,400;1,700',
  roboto: 'Roboto:wght@400;500;700',
  montserrat: 'Montserrat:wght@400;600;700',
  lora: 'Lora:wght@400;600;700',
};

/* ─── Types ──────────────────────────────────────────────────── */
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

interface Story {
  id: string;
  image_url: string;
  is_active: boolean;
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

/* ─── Helpers ────────────────────────────────────────────────── */
function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
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

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ─── Category icons & emojis ────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, { icon: any; emoji: string; color: string }> = {
  hamburguer: { icon: Flame, emoji: '🍔', color: '#f59e0b' },
  burger:     { icon: Flame, emoji: '🍔', color: '#f59e0b' },
  pizza:      { icon: Pizza, emoji: '🍕', color: '#ef4444' },
  massa:      { icon: Utensils, emoji: '🍝', color: '#ef4444' },
  prato:      { icon: Utensils, emoji: '🍽️', color: '#10b981' },
  bebida:     { icon: Coffee, emoji: '🥤', color: '#3b82f6' },
  suco:       { icon: Grape, emoji: '🍹', color: '#8b5cf6' },
  doce:       { icon: Cake, emoji: '🍰', color: '#ec4899' },
  sobremesa:  { icon: IceCream, emoji: '🍨', color: '#ec4899' },
  frango:     { icon: Drumstick, emoji: '🍗', color: '#f97316' },
  salada:     { icon: Salad, emoji: '🥗', color: '#22c55e' },
  carnes:     { icon: ChefHat, emoji: '🥩', color: '#b91c1c' },
  peixe:      { icon: ChefHat, emoji: '🐟', color: '#0ea5e9' },
  default:    { icon: List, emoji: '🍴', color: '#64748b' },
};

function getCategoryConfig(name: string) {
  const lower = name.toLowerCase();
  const key = Object.keys(CATEGORY_CONFIG).find(k => lower.includes(k));
  return CATEGORY_CONFIG[key || 'default'];
}

/* ─── Animations ─────────────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 32, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

/* ════════════════════════════════════════════════════════════════
   HERO SLIDER
 ════════════════════════════════════════════════════════════════ */
function HeroSlider({ profile, menuCategories, accentColor }: { profile: Profile, menuCategories: MenuCategory[], accentColor: string }) {
  const slides = useMemo(() => {
    const list: { id: string, image: string, title: string }[] = [];
    
    // 1. Prioritize Multi-Banners (Carousel)
    const bannerUrls = (profile as any).banner_urls as string[] || [];
    if (bannerUrls.length > 0) {
      bannerUrls.forEach((url, idx) => {
        list.push({ id: `banner-${idx}`, image: url, title: profile.restaurant_name });
      });
    } else if (profile.banner_url) {
      // 2. Fallback to Legacy Single Banner
      list.push({ id: 'main', image: profile.banner_url, title: profile.restaurant_name });
    }

    // 3. Optional: Add product images as secondary slides if list is short
    if (list.length < 2 && menuCategories && menuCategories.length > 0) {
      const allProducts = menuCategories.flatMap(c => c.items);
      const withImages = allProducts.filter(p => !!p.image_url);
      withImages.slice(0, 2).forEach(p => {
        list.push({ id: `prod-${p.id}`, image: p.image_url!, title: p.name });
      });
    }

    // 4. Final Fallback
    if (list.length === 0) {
      list.push({ id: 'default', image: '', title: profile.restaurant_name });
    }
    return list;
  }, [profile, menuCategories]);

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ aspectRatio: '1024/683' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {slides[current].image ? (
            <img src={slides[current].image} alt={slides[current].title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Better indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-[28%] left-0 right-0 z-10 flex justify-center gap-1.5 px-6">
           <div className="flex bg-black/40 backdrop-blur-xl px-2.5 py-1.5 rounded-full border border-white/10">
             {slides.map((_, idx) => (
                <button
                   key={idx}
                   onClick={(e) => { e.preventDefault(); setCurrent(idx); }}
                   className="relative h-1.5 mx-0.5 focus:outline-none ring-offset-black"
                >
                  <div className={`h-full rounded-full transition-all duration-500 ${current === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`} />
                  {current === idx && (
                    <motion.div
                      layoutId="slider-pill"
                      className="absolute inset-0 bg-white rounded-full z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
 ════════════════════════════════════════════════════════════════ */
export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, setRestaurant } = useCartStore();

  const [profile, setProfile]             = useState<Profile | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading]             = useState(true);
  const [notFound, setNotFound]           = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchOpen, setSearchOpen]       = useState(false);
  const [isOpen, setIsOpen]               = useState<boolean | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen]       = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const isSuspended = profile &&
    (profile.is_active === false || profile.plan_status === 'expired' || profile.plan_status === 'inactive');

  /* ── Interaction Observer for active category tracking ── */
  useEffect(() => {
    if (loading || menuCategories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace('cat-', ''));
          }
        });
      },
      { threshold: 0.3, rootMargin: '-10% 0px -70% 0px' }
    );

    const elements = document.querySelectorAll('section[id^="cat-"]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [loading, menuCategories, searchQuery]);

  /* ── Memoised static ratings ── */
  const itemRatings = useMemo(() => {
    const ratings: Record<string, { star: string; count: number }> = {};
    menuCategories.forEach(cat => {
      cat.items.forEach(item => {
        ratings[item.id] = {
          star: (4.5 + Math.random() * 0.4).toFixed(1),
          count: Math.floor(15 + Math.random() * 150),
        };
      });
    });
    return ratings;
  }, [menuCategories]);

  /* ── Filtered categories ── */
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return menuCategories;
    const q = searchQuery.toLowerCase();
    return menuCategories
      .map(cat => ({ ...cat, items: cat.items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase() || '').includes(q)
      )}))
      .filter(cat => cat.items.length > 0);
  }, [menuCategories, searchQuery]);

  /* ── Data fetch ── */
  useEffect(() => {
    if (!slug) return;
    async function fetchMenu() {
      setLoading(true);
      let { data: prof, error: profError } = await supabase
        .from('profiles').select('*').eq('slug', slug!).single();

      // Fallback: Se não encontrar pelo slug, tenta pelo user_id
      if (profError || !prof) {
        const { data: profById, error: idError } = await supabase
          .from('profiles').select('*').eq('user_id', slug!).single();
        
        if (idError || !profById) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        prof = profById;
      }

      setProfile(prof as unknown as Profile);
      setRestaurant(slug!, prof.user_id, prof.restaurant_name, prof.whatsapp || '', prof.delivery_fee || 0);

      if (prof.is_active === false || prof.plan_status === 'expired' || prof.plan_status === 'inactive') {
        setLoading(false); return;
      }

      const [catRes, prodRes, hoursRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', prof.user_id).order('sort_order'),
        supabase.from('products').select('*').eq('user_id', prof.user_id).eq('is_active', true).order('sort_order'),
        (supabase as any).from('business_hours').select('*').eq('user_id', prof.user_id),
      ]);

      const categories = (catRes.data || []) as Category[];
      const products   = (prodRes.data || []) as Product[];
      const hours      = hoursRes.data || [];

      if (hours.length > 0) {
        const now = new Date();
        const todayHours = hours.find((h: any) => h.day_of_week === now.getDay());
        if (todayHours) {
          if (!todayHours.is_open) {
            setIsOpen(false);
          } else if (todayHours.open_time && todayHours.close_time) {
            const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            setIsOpen(cur >= todayHours.open_time && cur <= todayHours.close_time);
          } else { setIsOpen(true); }
        } else {
          setIsOpen(false);
        }
      } else {
        setIsOpen(true);
      }

      const grouped: MenuCategory[] = [];
      categories.forEach(cat => {
        const items = products.filter(p => p.category_id === cat.id);
        if (items.length > 0) grouped.push({ name: cat.name, items });
      });
      const uncategorized = products.filter(p => !p.category_id);
      if (uncategorized.length > 0) grouped.push({ name: 'Outros', items: uncategorized });

      setMenuCategories(grouped);
      
      const { data: storiesData } = await (supabase as any)
        .from('menu_stories')
        .select('*')
        .eq('user_id', prof.user_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setStories(storiesData || []);

      setLoading(false);

      // Deduplication: Only track view if not already tracked in this session for this slug
      const sessionKey = `viewed_${slug}`;
      if (!sessionStorage.getItem(sessionKey)) {
        (supabase as any).from('menu_views').insert({ restaurant_user_id: prof.user_id, slug });
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
    fetchMenu();
  }, [slug, setRestaurant]);

  /* ── SEO meta ── */
  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.restaurant_name} — Cardápio Digital`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name); document.head.appendChild(el); }
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
    jsonLd.type = 'application/ld+json'; jsonLd.id = 'menu-jsonld';
    jsonLd.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Restaurant', name: profile.restaurant_name, url: window.location.href, ...(profile.logo_url && { image: profile.logo_url }), servesCuisine: 'Diversos', hasMenu: { '@type': 'Menu', url: window.location.href } });
    document.head.appendChild(jsonLd);
    return () => { document.title = 'Menu Pro'; document.getElementById('menu-jsonld')?.remove(); };
  }, [profile]);

  /* ── Theme color ── */
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
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else { if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark'); else root.classList.remove('dark'); }
    return () => {
      document.documentElement.style.removeProperty('--accent-color');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--ring');
      root.classList.remove('dark');
    };
  }, [profile?.primary_color, profile?.theme_mode]);

  /* ── Fonts ── */
  useEffect(() => {
    // Always load Plus Jakarta Sans for the menu regardless of user setting
    const extraLink = document.getElementById('menu-jakarta-font') || (() => {
      const l = document.createElement('link');
      l.id = 'menu-jakarta-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap';
      document.head.appendChild(l); return l;
    })();

    const fontKey = profile?.font_style || 'inter';
    const googleFont = GOOGLE_FONT_MAP[fontKey];
    if (googleFont) {
      const linkId = 'menu-google-font';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId; link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${googleFont}&display=swap`;
        document.head.appendChild(link);
      }
    }
    const family = FONT_MAP[fontKey] || '"Plus Jakarta Sans", sans-serif';
    document.documentElement.style.setProperty('--menu-font', family);
    return () => {
      document.documentElement.style.removeProperty('--menu-font');
      document.getElementById('menu-google-font')?.remove();
    };
  }, [profile?.font_style]);

  /* ── Handlers ── */
  const handleAdd = (item: { id: string; name: string; price: number; addons?: SelectedAddon[] }) => {
    addItem({ id: item.id, name: item.name, price: item.price, addons: item.addons });
    toast.success(`✓ ${item.name} adicionado!`, { duration: 1400 });
  };

  /* ── States não logados ── */
  if (loading) return <MenuSkeleton />;

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
      <div className="min-h-screen bg-[#f8fafc] dark:bg-background flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-32 h-32 rounded-[40px] shadow-2xl overflow-hidden mb-8 bg-white p-4">
          {profile.logo_url ? <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-3xl">{profile.restaurant_name[0]?.toUpperCase()}</div>}
        </motion.div>
        <h1 className="text-3xl font-black mb-2">{profile.restaurant_name}</h1>
        <div className="bg-white dark:bg-card p-10 rounded-[32px] max-w-md w-full shadow-sm border border-border/5">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><Clock className="w-6 h-6 text-primary animate-pulse" /></div>
          <h2 className="text-lg font-black uppercase tracking-tight mb-4">Já Voltamos!</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">Estamos atualizando nossos itens e preparativos para te atender melhor. Obrigado pela paciência!</p>
        </div>
        <footer className="mt-12 text-[10px] uppercase font-black tracking-widest text-muted-foreground/30">Powered by <span className="text-primary/60">Menu Pro</span></footer>
      </div>
    );
  }

  if (isOpen === false) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-background flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-32 h-32 rounded-[40px] shadow-2xl overflow-hidden mb-8 bg-white p-4">
          {profile.logo_url ? <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-3xl">{profile.restaurant_name[0]?.toUpperCase()}</div>}
        </motion.div>
        <h1 className="text-3xl font-black mb-2">{profile.restaurant_name}</h1>
        <div className="bg-white dark:bg-card p-8 rounded-[32px] max-w-md w-full shadow-sm border border-border/5 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-3 text-foreground">Estamos Fechados no Momento</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Nosso delivery e retiradas estão temporariamente indisponíveis. 
            Verifique nossos horários de funcionamento e volte mais tarde!
          </p>
          <Button variant="outline" className="w-full rounded-full" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
        <footer className="mt-12 text-[10px] uppercase font-black tracking-widest text-muted-foreground/30">Powered by <span className="text-primary/60">Menu Pro</span></footer>
      </div>
    );
  }

  const isPremium = profile.menu_layout === 'premium';
  const accentColor = profile.primary_color || '#16a34a';

  return (
    <>
      {/* ─── GOOGLE FONTS INLINE STYLE TAG ─── */}
      <style>{`
        :root { 
          --pm-accent: ${accentColor};
          --pm-glass: rgba(255, 255, 255, 0.7);
          --pm-glass-dark: rgba(20, 20, 20, 0.7);
        }
        .pm-font-display { font-family: "Playfair Display", Georgia, serif; }
        .pm-font-body   { font-family: "Plus Jakarta Sans", system-ui, sans-serif; }
        .pm-hero-gradient { background: linear-gradient(to top, #0d0d0d 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.1) 70%, transparent 100%); }
        .pm-card-hover { transition: all 0.4s cubic-bezier(.22,1,.36,1); }
        .pm-card-hover:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); }
        .pm-add-btn { transition: all 0.2s cubic-bezier(.22,1,.36,1); }
        .pm-add-btn:active { transform: scale(0.85); }
        .pm-cat-pill { transition: all 0.3s cubic-bezier(.22,1,.36,1); }
        .pm-search-bar { transition: all 0.4s cubic-bezier(.22,1,.36,1); }
        .pm-search-bar:focus-within { transform: scale(1.02); box-shadow: 0 10px 30px -10px color-mix(in srgb, ${accentColor} 40%, transparent); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pm-open-badge  { background: rgba(34,197,94,0.15); color: #16a34a; }
        .pm-close-badge { background: rgba(239,68,68,0.12); color: #dc2626; }
        .pm-dark-card { background: #1a1a1a; }
        .pm-dark-card:hover { background: #222222; }
        @keyframes pm-pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, ${accentColor} 40%, transparent); }
          50%      { box-shadow: 0 0 0 8px color-mix(in srgb, ${accentColor} 0%, transparent); }
        }
        .pm-pulse { animation: pm-pulse-ring 2s infinite; }
      `}</style>

      <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0d0d0d] relative pm-font-body" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>

        {/* ══════════════════════════════════════════
            HERO SECTION — dark premium banner
        ══════════════════════════════════════════ */}
        <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full">
          {/* Banner */}
          <div className="relative h-[300px] sm:h-[380px] md:h-[420px] w-full overflow-hidden">
            {/* Animated Hero Slider */}
            <HeroSlider profile={profile} menuCategories={menuCategories} accentColor={accentColor} />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 pm-hero-gradient" />
            {/* top subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

            {/* ── TOP BAR: Logo + Location + Status ── */}
            <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
              <div className="max-w-3xl mx-auto px-5 pt-5 flex items-center justify-between">
                {/* Logo + name */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex-shrink-0 shadow-lg">
                    {profile.logo_url
                      ? <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">{profile.restaurant_name[0]}</div>
                    }
                  </div>
                  <div>
                    <p className="text-white/60 text-[9px] uppercase tracking-widest font-semibold">Delivery</p>
                    <p className="text-white font-bold text-sm leading-tight truncate max-w-[140px]">{profile.restaurant_name}</p>
                  </div>
                </div>

                {/* Open/Close badge */}
                {isOpen !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${isOpen ? 'border-emerald-500/20 pm-open-badge' : 'border-red-500/20 pm-close-badge'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {isOpen ? 'Aberto' : 'Fechado'}
                  </div>
                )}
              </div>
            </div>

            {/* ── HERO TITLE — Playfair Display ── */}
            <div className="absolute bottom-0 left-0 right-0 z-10 max-w-3xl mx-auto px-5 pb-8 sm:pb-10">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-white/60 text-[10px] uppercase tracking-[0.25em] font-bold mb-1"
              >
                Cardápio Digital
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="pm-font-display text-white font-bold italic text-4xl sm:text-5xl md:text-7xl leading-[0.95] drop-shadow-2xl"
                style={{ color: '#ffffff', textShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
              >
                {profile.restaurant_name}
              </motion.h1>

              {/* Badges row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="flex items-center gap-2 mt-3 flex-wrap"
              >
                {/* Rating */}
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-xl shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-white text-[12px] font-black tracking-tight">4.9</span>
                  <div className="w-1 h-1 rounded-full bg-white/30 mx-0.5" />
                  <span className="text-white/60 text-[11px] font-medium">250+</span>
                </div>

                {/* Tempo */}
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-xl shadow-lg">
                  <Clock className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-white text-[12px] font-black tracking-tight">30-45m</span>
                </div>

                {/* Entrega */}
                {(profile.show_delivery_info ?? true) && (
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-xl shadow-lg">
                    <Truck className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-white text-[12px] font-black tracking-tight">
                      {profile.custom_delivery_label || (profile.delivery_fee === 0 ? 'Grátis' : formatCurrency(profile.delivery_fee))}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* ─── STORIES SECTION ─── */}
        <AnimatePresence>
          {stories.length > 0 && !searchQuery && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative z-20 px-5 pt-8 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 rounded-full bg-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Destaques do Dia</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {stories.map((story, i) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] border-2 border-primary/30 active:scale-90 transition-transform cursor-pointer"
                  >
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-background shadow-inner">
                      <img src={story.image_url} alt="Story" className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════
            MAIN CONTENT — expanded desktop container
        ══════════════════════════════════════════ */}
        <div className="relative z-10 -mt-5 bg-[#f4f4f4] dark:bg-[#111111] rounded-t-[28px] min-h-screen">
          <div className="w-full max-w-[1400px] mx-auto">

            {/* ── SEARCH BAR ── */}
            <div className="px-5 pt-7 pb-3 flex justify-center sticky top-0 z-50 bg-inherit/30 pm-glass group">
              <div className="relative pm-search-bar bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.08] w-full max-w-xl">
                <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="O que você quer comer hoje?"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 h-13 bg-transparent text-sm font-semibold placeholder:text-gray-400 placeholder:font-medium focus:outline-none rounded-2xl dark:text-white"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* ── CATEGORY PILLS ── */}
            <div className="sticky top-[76px] z-40 bg-inherit/40 pm-glass pt-2 pb-4 px-5 border-b border-black/[0.03] dark:border-white/[0.03]">
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar max-w-[1400px] mx-auto">
                {filteredCategories.map(cat => {
                  const cfg = getCategoryConfig(cat.name);
                  return (
                    <CategoryPill
                      key={cat.name}
                      emoji={cfg.emoji}
                      label={cat.name}
                      active={activeCategory === cat.name}
                      accentColor={accentColor}
                      onClick={() => {
                        const target = document.getElementById(`cat-${cat.name}`);
                        if (target) {
                          const offset = 140;
                          const bodyRect = document.body.getBoundingClientRect().top;
                          const elementRect = target.getBoundingClientRect().top;
                          const elementPosition = elementRect - bodyRect;
                          const offsetPosition = elementPosition - offset;
                          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                          setActiveCategory(cat.name);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* ── DESTASQUES DO CHEF ── */}
            {!searchQuery && menuCategories.some(c => c.items.some(i => i.is_upsell)) && (
              <div className="px-5 pt-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
                    <h2 className="pm-font-display text-2xl font-black tracking-tight italic">Destaques do Chef</h2>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-lg">Popular</span>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5">
                  {menuCategories.flatMap(c => c.items).filter(i => i.is_upsell).map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedProduct(item)}
                      className="min-w-[280px] sm:min-w-[320px] bg-white dark:bg-[#1a1a1a] rounded-[28px] overflow-hidden pm-card-hover border border-black/[0.04] dark:border-white/[0.06] relative group"
                    >
                       <div className="relative h-48 overflow-hidden">
                          {item.image_url ? (
                            <ItemImage src={item.image_url} alt={item.name} />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Utensils className="w-10 h-10 text-muted-foreground/20" />
                            </div>
                          )}
                          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-xl border border-white/20 p-2 rounded-2xl">
                             <Heart className="w-4 h-4 text-white fill-white" />
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">✨ Seleção Premium</span>
                          </div>
                       </div>
                       <div className="p-5">
                          <h3 className="font-bold text-lg mb-1 line-clamp-1">{item.name}</h3>
                          <p className="text-muted-foreground text-xs line-clamp-1 mb-4">{item.description || 'Sabor inigualável e qualidade premium.'}</p>
                          <div className="flex items-center justify-between">
                             <div className="flex flex-col">
                               <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 leading-none">A partir de</span>
                               <span className="text-xl font-black text-primary">{formatCurrency(item.price)}</span>
                             </div>
                             <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                                <Plus className="w-5 h-5 stroke-[3px]" />
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRODUCT SECTIONS ── */}
            <div className="px-5 pb-40 pt-4 space-y-8">
              {filteredCategories.length === 0 && searchQuery && (
                <div className="text-center py-20">
                  <p className="text-gray-400 font-medium italic">Nenhum resultado para "{searchQuery}"</p>
                </div>
              )}

              {filteredCategories.map((cat, catIdx) => (
                <motion.section
                  id={`cat-${cat.name}`}
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: catIdx * 0.04 }}
                >
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-6 group/title">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-black/[0.03] dark:border-white/10 flex items-center justify-center text-xl">
                        {getCategoryConfig(cat.name).emoji}
                      </div>
                      <h2 className="pm-font-display text-xl sm:text-2xl font-black italic tracking-tight">{cat.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{cat.items.length} ITENS</span>
                       <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover/title:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Items */}
                  {isPremium ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                      {cat.items.map((item, i) => {
                        const rating = itemRatings[item.id] || { star: '4.8', count: 80 };
                        return (
                          <motion.div
                            key={item.id}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-20px' }}
                            onClick={() => setSelectedProduct(item)}
                            className="bg-white dark:bg-[#18191a] rounded-[28px] overflow-hidden cursor-pointer group pm-card-hover border border-black/[0.04] dark:border-white/[0.06] flex flex-col h-full"
                          >
                            <div className="relative h-44 sm:h-48 overflow-hidden bg-muted">
                              {item.image_url ? (
                                <ItemImage src={item.image_url} alt={item.name} />
                              ) : (
                                <div className="w-full h-full bg-gray-100 dark:bg-[#252525] flex items-center justify-center">
                                  <Utensils className="w-8 h-8 text-gray-300 dark:text-white/10" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl shadow-lg border border-white/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-gray-900 dark:text-white text-[11px] font-black">{rating.star}</span>
                              </div>
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                              <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
                              {item.description && <p className="text-muted-foreground text-[11px] line-clamp-2 mb-3 leading-relaxed">{item.description}</p>}
                              <div className="mt-auto pt-2 flex items-center justify-between">
                                <span className="font-black text-base text-primary">{formatCurrency(item.price)}</span>
                                <button
                                  disabled={!item.is_available}
                                  onClick={e => { e.stopPropagation(); handleAdd({ id: item.id, name: item.name, price: item.price }); }}
                                  className="w-10 h-10 rounded-2xl flex items-center justify-center pm-add-btn pm-pulse text-white shadow-lg transition-all active:scale-95 disabled:opacity-40"
                                  style={{ backgroundColor: accentColor, boxShadow: `0 8px 16px -4px ${accentColor}40` }}
                                >
                                  <Plus className="w-5 h-5 stroke-[3px]" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                      {cat.items.map((item, i) => {
                        const rating = itemRatings[item.id] || { star: '4.8', count: 80 };
                        return (
                          <motion.div
                            key={item.id}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-20px' }}
                            onClick={() => setSelectedProduct(item)}
                            className="bg-white dark:bg-[#1a1a1a] rounded-[24px] overflow-hidden cursor-pointer pm-card-hover border border-black/[0.04] dark:border-white/[0.06] flex group h-32 sm:h-36"
                          >
                            <div className="relative w-32 sm:w-36 h-full shrink-0 overflow-hidden bg-muted">
                              {item.image_url ? (
                                <ItemImage src={item.image_url} alt={item.name} />
                              ) : (
                                <div className="w-full h-full bg-gray-50 dark:bg-[#222] flex items-center justify-center">
                                  <Utensils className="w-8 h-8 text-gray-200 dark:text-white/5" />
                                </div>
                              )}
                              {!item.is_available && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                  <span className="text-white text-[9px] font-black uppercase tracking-widest border border-white/20 px-2 py-0.5 rounded">Esgotado</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                              <div className="space-y-1">
                                <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h3>
                                {item.description ? (
                                  <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">{item.description}</p>
                                ) : (
                                  <p className="text-muted-foreground/40 text-[10px] italic">Sem descrição disponível.</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col">
                                   <div className="flex items-center gap-1 mb-0.5">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                      <span className="text-[10px] font-black text-muted-foreground">{rating.star}</span>
                                   </div>
                                   <span className="font-black text-base text-foreground">{formatCurrency(item.price)}</span>
                                </div>
                                <button
                                  disabled={!item.is_available}
                                  onClick={e => { e.stopPropagation(); handleAdd({ id: item.id, name: item.name, price: item.price }); }}
                                  className="flex items-center gap-1.5 px-4 h-9 rounded-[14px] text-white text-[11px] font-black uppercase tracking-wide pm-add-btn shadow-md disabled:opacity-40 transition-all active:scale-95"
                                  style={{ backgroundColor: item.is_available ? accentColor : '#9ca3af', boxShadow: item.is_available ? `0 4px 12px -2px ${accentColor}40` : 'none' }}
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                                  <span>{isPremium ? '' : 'Adicionar'}</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.section>
              ))}
            </div>

          </div>
        </div>

        <BottomNav
          onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onCategoriesClick={() => document.getElementById(`cat-${filteredCategories[0]?.name}`)?.scrollIntoView({ behavior: 'smooth' })}
          onSearchClick={() => { window.scrollTo({ top: 200, behavior: 'smooth' }); setTimeout(() => searchRef.current?.focus(), 500); }}
          onCartClick={() => setIsCartOpen(true)}
          accentColor={accentColor}
        />
        <CartDrawer accentColor={accentColor} />

        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            open={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={handleAdd}
            accentColor={accentColor}
          />
        )}

        <footer className="text-center py-10 px-6 bg-white dark:bg-[#1a1a1a] border-t border-black/[0.05] dark:border-white/[0.05]">
          <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
            Powered by <span className="font-black" style={{ color: accentColor }}>Menu Pro</span>
          </p>
        </footer>
      </div>
    </>
  );
}

function ItemImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-muted-foreground/20 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function CategoryPill({
  emoji, label, active, onClick, accentColor,
}: {
  emoji: string; label: string; active: boolean; onClick: () => void; accentColor: string;
}) {
  const scrollRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [active]);

  return (
    <button
      ref={scrollRef}
      onClick={onClick}
      className={`pm-cat-pill flex items-center gap-2 px-4 py-2.5 rounded-[18px] shrink-0 text-sm font-black tracking-tight whitespace-nowrap border transition-all active:scale-95 ${
        active
          ? 'text-white shadow-lg border-transparent'
          : 'bg-white/70 dark:bg-white/5 pm-glass text-muted-foreground border-black/[0.04] dark:border-white/[0.08] hover:bg-white dark:hover:bg-white/10'
      }`}
      style={active ? { backgroundColor: accentColor, boxShadow: `0 8px 20px -6px ${accentColor}60` } : undefined}
    >
      <span className="text-lg leading-none">{emoji}</span>
      <span className="uppercase text-[10px] tracking-widest">{label}</span>
      {active && (
        <motion.div
           layoutId="cat-indicator"
           className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
        />
      )}
    </button>
  );
}
