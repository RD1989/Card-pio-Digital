import { Home, List, ShoppingCart, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/useCartStore';

interface BottomNavProps {
  onHomeClick: () => void;
  onCategoriesClick: () => void;
  onSearchClick: () => void;
  onCartClick: () => void;
}

export function BottomNav({ onHomeClick, onCategoriesClick, onSearchClick, onCartClick }: BottomNavProps) {
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"
    >
      <div className="glass shadow-2xl px-8 py-4 flex items-center justify-between border-primary/20">
        <button 
          onClick={onHomeClick}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Início</span>
        </button>

        <button 
          onClick={onCategoriesClick}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Menu</span>
        </button>

        <button 
          onClick={onSearchClick}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Busca</span>
        </button>

        <button 
          onClick={onCartClick}
          className="relative flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-tighter">Sacola</span>
        </button>
      </div>
    </motion.div>
  );
}
