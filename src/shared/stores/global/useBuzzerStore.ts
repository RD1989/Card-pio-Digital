import { create } from 'zustand';

interface BuzzerState {
  isReady: boolean;
  realtimeStatus: 'connected' | 'connecting' | 'error';
  setIsReady: (isReady: boolean) => void;
  setRealtimeStatus: (status: 'connected' | 'connecting' | 'error') => void;
}

export const useBuzzerStore = create<BuzzerState>((set) => ({
  isReady: false,
  realtimeStatus: 'connecting',
  setIsReady: (isReady) => set({ isReady }),
  setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
}));
