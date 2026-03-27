import { X, TrendingUp, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '../data/mock';
import { useCartStore } from '../store/useCartStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

export const UpsellModal = ({ isOpen, onClose, accentColor }: Props) => {
  const addItem = useCartStore((state) => state.addItem);
  
  const upsellItems = products.filter(p => p.is_upsell && p.is_available).slice(0, 2);

  if (upsellItems.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Que tal completar?</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 bg-zinc-950 rounded-full text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {upsellItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-3xl border border-zinc-800"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-zinc-800">
                      <img src={item.image} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{item.name}</h4>
                      <p className="text-amber-500 font-bold text-sm">
                        + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </p>
                    </div>

                    <button 
                      onClick={() => {
                        addItem(item);
                        onAddSuccess();
                      }}
                      className="p-3 rounded-2xl text-zinc-950 flex items-center justify-center active:scale-95 transition-transform"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={onClose}
                className="w-full mt-6 py-4 text-zinc-400 font-bold text-sm uppercase tracking-widest hover:text-white transition-colors"
              >
                Não, obrigado
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  function onAddSuccess() {
    onClose();
    // Aqui podemos disparar o som futuramente
  }
};
