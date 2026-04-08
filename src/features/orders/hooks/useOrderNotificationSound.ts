import { useCallback } from 'react';
import { useBuzzerStore } from '@/shared/stores/global/useBuzzerStore';

export function useOrderNotificationSound() {
  const { isReady, setIsReady } = useBuzzerStore();

  const init = useCallback(() => {
    const audioNode = useBuzzerStore.getState().audioNode;
    if (audioNode) {
        // Unlock do browser: Toca sem som real ou resetando de imediato para garantir gesto do usuário
        audioNode.volume = 0.01;
        audioNode.play().then(() => {
            audioNode.pause();
            audioNode.currentTime = 0;
            audioNode.volume = 1;
            setIsReady(true);
            setTimeout(() => play(true), 100);
        }).catch(e => console.error('Audio Blocked by Brower', e));
    } else {
        setIsReady(true);
    }
  }, [setIsReady]);

  const stop = useCallback(() => {
    const audioNode = useBuzzerStore.getState().audioNode;
    if (audioNode) {
        audioNode.pause();
        audioNode.currentTime = 0;
    }
    setIsReady(false);
  }, [setIsReady]);

  const play = useCallback((singleChime = false) => {
    try {
      if (!useBuzzerStore.getState().isReady) return; 
      
      const audioNode = useBuzzerStore.getState().audioNode;
      if (!audioNode) return;

      // Reset
      audioNode.pause();
      audioNode.currentTime = 0;
      audioNode.volume = 1;
      
      // O Som original ogg (watch_alarm_long) já tem 3 toques repetidos naturais dele mesmo!
      // Se ele só quer um beep, pode parar manualmente, se não, rola inteiro.
      audioNode.play().catch(e => {
         console.warn('[Buzzer] Chrome autoplay restriction preventing sound', e);
      });

      if (singleChime) {
         setTimeout(() => {
            audioNode.pause();
            audioNode.currentTime = 0;
         }, 800); // 1 beep apenas
      }
      
    } catch (e) {
      console.error('Play sound global error:', e);
    }
  }, []);

  return { play, init, stop, isReady };
}
