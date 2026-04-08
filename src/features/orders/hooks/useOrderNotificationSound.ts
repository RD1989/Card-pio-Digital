import { useCallback } from 'react';
import { useBuzzerStore } from '@/shared/stores/global/useBuzzerStore';

// Instância universal para desvencilhar o som de Componentes Desmontáveis (ex: Ao mudar do Orders pro Dashboard)
let globalAudioCtx: AudioContext | null = null;

export function useOrderNotificationSound() {
  const { isReady, setIsReady } = useBuzzerStore();

  const init = useCallback(() => {
    try {
      if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = globalAudioCtx;
      
      const initialize = () => {
        setIsReady(true);
        // Play a silent buffer to "unlock" background audio limitations nas tabs 
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(0);
        oscillator.stop(0.1);
        
        // Feed visual and audio check upon pressing green
        setTimeout(() => play(true), 100);
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(initialize);
      } else {
        initialize();
      }

    } catch (e) {
      console.error('AudioContext Global error:', e);
    }
  }, [setIsReady]);

  const stop = useCallback(() => {
    try {
      if (globalAudioCtx && globalAudioCtx.state !== 'closed') {
        globalAudioCtx.suspend();
      }
      setIsReady(false);
    } catch (e) {
      console.error('AudioContext stop global error:', e);
    }
  }, [setIsReady]);

  const play = useCallback((singleChime = false) => {
    try {
      if (!useBuzzerStore.getState().isReady) return; 
      if (!globalAudioCtx) return;
      const ctx = globalAudioCtx;
      
      // Auto-awake strategy 
      if (ctx.state === 'suspended') {
         ctx.resume().catch(() => {});
      }

      const baseTime = ctx.currentTime;

      const fireCycle = (delayStart: number) => {
        const now = baseTime + delayStart;
        const playTone = (freq: number, start: number, duration: number, volume: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle'; 
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(volume, start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
          
          // Harmonics
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(freq * 1.5, start);
          gain2.gain.setValueAtTime(0, start);
          gain2.gain.linearRampToValueAtTime(volume / 2, start + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc2.connect(gain2).connect(ctx.destination);
          osc2.start(start);
          osc2.stop(start + duration);
        };

        const vol = 0.8; 
        playTone(587.33, now, 0.4, vol);
        playTone(783.99, now + 0.15, 0.4, vol);
        playTone(880.00, now + 0.3, 0.7, vol);
      };

      fireCycle(0);
      if (!singleChime) {
        fireCycle(1);
        fireCycle(2);
      }
      
    } catch (e) {
      console.error('Play sound global error:', e);
    }
  }, []);

  return { play, init, stop, isReady };
}
