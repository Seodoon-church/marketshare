import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, options?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, options?: Record<string, string>) => void;
  clearCart: () => void;
  clearMallItems: (mallId: string) => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getShippingFee: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const optionsKey = JSON.stringify(item.options || {});
          const existing = state.items.find(
            (i) => i.productId === item.productId && JSON.stringify(i.options || {}) === optionsKey
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && JSON.stringify(i.options || {}) === optionsKey
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
                  : i
              ),
            };
          }

          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId, options) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productId === productId && JSON.stringify(i.options || {}) === JSON.stringify(options || {}))
          ),
        }));
      },

      updateQuantity: (productId, quantity, options) => {
        if (quantity <= 0) {
          get().removeItem(productId, options);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && JSON.stringify(i.options || {}) === JSON.stringify(options || {})
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      clearMallItems: (mallId) => {
        set((state) => ({
          items: state.items.filter((i) => i.mallId !== mallId),
        }));
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + (i.salePrice ?? i.price) * i.quantity, 0),

      getShippingFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= 50000 ? 0 : 3000;
      },

      getTotal: () => get().getSubtotal() + get().getShippingFee(),
    }),
    {
      name: 'marketshare-cart',
    }
  )
);
