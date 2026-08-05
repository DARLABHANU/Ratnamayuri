"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Heart, ChevronLeft, MoreVertical, ArrowRight, ShoppingBag } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import ProductCard from "@/components/customer/ProductCard";
import { getProductImage } from "@/lib/utils";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { wishlistItems, isLoading, fetchWishlist, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#0D2619]" size={32} />
      </div>
    );
  }

  // Not authenticated — prompt login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] text-[#1C2E24] font-garamond">
        <div className="md:hidden sticky top-0 z-40 bg-[#FAF8F3] border-b border-[#E5E0D5] shadow-xs">
          <div className="flex items-center justify-between px-4 py-3.5">
            <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F0ECE5] transition-colors" aria-label="Go back">
              <ChevronLeft size={22} className="text-[#1C2E24]" />
            </button>
            <h1 className="font-cormorant text-[20px] font-bold tracking-wide text-[#1C2E24]">My Wishlist</h1>
            <div className="w-9 h-9" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-5">
          <div className="w-20 h-20 bg-white border border-[#E5E0D5] rounded-full flex items-center justify-center text-[#8C9890] shadow-xs">
            <Heart size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Sign In to View Wishlist</h2>
            <p className="text-xs text-[#8C9890]">Please log in to view and manage your saved items.</p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-7 py-3 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Compute display items with real discount info from database price fields
  const displayItems = wishlistItems.map((item) => {
    const comparePrice = (item as any).compare_price || (item as any).original_price;
    const origPrice = comparePrice && comparePrice > item.price ? comparePrice : null;
    const discPercent = origPrice ? Math.round(((origPrice - item.price) / origPrice) * 100) : 0;
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      original_price: origPrice,
      discount: discPercent > 0 ? `${discPercent}% OFF` : null,
      images: item.images,
      rawItem: item,
    };
  });

  const handleRemoveItem = (id: number) => {
    toggleWishlist(id);
    toast.success("Removed from Wishlist");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C2E24] font-garamond">

      {/* Desktop Header */}

      {/* ══════════════════════════════════════════════
          DESKTOP HEADER
         ══════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 pt-6 pb-2">
        <div className="border-b border-[#F0ECE1] pb-3 mb-4">
          <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            SAVED ITEMS
          </span>
          <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">My Wishlist</h1>
          <p className="text-xs text-[#8C9890] mt-0.5">{displayItems.length} saved items</p>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">

        {displayItems.length === 0 ? (
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 bg-[#FAF8F3] rounded-full flex items-center justify-center mx-auto text-[#8C9890]">
              <Heart size={28} />
            </div>
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Your Wishlist is Empty</h2>
            <p className="text-xs text-[#8C9890]">Explore our handloom sarees and luxury jewellery to save your favorite treasures here.</p>
            <button
              onClick={() => router.push("/customer/products")}
              className="inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span>EXPLORE NEW ARRIVALS</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════
                MOBILE VIEW — Card Container with item rows
               ══════════════════════════════════════════════ */}
            <div className="md:hidden">
              <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl shadow-xs overflow-hidden divide-y divide-[#F2EFE9]">
                {displayItems.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center gap-3.5 group">
                    {/* Thumbnail Image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FAF8F3] border border-[#EAE6DD] flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProductImage(item.images)}
                        alt={item.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-garamond text-[15px] font-bold text-[#1C2E24] leading-tight truncate">
                        {item.name}
                      </h3>

                      {/* Prices */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-garamond text-base font-bold text-[#1C2E24]">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        {item.original_price && (
                          <span className="font-garamond text-xs text-[#8C9890] line-through">
                            ₹{item.original_price.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {/* Discount Pill Badge */}
                      {item.discount && (
                        <div>
                          <span className="inline-block bg-[#FFF0E6] text-[#E05A2B] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {item.discount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Red Heart Button to Remove */}
                    <button
                      onClick={() => handleRemoveItem(item.id as number)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Remove from Wishlist"
                      aria-label="Remove from Wishlist"
                    >
                      <Heart size={21} className="fill-[#E53935] text-[#E53935]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════════════
                DESKTOP VIEW — Product Cards Grid
               ══════════════════════════════════════════════ */}
            <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {wishlistItems.map((product) => (
                <div key={product.id} className="bg-white border border-[#E5E0D5] rounded-2xl overflow-hidden shadow-xs p-4 flex flex-col justify-between space-y-3">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-[#FAF8F3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getProductImage(product.images)} alt={product.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveItem(product.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-xs"
                    >
                      <Heart size={16} className="fill-red-500 text-red-500" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-garamond text-sm font-bold text-[#1C2E24]">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-bold text-sm">₹{product.price.toLocaleString("en-IN")}</span>
                      {((product as any).compare_price || (product as any).original_price) && (
                        <span className="text-xs text-[#8C9890] line-through">
                          ₹{((product as any).compare_price || (product as any).original_price).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      addItem(product.id, 1);
                      toast.success("Added to cart!");
                    }}
                    className="w-full bg-[#0D2619] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={14} /> Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
