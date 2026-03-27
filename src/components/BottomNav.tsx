import { Home, Search, Plus, ShoppingBag, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav = () => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
        <button className="text-amber-500 flex flex-col items-center gap-1 transition-all">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        
        <button className="text-zinc-500 hover:text-white flex flex-col items-center gap-1 transition-all">
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Busca</span>
        </button>

        <div className="relative -mt-12">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(212,175,55,0.4)] border-4 border-zinc-950 transition-all"
          >
            <Plus className="w-8 h-8 text-zinc-950" />
          </motion.button>
        </div>

        <button className="text-zinc-500 hover:text-white flex flex-col items-center gap-1 transition-all">
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Pedidos</span>
        </button>

        <button className="text-zinc-500 hover:text-white flex flex-col items-center gap-1 transition-all">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Perfil</span>
        </button>
      </div>
    </div>
  );
};
