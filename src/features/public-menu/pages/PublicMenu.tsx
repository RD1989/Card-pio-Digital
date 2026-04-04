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
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

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
      const { data: prof, error: profError } = await supabase
        .from('profiles').select('*').eq('slug', slug!).single();

      if (profError || !prof) { setNotFound(true); setLoading(false); return; }

      setProfile(prof as unknown as Profile);
      setRestaurant(slug!, prof.user_id, prof.restaurant_name, prof.whatsapp || '');

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
      setLoading(false);

      (supabase as any).from('menu_views').insert({ restaurant_user_id: prof.user_id, slug });
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
        :root { --pm-accent: ${accentColor}; }
        .pm-font-display { font-family: "Playfair Display", Georgia, serif; }
        .pm-font-body   { font-family: "Plus Jakarta Sans", system-ui, sans-serif; }
        .pm-hero-gradient { background: linear-gradient(to top, #0d0d0d 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3) 70%, transparent 100%); }
        .pm-card-hover { transition: transform 0.28s cubic-bezier(.22,1,.36,1), box-shadow 0.28s cubic-bezier(.22,1,.36,1); }
        .pm-card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -8px rgba(0,0,0,0.14); }
        .pm-add-btn { transition: transform 0.18s ease, opacity 0.18s ease; }
        .pm-add-btn:active { transform: scale(0.9); }
        .pm-cat-pill { transition: all 0.22s ease; }
        .pm-search-bar { transition: box-shadow 0.3s ease; }
        .pm-search-bar:focus-within { box-shadow: 0 0 0 3px color-mix(in srgb, ${accentColor} 20%, transparent); }
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
            {profile.banner_url ? (
              <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover scale-[1.04] hover:scale-100 transition-transform duration-[2s]" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, #0d0d0d 0%, color-mix(in srgb, ${accentColor} 25%, #0d0d0d) 100%)` }} />
            )}

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
                transition={{ delay: 0.22, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="pm-font-display text-white font-bold italic text-4xl sm:text-5xl md:text-6xl leading-[1.05] drop-shadow-2xl"
                style={{ color: '#ffffff', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
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
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-white text-[11px] font-bold">4.9</span>
                  <span className="text-white/50 text-[10px]">• 250+ avaliações</span>
                </div>

                {/* Tempo */}
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3 h-3 text-white/70" />
                  <span className="text-white text-[11px] font-bold">30-45 min</span>
                </div>

                {/* Entrega */}
                {(profile.show_delivery_info ?? true) && (
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg">
                    <Truck className="w-3 h-3 text-white/70" />
                    <span className="text-white text-[11px] font-bold">
                      {profile.custom_delivery_label || (profile.delivery_fee === 0 ? 'Frete Grátis' : formatCurrency(profile.delivery_fee))}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* ══════════════════════════════════════════
            MAIN CONTENT — white rounded card
        ══════════════════════════════════════════ */}
        <div className="relative z-10 -mt-5 bg-[#f4f4f4] dark:bg-[#111111] rounded-t-[28px] min-h-screen">
          <div className="max-w-3xl mx-auto">

            {/* ── SEARCH BAR ── */}
            <div className="px-5 pt-6 pb-2">
              <div className="relative pm-search-bar bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-black/[0.06] dark:border-white/[0.06]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar pratos, lanches ou sobremesas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 h-12 bg-transparent text-sm font-medium placeholder:text-gray-400 focus:outline-none rounded-2xl"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* ── CATEGORY PILLS ── */}
            <div className="sticky top-0 z-40 bg-[#f4f4f4]/90 dark:bg-[#111111]/90 backdrop-blur-xl pt-3 pb-3 px-5 border-b border-black/[0.05] dark:border-white/[0.05]">
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
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
                        setActiveCategory(cat.name);
                        document.getElementById(`cat-${cat.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    />
                  );
                })}
              </div>
            </div>

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
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryConfig(cat.name).emoji}</span>
                      <h2 className="text-lg font-extrabold tracking-tight">{cat.name}</h2>
                    </div>
                    <div className="h-px flex-1 bg-black/[0.07] dark:bg-white/[0.07]" />
                    <span className="text-[11px] font-semibold text-gray-400">{cat.items.length} {cat.items.length === 1 ? 'item' : 'itens'}</span>
                  </div>

                  {/* Items */}
                  {isPremium ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {cat.items.map((item, i) => {
                        const rating = itemRatings[item.id] || { star: '4.8', count: 80 };
                        return (
                          <motion.div
                            key={item.id}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            onClick={() => setSelectedProduct(item)}
                            className="pm-dark-card rounded-[22px] overflow-hidden cursor-pointer group pm-card-hover"
                          >
                            <div className="relative h-40 overflow-hidden bg-muted">
                              {item.image_url ? (
                                <ItemImage src={item.image_url} alt={item.name} />
                              ) : (
                                <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                                  <Utensils className="w-8 h-8 text-white/10" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/90 via-black/20 to-transparent" />
                              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-white text-[11px] font-bold">{rating.star}</span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="text-white font-bold text-sm leading-tight line-clamp-1 mb-1">{item.name}</h3>
                              {item.description && <p className="text-white/40 text-[11px] line-clamp-1 mb-3">{item.description}</p>}
                              <div className="flex items-center justify-between mt-auto">
                                <span className="font-extrabold text-base" style={{ color: accentColor }}>{formatCurrency(item.price)}</span>
                                <button
                                  disabled={!item.is_available}
                                  onClick={e => { e.stopPropagation(); handleAdd({ id: item.id, name: item.name, price: item.price }); }}
                                  className="w-9 h-9 rounded-full flex items-center justify-center pm-add-btn pm-pulse disabled:opacity-40 disabled:cursor-not-allowed"
                                  style={{ backgroundColor: accentColor }}
                                >
                                  <Plus className="w-4 h-4 text-white stroke-[2.5px]" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cat.items.map((item, i) => {
                        const rating = itemRatings[item.id] || { star: '4.8', count: 80 };
                        return (
                          <motion.div
                            key={item.id}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            onClick={() => setSelectedProduct(item)}
                            className="bg-white dark:bg-[#1e1e1e] rounded-2xl overflow-hidden cursor-pointer pm-card-hover border border-black/[0.05] dark:border-white/[0.05] flex"
                          >
                            <div className="relative w-[120px] sm:w-[140px] h-[120px] sm:h-[140px] shrink-0 overflow-hidden bg-muted">
                              {item.image_url ? (
                                <ItemImage src={item.image_url} alt={item.name} />
                              ) : (
                                <div className="w-full h-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                                  <Utensils className="w-8 h-8 text-gray-300 dark:text-white/10" />
                                </div>
                              )}
                              {!item.is_available && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">Esgotado</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                              <div>
                                <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2 mb-1">{item.name}</h3>
                                {item.description && (
                                  <p className="text-gray-500 dark:text-gray-400 text-[12px] leading-snug line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-2 gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex items-center gap-0.5">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{rating.star}</span>
                                      <span className="text-[10px] text-gray-400 ml-0.5">{rating.count}</span>
                                    </div>
                                  </div>
                                  <span className="font-extrabold text-base text-gray-900 dark:text-white">{formatCurrency(item.price)}</span>
                                </div>
                                <button
                                  disabled={!item.is_available}
                                  onClick={e => { e.stopPropagation(); handleAdd({ id: item.id, name: item.name, price: item.price }); }}
                                  className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-white text-xs font-bold pm-add-btn shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                  style={{ backgroundColor: item.is_available ? '#22c55e' : '#9ca3af' }}
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
                                  Adicionar
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
      className={`pm-cat-pill flex items-center gap-1.5 px-3.5 py-2 rounded-2xl shrink-0 text-sm font-semibold whitespace-nowrap border transition-all ${
        active
          ? 'text-white shadow-md border-transparent'
          : 'bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-300 border-black/[0.07] dark:border-white/[0.07]'
      }`}
      style={active ? { backgroundColor: accentColor } : undefined}
    >
      <span className="text-base">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
