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
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="fixed bottom-0 left-0 z-50 w-full"
    >
      <div
        className="flex items-center justify-around px-2 py-3 rounded-t-[28px] border-t border-black/[0.06] dark:border-white/[0.08]"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <NavBtn icon={Home} label="Início" onClick={onHomeClick} />
        <NavBtn icon={List} label="Cardápio" onClick={onCategoriesClick} />

        {/* Cart button — central highlighted */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          onClick={onCartClick}
          className="relative flex flex-col items-center gap-1 -mt-8"
        >
          <div
            className="w-16 h-16 rounded-[22px] flex items-center justify-center shadow-lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 8px 24px -4px ${accentColor}80` }}
          >
            <ShoppingCart className="w-7 h-7 text-white" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow border-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {cartCount}
              </motion.span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sacola</span>
        </motion.button>

        <NavBtn icon={Search} label="Buscar" onClick={onSearchClick} />
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
