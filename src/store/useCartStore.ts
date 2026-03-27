import { create } from 'zustand';
import type { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.id === product.id);

    if (existingItem) {
      set({
        items: currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      set({ items: [...currentItems, { ...product, quantity: 1 }] });
    }
  },
  removeItem: (productId) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.id === productId);

    if (existingItem && existingItem.quantity > 1) {
      set({
        items: currentItems.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        ),
      });
    } else {
      set({ items: currentItems.filter((item) => item.id !== productId) });
    }
  },
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
  totalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
}));
