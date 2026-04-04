import { Home, List, ShoppingCart, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/useCartStore';

interface BottomNavProps {
  onHomeClick: () => void;
  onCategoriesClick: () => void;
  onSearchClick: () => void;
  onCartClick: () => void;
  accentColor?: string;
}

export function BottomNav({ onHomeClick, onCategoriesClick, onSearchClick, onCartClick, accentColor = '#16a34a' }: BottomNavProps) {
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <motion.div
      initial={{ y: 100, x: '-50%' }}
      animate={{ y: 0, x: '-50%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-[420px]"
    >
      <div
        className="flex items-center justify-around px-4 py-3 rounded-[28px] border border-black/[0.06] dark:border-white/[0.08]"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <NavBtn icon={Home} label="Início" onClick={onHomeClick} />
        <NavBtn icon={List} label="Cardápio" onClick={onCategoriesClick} />

        {/* Cart button — central highlighted */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          onClick={onCartClick}
          className="relative flex flex-col items-center gap-1 -mt-5"
        >
          <div
            className="w-14 h-14 rounded-[22px] flex items-center justify-center shadow-lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 8px 20px -4px ${accentColor}80` }}
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow border-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {cartCount}
              </motion.span>
            )}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Sacola</span>
        </motion.button>

        <NavBtn icon={Search} label="Buscar" onClick={onSearchClick} />

        {/* Placeholder 5th button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="flex flex-col items-center gap-1.5 text-gray-400"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-[14px]">
            <span className="text-xl">👤</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Perfil</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

function NavBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors group"
    >
      <div className="w-9 h-9 flex items-center justify-center rounded-[14px] group-hover:bg-gray-100 transition-colors">
        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-70 group-hover:opacity-100">{label}</span>
    </motion.button>
  );
}
