import { useState, useEffect, useRef } from 'react';
import { Search, User as UserIcon, ChefHat } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { CategoryNav } from '../components/CategoryNav';
import { ProductCard } from '../components/ProductCard';
import { CartBar } from '../components/CartBar';
import { BottomNav } from '../components/BottomNav';
import { UpsellModal } from '../components/UpsellModal';
import api from '../services/api';
import type { Product, Category } from '../types';

interface RestaurantSettings {
  accent_color?: string;
  name?: string;
  bio?: string;
  logo_url?: string;
  banner_url?: string;
}

export const PublicMenu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearchFocus = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => searchRef.current?.focus(), 400);
  };

  const accentColor = restaurantSettings?.accent_color || '#f59e0b';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products'),
        ]);
        setCategories(catsRes.data);
        setProducts(prodsRes.data);

        // Busca dados do restaurante usando o endpoint correto
        try {
          const restRes = await api.get('/restaurant');
          setRestaurantSettings(restRes.data);
        } catch {
          // Fallback se não houver restaurante vinculado ao user logado (visitante)
          // Em um SaaS real, aqui buscaríamos pelo subdomínio ou slug
        }
        
        api.post('/analytics/view').catch(() => {});
        
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || 
      (typeof p.category === 'object' ? p.category.name === activeCategory : p.category === activeCategory);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
    return `${baseUrl}${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const hasBanner = !!restaurantSettings.banner_url;
  const hasLogo = !!restaurantSettings.logo_url;

  return (
    <div
      className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Header Premium */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 pt-6 pb-6 bg-black/20 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              ref={searchRef}
              type="text"
              placeholder="O que vamos comer hoje?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group">
            <UserIcon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-40">
        {/* Banner Section */}
        <section className="relative -mx-6 mb-8 h-[240px] md:h-[320px] overflow-hidden">
          {hasBanner ? (
            <>
              <img 
                src={getImageUrl(restaurantSettings.banner_url)} 
                className="w-full h-full object-cover" 
                alt="Banner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
               <div className="text-center opacity-20">
                  <ChefHat className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Premium Menu</p>
               </div>
            </div>
          )}

          {/* Logo Overlay */}
          <div className="absolute -bottom-6 left-6 flex items-end gap-4">
            <div className="w-24 h-24 bg-black border-4 border-black rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center bg-zinc-900">
               {hasLogo ? (
                 <img src={getImageUrl(restaurantSettings.logo_url)} className="w-full h-full object-cover" alt="Logo" />
               ) : (
                 <ChefHat className="w-8 h-8 text-amber-500" />
               )}
            </div>
            <div className="pb-8">
               <h1 className="text-2xl font-serif font-bold italic text-white drop-shadow-lg">
                 {restaurantSettings.name || 'Menu Premium'}
               </h1>
               <p className="text-zinc-400 text-xs backdrop-blur-sm bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                 {restaurantSettings.bio || 'Experiência gastronômica selecionada'}
               </p>
            </div>
          </div>
        </section>

        <div className="pt-4"></div>


        {/* Categories */}
        <div className="sticky top-[100px] z-30 -mx-6 bg-black/40 backdrop-blur-md mb-8">
          <CategoryNav 
            categories={['Todos', ...categories.map(c => c.name)]} 
            activeCategory={activeCategory} 
            onSelect={setActiveCategory} 
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                accentColor={accentColor}
                onAdd={() => setIsUpsellOpen(true)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <ChefHat className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">Nenhum prato encontrado nesta categoria.</p>
          </div>
        )}
      </main>

      <BottomNav onSearchClick={handleSearchFocus} onHomeClick={() => setActiveCategory('Todos')} />
      <CartBar />

      <UpsellModal 
        isOpen={isUpsellOpen} 
        onClose={() => setIsUpsellOpen(false)}
        accentColor={accentColor}
      />
    </div>
  );
};
