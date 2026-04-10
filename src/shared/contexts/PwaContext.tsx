import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PwaContextType {
  deferredPrompt: any;
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
  setShowInstallBanner: (show: boolean) => void;
  showInstallBanner: boolean;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    const handler = (e: any) => {
      // Impedir que o mini-infobar apareça no mobile automaticamente
      e.preventDefault();
      // Salvar o evento para ser usado depois
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Mostrar o banner apenas se não estiver instalado
      if (!isStandalone) {
        setShowInstallBanner(true);
        console.log('PWA: Prompt de instalação capturado e pronto.');
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      toast.success('Sistema instalado com sucesso! Acesse pela sua tela de início.');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      // Fallback para iOS onde o manifest não dispara beforeinstallprompt
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        toast.info('Para instalar no iOS: toque em "Compartilhar" e depois em "Adicionar à Tela de Início"');
      } else {
        toast.error('O sistema de instalação não está pronto. Tente atualizar a página.');
      }
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA: Usuário escolheu ${outcome}`);
      
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } catch (err) {
      console.error('Erro ao tentar instalar PWA:', err);
      toast.error('Ocorreu um erro ao tentar abrir o instalador.');
    }
  };

  return (
    <PwaContext.Provider value={{ 
      deferredPrompt, 
      isInstallable, 
      isInstalled, 
      installApp,
      showInstallBanner,
      setShowInstallBanner
    }}>
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => {
  const context = useContext(PwaContext);
  if (context === undefined) {
    throw new Error('usePwa deve ser usado dentro de um PwaProvider');
  }
  return context;
};
