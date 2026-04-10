import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Capture the install prompt
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      toast.success('App instalado com sucesso!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Falha silenciosa fallback caso iOS ou já instalado
      toast.info('Para instalar no iOS, toque em Compartilhar > Adicionar à Tela de Início');
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
  };

  if (!showInstallBanner || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="sticky top-0 z-50 w-full bg-gradient-to-r from-neutral-900 to-black border-b border-white/10 shadow-2xl overflow-hidden backdrop-blur-3xl"
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
              onClick={handleInstallClick}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-white hover:bg-neutral-200 text-black font-black text-xs md:text-sm rounded-lg transition-all active:scale-95 whitespace-nowrap"
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
