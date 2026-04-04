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
      initial={{ y: 100, x: '-50%' }}
      animate={{ y: 0, x: '-50%' }}
      className="fixed bottom-8 left-1/2 z-50 w-[94%] max-w-lg"
    >
      <div className="bg-white/70 dark:bg-card/70 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] px-10 py-5 flex items-center justify-between border border-white/20 dark:border-white/5 rounded-[32px]">
        <motion.button 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={onHomeClick}
          className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
        >
          <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Início</span>
        </motion.button>

        <motion.button 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCategoriesClick}
          className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
        >
          <List className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Cardápio</span>
        </motion.button>

        <motion.button 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSearchClick}
          className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
        >
          <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Buscar</span>
        </motion.button>

        <motion.button 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCartClick}
          className="relative flex flex-col items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-background"
              >
                {cartCount}
              </motion.span>
            )}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Sacola</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
