import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BuzzerState {
  isReady: boolean;
  realtimeStatus: 'connected' | 'connecting' | 'error';
  setIsReady: (isReady: boolean) => void;
  setRealtimeStatus: (status: 'connected' | 'connecting' | 'error') => void;
}

export const useBuzzerStore = create<BuzzerState>()(
  persist(
    (set) => ({
      isReady: false,
      realtimeStatus: 'connecting',
      setIsReady: (isReady) => set({ isReady }),
      setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
    }),
    {
      name: 'menu-pro-buzzer-storage',
      partialize: (state) => ({ isReady: state.isReady }), // Só salva a preferência de áudio
    }
  )
);
