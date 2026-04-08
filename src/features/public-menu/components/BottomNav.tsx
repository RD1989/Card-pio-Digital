import { Home, List, ShoppingCart, Search, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const total = items.reduce((sum, item) => {
    const addonsTotal = item.addons?.reduce((s, a) => s + a.price, 0) || 0;
    return sum + ((item.price + addonsTotal) * item.quantity);
  }, 0);

  return (
    <>


      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="fixed bottom-0 left-0 z-[40] w-full"
      >
      <div
        className="flex items-center justify-around px-2 py-3.5 rounded-t-[32px] border-t border-black/[0.04] dark:border-white/[0.08] pm-glass"
        style={{
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.04)',
        }}
      >
        <NavBtn icon={Home} label="Início" onClick={onHomeClick} />
        <NavBtn icon={List} label="Cardápio" onClick={onCategoriesClick} />

        {/* Cart button — aligned with others */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCartClick}
          className="relative flex flex-col items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors group"
        >
          <div 
            className={`w-10 h-10 flex items-center justify-center rounded-[14px] transition-all ${cartCount > 0 ? 'text-white' : 'group-hover:bg-gray-100'}`}
            style={cartCount > 0 ? { backgroundColor: accentColor, boxShadow: `0 4px 12px -2px ${accentColor}60` } : undefined}
          >
            <ShoppingCart className={`w-5 h-5 ${cartCount > 0 ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1.1 }}
                className="absolute -top-1 -right-1 bg-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {cartCount}
              </motion.span>
            )}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-70 group-hover:opacity-100">Sacola</span>

          {/* Pulse effect when adding items */}
          {cartCount > 0 && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </motion.button>

        <NavBtn icon={Search} label="Buscar" onClick={onSearchClick} />
      </div>
    </motion.div>
    </>
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
