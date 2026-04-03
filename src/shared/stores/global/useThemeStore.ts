import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  accentColor: string;
  toggle: () => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light',
  accentColor: 'amber',
  toggle: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
  setAccentColor: (color) => set({ accentColor: color }),
}));
