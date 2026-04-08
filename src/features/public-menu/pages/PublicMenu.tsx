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

/* ── Category icons & emojis ────────────────────────────────── */
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

/* ════════════════════════════════════════════════════════════════
   HERO SLIDER — Modern Carousel
 ════════════════════════════════════════════════════════════════ */
function HeroSlider({ profile, menuCategories, accentColor }: { profile: Profile, menuCategories: MenuCategory[], accentColor: string }) {
  const slides = useMemo(() => {
    const list: { id: string, image: string, title: string }[] = [];
    
    const bannerUrls = (profile as any).banner_urls as string[] || [];
    if (bannerUrls.length > 0) {
      bannerUrls.forEach((url, idx) => {
        list.push({ id: `banner-${idx}`, image: url, title: profile.restaurant_name });
      });
    } else if (profile.banner_url) {
      list.push({ id: 'main', image: profile.banner_url, title: profile.restaurant_name });
    }

    if (list.length < 2 && menuCategories.length > 0) {
      const withImages = menuCategories.flatMap(c => c.items).filter(p => !!p.image_url);
      withImages.slice(0, 2).forEach(p => {
        list.push({ id: `prod-${p.id}`, image: p.image_url!, title: p.name });
      });
    }
    return list.length > 0 ? list : [{ id: 'default', image: '', title: profile.restaurant_name }];
  }, [profile, menuCategories]);

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => setCurrent(p => (p + 1) % slides.length), 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
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

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-1.5">
           <div className="flex bg-black/40 backdrop-blur-xl px-2.5 py-1.5 rounded-full border border-white/10">
             {slides.map((_, idx) => (
                <button key={idx} onClick={() => setCurrent(idx)} className="relative h-1.5 mx-0.5 focus:outline-none">
                  <div className={`h-full rounded-full transition-all duration-500 ${current === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`} />
                </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STORE HEADER — Static background + floating card
 ════════════════════════════════════════════════════════════════ */
function StoreHeader({ profile, isOpen, accentColor }: { profile: Profile, isOpen: boolean | null, accentColor: string }) {
  return (
    <div className="relative w-full mb-12">
      <div className="relative h-[200px] sm:h-[240px] w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Cover" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-black" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-20 px-5 max-w-3xl mx-auto mb-8 flex flex-col">
         
         <div className="flex items-end gap-3">
            {/* Logo Flutuante (único elemento que sobrepõe a capa) */}
            <div className="relative flex-shrink-0 -mt-10 self-start">
               <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] overflow-hidden bg-white dark:bg-[#1a1a1a] p-1 shadow-2xl border border-black/5 dark:border-white/10">
                 {profile.logo_url ? (
                   <img src={profile.logo_url} alt={profile.restaurant_name} className="w-full h-full object-cover rounded-[18px]" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xl rounded-[18px]">{profile.restaurant_name[0]}</div>
                 )}
               </div>
            </div>

            {/* Informação Aberto/Fechado (Abaixo do banner, à direita do logo, acima do nome) */}
            {isOpen !== null && (
              <div className="pb-1 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className={`flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm border border-transparent whitespace-nowrap flex-shrink-0 ${isOpen ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {isOpen ? 'Aberto' : 'Fechado'}
                </div>
              </div>
            )}
         </div>

         {/* Informações Estratégicas (Alinhadas à esquerda abaixo do conjunto logo+aberto) */}
         <div className="flex flex-col pt-3 w-full">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
              {profile.restaurant_name}
            </h1>
            
            <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar w-full pb-1">
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-[10px] font-bold text-foreground shadow-sm whitespace-nowrap flex-shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>4.9</span>
                <span className="opacity-50 font-normal">(120+)</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-[10px] font-bold text-muted-foreground shadow-sm whitespace-nowrap flex-shrink-0">
                <Clock className="w-3 h-3 opacity-70" />
                <span className="text-foreground">30-45 min</span>
              </div>
              {(profile.show_delivery_info ?? true) && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-[10px] font-bold text-muted-foreground shadow-sm whitespace-nowrap flex-shrink-0">
                  <Truck className="w-3 h-3 opacity-70" />
                  <span className="text-foreground">{profile.custom_delivery_label || (profile.delivery_fee === 0 ? 'Frete Grátis' : formatCurrency(profile.delivery_fee))}</span>
                </div>
              )}
            </div>
         </div>

      </div>
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
  const [isOpen, setIsOpen]               = useState<boolean | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen]       = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading || menuCategories.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setActiveCategory(entry.target.id.replace('cat-', '')); });
    }, { threshold: 0.3, rootMargin: '-10% 0px -70% 0px' });
    document.querySelectorAll('section[id^="cat-"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, menuCategories, searchQuery]);

  const itemRatings = useMemo(() => {
    const r: Record<string, { star: string; count: number }> = {};
    menuCategories.forEach(c => c.items.forEach(i => r[i.id] = { star: (4.5 + Math.random()*0.4).toFixed(1), count: Math.floor(15 + Math.random()*150) }));
    return r;
  }, [menuCategories]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return menuCategories;
    const q = searchQuery.toLowerCase();
    return menuCategories.map(cat => ({ ...cat, items: cat.items.filter(i => i.name.toLowerCase().includes(q) || (i.description?.toLowerCase() || '').includes(q)) })).filter(cat => cat.items.length > 0);
  }, [menuCategories, searchQuery]);

  // Slugs que são rotas do sistema e não devem acionar o PublicMenu
  const SYSTEM_ROUTES = [
    'login', 'register', 'forgot-password', 'reset-password',
    'onboarding', 'menu', 'links', 'order', 'admin', 'super-admin'
  ];

  useEffect(() => {
    if (!slug) return;
    // Se for uma rota do sistema, não tentar carregar como cardápio
    if (SYSTEM_ROUTES.includes(slug.toLowerCase())) return;
    let channel: any;

    async function fetchData() {
      setLoading(true);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || '');

      // Busca por slug primeiro; se for UUID, também tenta por user_id
      let profQuery = supabase.from('profiles').select('*');
      if (isUUID) {
        profQuery = profQuery.or(`slug.eq.${slug},user_id.eq.${slug}`);
      } else {
        profQuery = profQuery.ilike('slug', slug);
      }
      const { data: prof } = await profQuery.maybeSingle();
      
      if (!prof) { 
        setNotFound(true); 
        setLoading(false); 
        return; 
      }
      
      setProfile(prof as any);
      setRestaurant(slug!, prof.user_id, prof.restaurant_name, prof.whatsapp || '', prof.delivery_fee || 0);

      // Função interna para buscar dados e atualizar estado
      const updateMenuData = async () => {
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories')
            .select('*')
            .or(`user_id.eq.${prof.user_id},restaurant_id.eq.${prof.user_id}`)
            .order('sort_order'),
          supabase.from('products')
            .select('*')
            .or(`user_id.eq.${prof.user_id},restaurant_id.eq.${prof.user_id}`)
            .eq('is_active', true)
            .order('sort_order')
        ]);

        const cats = (catRes.data || []) as Category[];
        const prods = (prodRes.data || []) as Product[];
        const grouped: MenuCategory[] = cats.map(c => ({ 
          name: c.name, 
          items: prods.filter(p => p.category_id === c.id) 
        })).filter(g => g.items.length > 0);
        
        setMenuCategories(grouped);
        setIsOpen(true);
      };

      await updateMenuData();
      setLoading(false);

      // Iniciar Real-time
      channel = supabase
        .channel(`menu-${prof.user_id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `user_id=eq.${prof.user_id}`
        }, () => updateMenuData())
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'categories',
          filter: `user_id=eq.${prof.user_id}`
        }, () => updateMenuData())
        .subscribe();
    }

    fetchData();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [slug]);

  useEffect(() => {
    if (!profile) return;
    const hsl = hexToHsl(profile.primary_color || '#16a34a');
    document.documentElement.style.setProperty('--accent-color', profile.primary_color);
    document.documentElement.style.setProperty('--primary', hsl);
    const theme = profile.theme_mode === 'dark' ? 'dark' : (profile.theme_mode === 'light' ? 'light' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [profile]);

  const handleAdd = (item: any) => { addItem(item); toast.success(`✓ ${item.name} adicionado!`); };

  if (loading) return <MenuSkeleton />;
  if (notFound || !profile) return <div className="p-20 text-center">Restaurante não encontrado</div>;

  const accentColor = profile.primary_color || '#16a34a';

  return (
    <>
      <style>{`
        :root { --pm-accent: ${accentColor}; }
        .pm-font-display { font-family: "Playfair Display", serif; }
        .pm-card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
        .pm-glass { backdrop-filter: blur(12px); background: rgba(255,255,255,0.7); }
        .dark .pm-glass { background: rgba(20,20,20,0.7); }
      `}</style>

      <div className="min-h-screen w-full bg-stone-100 dark:bg-[#050505] flex justify-center selection:bg-primary/20">
        <div className="w-full max-w-md relative bg-[#f4f4f4] dark:bg-[#0d0d0d] shadow-[0_0_80px_rgba(0,0,0,0.06)] min-h-screen flex flex-col sm:border-x sm:border-black/5 dark:sm:border-white/5 overflow-x-hidden pb-10">
        
        {/* 1. HEADER */}
        <StoreHeader profile={profile} isOpen={isOpen} accentColor={accentColor} />

        {/* 2. BANNERS */}
        <div className="px-5 mb-10">
           <div className="relative h-[200px] sm:h-[320px] rounded-[32px] overflow-hidden shadow-2xl border border-black/5">
              <HeroSlider profile={profile} menuCategories={menuCategories} accentColor={accentColor} />
           </div>
        </div>

        {/* 3. MAIS PEDIDOS */}
        {!searchQuery && menuCategories.length > 0 && (
          <div className="px-5 mb-12">
            <h2 className="pm-font-display text-2xl font-black italic mb-6">Mais Pedidos 🔥</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5">
              {menuCategories.flatMap(c => c.items).slice(0,6).map((item) => (
                <div key={item.id} onClick={() => setSelectedProduct(item)} className="min-w-[160px] bg-white dark:bg-[#1a1a1a] rounded-[28px] p-4 shadow-sm border border-black/5 flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-4 border-slate-50 dark:border-white/5">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Utensils className="w-8 h-8 text-slate-200" />}
                  </div>
                  <h3 className="font-bold text-xs line-clamp-1 mb-1">{item.name}</h3>
                  <span className="font-black text-primary text-sm">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* 5. MAIN CONTENT */}
        <div className="relative z-10 -mt-6 bg-[#f4f4f4] dark:bg-[#111111] rounded-t-[32px] min-h-screen">
            {/* Search */}
            <div className="sticky top-0 z-50 pm-glass p-5 border-b border-black/5">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Buscar no cardápio..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 h-12 bg-white/50 dark:bg-white/5 rounded-2xl outline-none font-bold text-sm" />
              </div>
            </div>

            {/* Pills */}
            <div className="sticky top-[89px] z-40 pm-glass px-5 py-4 overflow-x-auto no-scrollbar flex gap-3">
              {filteredCategories.map(cat => (
                <button key={cat.name} onClick={() => document.getElementById(`cat-${cat.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat.name ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-white/5'}`}>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Products */}
            <div className="p-5 space-y-10 pb-40">
              {filteredCategories.map(cat => (
                <section key={cat.name} id={`cat-${cat.name}`} className="scroll-mt-40">
                  <h2 className="pm-font-display text-xl font-black italic mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full" /> {cat.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.items.map(item => (
                      <div key={item.id} onClick={() => setSelectedProduct(item)} className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-4 flex gap-4 pm-card-hover border border-black/5 cursor-pointer">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                          {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Utensils className="w-6 h-6 text-slate-300" /></div>}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-base mb-1">{item.name}</h3>
                            <p className="text-muted-foreground text-[10px] line-clamp-2">{item.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-lg text-primary">{formatCurrency(item.price)}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleAdd(item); }} className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
        </div>

        <BottomNav accentColor={accentColor} onHomeClick={() => window.scrollTo(0,0)} onCategoriesClick={() => {}} onSearchClick={() => {}} onCartClick={() => setIsCartOpen(true)} />
        <CartDrawer accentColor={accentColor} />
        {selectedProduct && <ProductDetailModal product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={handleAdd} accentColor={accentColor} />}
        <footer className="py-10 text-center opacity-20 uppercase text-[9px] font-black tracking-widest">Powered by Menu Pro</footer>
        </div>
      </div>
    </>
  );
}
