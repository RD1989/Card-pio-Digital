import { Home, Search, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';

interface BottomNavProps {
  onSearchClick: () => void;
  onHomeClick: () => void;
}

export const BottomNav = ({ onSearchClick, onHomeClick }: BottomNavProps) => {
  const { totalItems } = useCartStore();
  const count = totalItems();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onHomeClick();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-xs z-50 md:hidden">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/70 rounded-full px-8 py-3.5 flex items-center justify-between shadow-2xl shadow-black/60"
      >
        {/* Início */}
        <button
          onClick={scrollToTop}
          className="flex flex-col items-center gap-1 text-zinc-400 hover:text-amber-500 active:scale-90 transition-all"
          aria-label="Voltar ao início"
        >
          <Home className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Início</span>
        </button>

        {/* Busca */}
        <button
          onClick={onSearchClick}
          className="flex flex-col items-center gap-1 text-zinc-400 hover:text-amber-500 active:scale-90 transition-all"
          aria-label="Abrir busca"
        >
          <Search className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Buscar</span>
        </button>

        {/* Carrinho */}
        <button
          className="flex flex-col items-center gap-1 relative text-zinc-400 hover:text-amber-500 active:scale-90 transition-all"
          aria-label="Ver carrinho"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 text-zinc-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-zinc-900"
                style={{ backgroundColor: 'var(--accent, #d4af37)' }}
              >
                {count > 9 ? '9+' : count}
              </motion.span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">Carrinho</span>
        </button>
      </motion.div>
    </div>
  );
};
