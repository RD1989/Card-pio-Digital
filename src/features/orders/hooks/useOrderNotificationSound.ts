import { useCallback, useRef } from 'react';
import { useBuzzerStore } from '@/shared/stores/global/useBuzzerStore';

export function useOrderNotificationSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { isReady, setIsReady } = useBuzzerStore();

  const init = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      const initialize = () => {
        setIsReady(true);
        // Play a silent buffer to "unlock" on some mobile browsers
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(0);
        oscillator.stop(0.1);
        
        // Chamada de teste visual e sonoro da ativação
        setTimeout(() => play(true), 100);
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(initialize);
      } else {
        initialize();
      }

    } catch (e) {
      console.error('AudioContext error:', e);
    }
  }, [setIsReady]);

  const stop = useCallback(() => {
    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.suspend();
      }
      setIsReady(false);
    } catch (e) {
      console.error('AudioContext stop error:', e);
    }
  }, [setIsReady]);

  const play = useCallback((singleChime = false) => {
    try {
      if (!useBuzzerStore.getState().isReady) return; // Não toca se desativada
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

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

        const vol = 0.8; // Volume bastante nítido
        playTone(587.33, now, 0.4, vol);
        playTone(783.99, now + 0.15, 0.4, vol);
        playTone(880.00, now + 0.3, 0.7, vol);
      };

      // Se for acionado pelo "Ativar", toca só 1x, se for pedido novo, toca 3x em loop para alerta de delivery real
      fireCycle(0);
      if (!singleChime) {
        fireCycle(1);
        fireCycle(2);
      }
      
    } catch (e) {
      console.error('Play sound error:', e);
    }
  }, []);

  return { play, init, stop, isReady };
}
