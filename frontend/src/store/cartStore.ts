import { create } from "zustand";
import { Cart, CartItem } from "@/types";
import { cartApi } from "@/lib/api";

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await cartApi.get();
      set({ cart: data });
    } catch {
      set({ cart: null });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity) => {
    await cartApi.add({ product_id: productId, quantity });
    // Refetch cart
    const { data } = await cartApi.get();
    set({ cart: data });
  },

  removeItem: async (itemId) => {
    await cartApi.remove(itemId);
    const { data } = await cartApi.get();
    set({ cart: data });
  },

  clearCart: async () => {
    await cartApi.clear();
    set({ cart: null });
  },
}));
