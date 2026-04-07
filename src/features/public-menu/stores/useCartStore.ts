import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartAddon {
  optionId: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  addons?: CartAddon[];
}

export type DeliveryType = 'delivery' | 'pickup';
export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash';

interface CartState {
  items: CartItem[];
  restaurantSlug: string;
  restaurantUserId: string;
  restaurantName: string;
  restaurantWhatsapp: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  address: string;
  deliveryType: DeliveryType;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  setRestaurant: (slug: string, userId: string, name: string, whatsapp: string, deliveryFee: number) => void;
  setCustomerInfo: (info: {
    name: string;
    phone: string;
    notes?: string;
    address?: string;
    deliveryType?: DeliveryType;
    deliveryFee?: number;
    paymentMethod?: PaymentMethod;
  }) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  subtotal: () => number;
  itemCount: () => number;
}

function cartItemKey(item: { id: string; addons?: CartAddon[] }): string {
  const addonKeys = (item.addons || []).map(a => a.optionId).sort().join(',');
  return `${item.id}::${addonKeys}`;
}

function itemTotal(item: CartItem): number {
  const addonSum = (item.addons || []).reduce((sum, a) => sum + a.price, 0);
  return (item.price + addonSum) * item.quantity;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantSlug: '',
      restaurantUserId: '',
      restaurantName: '',
      restaurantWhatsapp: '',
      customerName: '',
      customerPhone: '',
      notes: '',
      address: '',
      deliveryType: 'delivery',
      deliveryFee: 0,
      paymentMethod: 'cash',

      setRestaurant: (slug, userId, name, whatsapp, deliveryFee) =>
        set({ restaurantSlug: slug, restaurantUserId: userId, restaurantName: name, restaurantWhatsapp: whatsapp, deliveryFee }),

      setCustomerInfo: (info) =>
        set({
          customerName: info.name,
          customerPhone: info.phone,
          notes: info.notes || '',
          address: info.address || '',
          deliveryType: info.deliveryType || 'delivery',
          deliveryFee: info.deliveryFee ?? 0,
          paymentMethod: info.paymentMethod || 'cash',
        }),

      addItem: (item) =>
        set((state) => {
          const key = cartItemKey(item);
          const existing = state.items.find((i) => cartItemKey(i) === key);
          if (existing) {
            return { items: state.items.map((i) => cartItemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i) };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => cartItemKey(i) !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => cartItemKey(i) !== id)
            : state.items.map((i) => cartItemKey(i) === id ? { ...i, quantity } : i),
        })),

      clearCart: () => set({ items: [], customerName: '', customerPhone: '', notes: '', address: '', deliveryType: 'delivery', deliveryFee: 0, paymentMethod: 'cash' }),

      subtotal: () => get().items.reduce((sum, i) => sum + itemTotal(i), 0),

      total: () => {
        const state = get();
        const sub = state.items.reduce((sum, i) => sum + itemTotal(i), 0);
        return sub + state.deliveryFee;
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'menu-pro-cart',
      partialize: (state) => ({
        items: state.items,
        restaurantSlug: state.restaurantSlug,
        restaurantUserId: state.restaurantUserId,
        restaurantName: state.restaurantName,
        restaurantWhatsapp: state.restaurantWhatsapp,
        deliveryType: state.deliveryType,
        deliveryFee: state.deliveryFee,
      }),
    }
  )
);
