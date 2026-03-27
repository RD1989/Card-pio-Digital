import { ShoppingCart, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';

export const CartBar = () => {
  const { items, totalItems, totalPrice } = useCartStore();
  const count = totalItems();
  const total = totalPrice();

  const generateWhatsAppLink = () => {
    const phone = "5511999999999"; // Exemplo
    let message = "Olá! Gostaria de fazer o pedido:\n\n";
    
    items.forEach(item => {
      message += `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\nTotal: R$ ${total.toFixed(2)}`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50"
        >
          <div className="glass-card p-4 rounded-3xl flex items-center justify-between shadow-2xl backdrop-blur-xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 text-zinc-950 w-12 h-12 rounded-2xl flex items-center justify-center relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-zinc-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900">
                  {count}
                </span>
              </div>
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Resumo</p>
                <p className="text-white font-bold text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </p>
              </div>
            </div>

            <button
              onClick={generateWhatsAppLink}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              Ver Pedido
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
