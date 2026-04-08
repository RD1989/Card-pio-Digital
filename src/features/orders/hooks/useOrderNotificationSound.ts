import { useCallback } from 'react';
import { useBuzzerStore } from '@/shared/stores/global/useBuzzerStore';

// ─── Singleton AudioContext ───────────────────────────────────────────────────
// Mantido fora do ciclo React para sobreviver a desmontagens de componentes.
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return _ctx;
}

// Toca uma nota pura via WebAudio API
function playBeep(ctx: AudioContext, freq: number, start: number, dur: number, vol = 0.7) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);

  // 2ª harmônica para deixar o tom mais encorpado
  const osc2  = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 1.5, start);
  gain2.gain.setValueAtTime(0, start);
  gain2.gain.linearRampToValueAtTime(vol * 0.4, start + 0.04);
  gain2.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(start);
  osc2.stop(start + dur);
}

// Dispara 1 ciclo de 3 notas ascendentes (melodia de campainha)
function fireCycle(ctx: AudioContext, offset: number) {
  const t = ctx.currentTime + offset;
  playBeep(ctx, 587.33, t,        0.35);  // Ré5
  playBeep(ctx, 783.99, t + 0.15, 0.35);  // Sol5
  playBeep(ctx, 880.00, t + 0.30, 0.55);  // Lá5
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useOrderNotificationSound() {
  const { isReady, setIsReady } = useBuzzerStore();

  /** Chamado quando o lojista clica "Ativar Campainha" */
  const init = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) { setIsReady(true); return; }

    const unlock = () => {
      setIsReady(true);
      // Beep de confirmação (tom único)
      fireCycle(ctx, 0);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(unlock).catch(() => setIsReady(true));
    } else {
      unlock();
    }
  }, [setIsReady]);

  /** Desligar campainha */
  const stop = useCallback(() => {
    setIsReady(false);
  }, [setIsReady]);

  /**
   * Tocar alerta de novo pedido.
   * singleChime = true → apenas 1 ciclo (usado no teste ao ativar)
   * singleChime = false → 3 ciclos encadeados (novo pedido real)
   */
  const play = useCallback((singleChime = false) => {
    if (!useBuzzerStore.getState().isReady) return;

    const ctx = getCtx();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        fireCycle(ctx, 0);
        if (!singleChime) { fireCycle(ctx, 1.1); fireCycle(ctx, 2.2); }
      }).catch(() => {});
      return;
    }

    fireCycle(ctx, 0);
    if (!singleChime) {
      fireCycle(ctx, 1.1);
      fireCycle(ctx, 2.2);
    }
  }, []);

  return { play, init, stop, isReady };
}
