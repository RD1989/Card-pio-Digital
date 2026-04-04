import { useCallback, useRef, useState } from 'react';

export function useOrderNotificationSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  const init = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => setIsReady(true));
      } else {
        setIsReady(true);
      }
      
      // Play a silent buffer to "unlock" on some mobile browsers
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(0);
      oscillator.stop(0.1);

    } catch (e) {
      console.error('AudioContext error:', e);
    }
  }, []);

  const play = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      // "Ding-Dong" High Quality Chime using oscillators
      // Tone 1: High persistent
      const playTone = (freq: number, start: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Professional double chime
      playTone(880, now, 1.2, 0.4); // A5
      playTone(659.25, now + 0.4, 1.0, 0.3); // E5
      
    } catch (e) {
      console.error('Play sound error:', e);
    }
  }, []);

  return { play, init, isReady };
}
