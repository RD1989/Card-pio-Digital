import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { usePwa } from '@/shared/contexts/PwaContext';

export function PwaInstallBanner() {
  const { isInstalled, installApp, showInstallBanner, setShowInstallBanner } = usePwa();

  if (!showInstallBanner || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="sticky top-0 z-[100] w-full bg-gradient-to-r from-neutral-900 to-black border-b border-white/10 shadow-2xl overflow-hidden backdrop-blur-3xl"
      >
        <div className="flex items-center justify-between p-3 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <div className="p-2 md:p-2.5 bg-gradient-to-br from-[#d4af37] to-[#aa8c2c] rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)] shrink-0">
              <Download className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm md:text-base leading-tight tracking-tight">Instale o Menu Pro</h3>
              <p className="text-neutral-400 text-[10px] md:text-xs">Gerencie seus pedidos direto da tela inicial</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button 
              onClick={installApp}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-white hover:bg-neutral-200 text-black font-black text-xs md:text-sm rounded-lg transition-all active:scale-95 whitespace-nowrap shadow-lg"
            >
              Instalar App
            </button>
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="p-2 text-neutral-500 hover:text-white transition-colors"
              aria-label="Dispensar"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
