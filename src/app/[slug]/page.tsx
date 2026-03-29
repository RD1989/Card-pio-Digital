"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Search, User as UserIcon, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CategoryNav } from '@/components/CategoryNav';
import { ProductCard } from '@/components/ProductCard';
import { CartBar } from '@/components/CartBar';
import { BottomNav } from '@/components/BottomNav';
import { UpsellModal } from '@/components/UpsellModal';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabase';

interface RestaurantSettings {
  id: string;
  accent_color?: string;
  name?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  whatsapp_number?: string;
  business_hours?: Record<string, { open: string; close: string; closed: boolean }>;
  owner_id: string;
}

export default function PublicMenuPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const addItem = useCartStore((state) => (state as any).addItem);

  const handleSearchFocus = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => searchRef.current?.focus(), 400);
  };

  const accentColor = restaurantSettings?.accent_color || '#f59e0b';

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setErrorStatus(null);
        
        // 1. Busca Restaurante
        const { data: rest, error: restErr } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug)
          .single();

        if (restErr || !rest) {
          setErrorStatus(404);
          return;
        }
        setRestaurantSettings(rest);

        // 2. Busca Categs e Prods desse restaurante
        const [catsRes, prodsRes] = await Promise.all([
          supabase.from('categories').select('*').eq('restaurant_id', rest.id).order('order_index'),
          supabase.from('products').select('*').eq('restaurant_id', rest.id).eq('is_active', true)
        ]);
        
        setCategories(catsRes.data || []);
        setProducts(prodsRes.data || []);
        
        // Analytics (Background)
        supabase.from('analytics').insert({ restaurant_id: rest.id, type: 'view' }).then();
        
      } catch (error: any) {
        console.error('Erro ao buscar dados:', error);
        setErrorStatus(500);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || p.category_name === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isRestaurantOpen = () => {
    const hours = restaurantSettings?.business_hours as any;
    if (!hours) return true;
    
    const now = new Date();
    const day = now.getDay().toString(); // 0-6
    const config = hours[day];

    if (!config || config.closed) return false;

    const [openH, openM] = config.open.split(':').map(Number);
    const [closeH, closeM] = config.close.split(':').map(Number);
    
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  };

  const getNextOpening = () => {
    const hours = restaurantSettings?.business_hours as any;
    if (!hours) return "";
    const day = new Date().getDay().toString();
    return hours[day]?.open || "";
  };

  // Se o restaurante não existe ou deu erro
  if (errorStatus === 404) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-zinc-800 mb-4" />
        <h1 className="text-xl font-black text-white uppercase tracking-widest">Restaurante não encontrado</h1>
        <p className="text-zinc-500 mt-2 text-sm italic">Verifique o endereço e tente novamente.</p>
        <Link href="/" className="mt-8 text-amber-500 font-bold underline">Voltar para a Home</Link>
      </div>
    );
  }

  const isClosed = !loading && !isRestaurantOpen();

  return (
    <div
      className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30 overflow-x-hidden"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Header Premium Flutuante */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 pt-6 pb-6 bg-black/20 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              ref={searchRef}
              type="text"
              placeholder="O que vamos comer hoje? 🍔"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all group">
            <UserIcon className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </header>

      {/* Banner de Fechado */}
      <AnimatePresence>
        {isClosed && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-[88px] left-0 right-0 z-30 bg-red-600/90 backdrop-blur-sm text-white py-2.5 px-6 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg"
          >
            <Clock className="w-4 h-4" />
            Estabelecimento Fechado • Abre às {getNextOpening()}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-6 pb-40">
        
        {/* Banner Hero */}
        <section className="relative -mx-6 h-64 md:h-80 mb-12 overflow-hidden shadow-2xl">
          {restaurantSettings?.banner_url ? (
            <>
              <img 
                src={restaurantSettings.banner_url} 
                className="w-full h-full object-cover" 
                alt="Banner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <div className="text-center opacity-10">
                <Store className="w-20 h-20 mx-auto mb-2" />
                <p className="font-black uppercase tracking-widest text-xs">Menu Pro Premium</p>
              </div>
            </div>
          )}

          {/* Logo & Nome */}
          <div className="absolute -bottom-2 left-6 right-6 flex items-end gap-4">
            <div className="w-24 h-24 bg-black border-4 border-black rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
               <img 
                src={restaurantSettings?.logo_url || '/placeholder.png'} 
                className="w-full h-full object-cover" 
                alt="Logo" 
               />
            </div>
            <div className="pb-4">
                <h1 className="text-2xl font-serif font-black italic text-white leading-tight drop-shadow-xl">
                  {restaurantSettings?.name || 'Seu Restaurante'}
                </h1>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80 line-clamp-1">
                  {restaurantSettings?.description || 'O melhor sabor da região!'}
                </p>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Sincronizando cardápio...</p>
          </div>
        ) : (
          <>
            {/* Nav de Categorias */}
            <div className="sticky top-[88px] z-30 -mx-6 bg-black/40 backdrop-blur-xl border-b border-white/5 mb-8">
              <CategoryNav 
                categories={['Todos', ...categories.map(c => c.name)]} 
                activeCategory={activeCategory} 
                onSelect={setActiveCategory} 
              />
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    accentColor={accentColor}
                    onAdd={() => {
                      setSelectedProduct(product);
                      setIsDetailOpen(true);
                    }}
                    isClosed={isClosed}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-20 text-center opacity-40">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-bold uppercase tracking-widest">Nenhum prato disponível</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Nav de Baixo e Carrinho */}
      <BottomNav onSearchClick={handleSearchFocus} onHomeClick={() => setActiveCategory('Todos')} />
      <CartBar 
        whatsappNumber={restaurantSettings?.whatsapp_number} 
        restaurantSlug={slug} 
        isClosed={isClosed}
        nextOpening={getNextOpening()}
      />

      {/* Modais */}
      <UpsellModal 
        isOpen={isUpsellOpen} 
        onClose={() => setIsUpsellOpen(false)}
        accentColor={accentColor}
      />

      <ProductDetailModal
        isOpen={isDetailOpen}
        product={selectedProduct}
        onClose={() => setIsDetailOpen(false)}
        accentColor={accentColor}
        onAddToCart={(prod: any, qty: number) => {
          addItem(prod, qty);
          setIsUpsellOpen(true);
        }}
      />
    </div>
  );
}

import Link from 'next/link';
import { Store } from 'lucide-react';
