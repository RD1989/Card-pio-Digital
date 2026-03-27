import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../types';
import { useCartStore } from '../store/useCartStore';

interface Props {
  product: Product;
  accentColor?: string;
  onAdd?: () => void;
}

export const ProductCard = ({ product, onAdd }: Props) => {
  const addItem = useCartStore((state) => state.addItem);

  const isAvailable = product.is_available;

  const handleAdd = () => {
    if (isAvailable) {
      addItem(product);
      onAdd?.();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-zinc-800/50 group relative flex flex-col h-full ${!isAvailable ? 'opacity-60 grayscale' : ''}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={product.image_url || product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
        
        {/* Small badge or dot like in Reference */}
        <div className="absolute top-4 right-4">
           <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
           </div>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-serif italic text-white mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">{typeof product.category === 'object' ? product.category.name : product.category}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
          </span>
          <button
            onClick={handleAdd}
            disabled={!isAvailable}
            className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
