"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Plus, Minus, Info } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/types';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  accentColor: string;
}

export const ProductDetailModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  accentColor 
}: ProductDetailModalProps) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    onClose();
    setQuantity(1);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    return url;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-zinc-950 border-t border-white/10 sm:border border-white/10 sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Close Button Mobile Header */}
            <div className="absolute top-4 right-4 z-50">
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
              {product.image_url || product.image ? (
                <img 
                  src={getImageUrl(product.image_url || product.image)} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl grayscale opacity-20">🍽️</span>
                </div>
              )}
              {/* Gradient overlay for text legibility if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              
              {/* Category Badge */}
              <div className="absolute bottom-4 left-6">
                 <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70">
                   {typeof product.category === 'object' ? product.category.name : product.category}
                 </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-3xl font-serif italic font-bold text-white leading-tight">
                    {product.name}
                  </h2>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: accentColor }}>
                      R$ {Number(product.price).toFixed(2)}
                    </p>
                    {product.original_price && (
                      <p className="text-sm text-zinc-500 line-through">
                        R$ {Number(product.original_price).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {product.description || "Nenhuma descrição disponível para este prato seleto."}
                </p>
              </div>

              {/* Highlights/Badges */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                   <Info className="w-4 h-4 text-zinc-500" />
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Preparado na hora</span>
                </div>
                {product.is_upsell && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                     <Plus className="w-4 h-4 text-amber-500" />
                     <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Destaque da Casa</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-white/5 w-full" />

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-6 pt-2 pb-4 sm:pb-0">
                <div className="flex items-center gap-4 bg-zinc-900 border border-white/10 p-1 rounded-2xl">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-8 text-center text-xl font-bold font-mono text-white">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className="flex-1 h-16 rounded-2xl font-black text-zinc-950 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-black"
                  style={{ 
                    backgroundColor: accentColor,
                    boxShadow: `0 8px 30px ${accentColor}30`
                  }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  ADICIONAR — R$ {(Number(product.price) * quantity).toFixed(2)}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
