import { create } from "zustand";
import { wishlistApi } from "@/lib/api";
import { Product } from "@/types";

interface WishlistState {
  wishlistIds: number[];
  wishlistItems: Product[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: number) => Promise<boolean>;
  isWishlisted: (productId: number) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistIds: [],
  wishlistItems: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const { data } = await wishlistApi.get();
      set({
        wishlistIds: data.product_ids || [],
        wishlistItems: data.items || [],
      });
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleWishlist: async (productId) => {
    try {
      const { data } = await wishlistApi.toggle(productId);
      const isAdded = data.wishlisted;
      
      // Update local state instantly
      const currentIds = get().wishlistIds;
      let newIds = [...currentIds];
      if (isAdded) {
        if (!newIds.includes(productId)) newIds.push(productId);
      } else {
        newIds = newIds.filter(id => id !== productId);
      }

      set({ wishlistIds: newIds });

      // Refresh full list in background
      get().fetchWishlist();
      
      return isAdded;
    } catch (err) {
      console.error("Failed to toggle wishlist:", err);
      throw err;
    }
  },

  isWishlisted: (productId) => {
    return get().wishlistIds.includes(productId);
  },

  clearWishlist: () => {
    set({ wishlistIds: [], wishlistItems: [] });
  }
}));
