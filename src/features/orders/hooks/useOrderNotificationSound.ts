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
        
        // Play confirming chime
        setTimeout(() => play(), 100);
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

  const play = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      // "Loud & Clear" Triple Chime
      const playTone = (freq: number, start: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Richer sound using Sawtooth instead of Sine for "Buzzer" feel
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
        
        // Add a second harmonic for richness
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.5, start); // 5th harmonic
        gain2.gain.setValueAtTime(0, start);
        gain2.gain.linearRampToValueAtTime(volume / 2, start + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(start);
        osc2.stop(start + duration);
      };

      // Professional Triple Chime (D-G-D) - Urgent but Pleasant
      const vol = 0.5; // High volume
      playTone(587.33, now, 0.6, vol); // D5
      playTone(783.99, now + 0.15, 0.6, vol); // G5
      playTone(880, now + 0.3, 0.8, vol); // A5
      
    } catch (e) {
      console.error('Play sound error:', e);
    }
  }, []);

  return { play, init, isReady };
}
