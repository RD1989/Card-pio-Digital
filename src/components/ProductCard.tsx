"use client";

import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types';

interface Props {
  product: Product;
  accentColor?: string;
  onAdd?: () => void;
  isClosed?: boolean;
}

export const ProductCard = ({ product, onAdd, isClosed }: Props) => {
  const isAvailable = product.is_available && !isClosed;

  const handleOpenDetail = () => {
    if (isAvailable) {
      onAdd?.();
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400';
    return url;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onClick={handleOpenDetail}
      className={`bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-zinc-800/50 group relative flex flex-col h-full cursor-pointer hover:border-white/10 transition-all ${!isAvailable ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={getImageUrl(product.image_url || product.image)}
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
          <div
            className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
