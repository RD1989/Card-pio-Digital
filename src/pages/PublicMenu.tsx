import { useState, useEffect } from 'react';
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
}

export const PublicMenu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({});
  
  const accentColor = restaurantSettings?.accent_color || '#d4af37';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, prodsRes, restRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products'),
          api.get('/restaurant')
        ]);
        setCategories(catsRes.data);
        setProducts(prodsRes.data);
        setRestaurantSettings(restRes.data);
        
        // Registrar visualização real no backend (Não bloqueia o carregamento visual)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
      {/* Header Premium */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 pt-6 md:pt-12 pb-6 bg-gradient-to-b from-black via-black/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text"
              placeholder="Encontre seu prato favorito..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center hover:bg-zinc-800 transition-all">
            <UserIcon className="w-6 h-6 text-amber-500" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-28 md:pt-40 pb-40">
        {/* Hero Section */}
        <section className="mb-10 text-center md:text-left">
          <span className="text-amber-500 font-bold tracking-[0.2em] uppercase text-[10px] mb-2 block">
            Experiência Gastronômica
          </span>
          <h1 className="text-5xl font-serif italic leading-tight mb-4">
            Menu <br />
            <span className="text-zinc-400 not-italic font-sans font-bold tracking-tighter">Premium</span>
          </h1>
          <p className="text-zinc-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto md:mx-0">
            Pratos autorais preparados com ingredientes selecionados para paladares exigentes.
          </p>
        </section>

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

      <BottomNav />
      <CartBar />

      <UpsellModal 
        isOpen={isUpsellOpen} 
        onClose={() => setIsUpsellOpen(false)}
        accentColor={accentColor}
      />
    </div>
  );
};
