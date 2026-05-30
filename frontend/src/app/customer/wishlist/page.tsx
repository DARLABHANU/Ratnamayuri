"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import ProductCard from "@/components/customer/ProductCard";

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { wishlistItems, isLoading, fetchWishlist } = useWishlistStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-8">
        <span className="section-tag">SAVED ITEMS</span>
        <h1 className="section-title">
          My <em className="italic">Wishlist</em>
        </h1>
        <div className="divider-gold mx-0 mt-4" />
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-20 bg-gold-50/50 border border-gold-100 card flex flex-col items-center justify-center">
          <Heart size={48} className="text-gold-300 mb-4 animate-pulse" />
          <h2 className="font-cinzel text-base tracking-widest text-brown mb-2">YOUR WISHLIST IS EMPTY</h2>
          <p className="font-garamond text-sm text-muted max-w-sm mb-6">
            Explore our heritage jewelry, silk sarees, and bridal collections to save your favorite treasures here.
          </p>
          <button onClick={() => router.push("/customer/products")} className="btn-primary px-6 py-2.5 text-xs">
            EXPLORE NEW ARRIVALS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
