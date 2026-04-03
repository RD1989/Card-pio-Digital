import { create } from 'zustand';

interface ImpersonateState {
  impersonatedUserId: string | null;
  impersonatedName: string | null;
  setImpersonation: (userId: string, name: string) => void;
  clearImpersonation: () => void;
}

export const useImpersonateStore = create<ImpersonateState>((set) => ({
  impersonatedUserId: null,
  impersonatedName: null,
  setImpersonation: (userId, name) => set({ impersonatedUserId: userId, impersonatedName: name }),
  clearImpersonation: () => set({ impersonatedUserId: null, impersonatedName: null }),
}));
