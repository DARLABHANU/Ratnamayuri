"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Star } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { formatPrice, getProductImage, getApiError } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const [isAdding, setIsAdding] = useState(false);
  const wishlisted = isWishlisted(product.id);

  // Compute discount percentage
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  // Swatches for sarees and bridal
  const swatches = [
    { name: "Alabaster Platinum", color: "bg-[#DDE1E6]" },
    { name: "Crimson Red", color: "bg-[#881337]" },
    { name: "Emerald Green", color: "bg-[#022c22]" },
    { name: "Indigo Navy", color: "bg-[#0c2337]" },
  ];

  const categorySlug = product.category?.slug?.toLowerCase() || "";
  const showColors = categorySlug === "sarees" || categorySlug === "bridal";

  const ratingAvg = product.rating_avg || 0;
  const ratingCount = product.rating_count || 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to add to cart");
      return;
    }
    setIsAdding(true);
    try {
      await addItem(product.id, 1);
      toast.success("Added to bag!");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E0D5] rounded-3xl p-3.5 flex flex-col justify-between h-full hover:shadow-md transition-all duration-300 group font-garamond text-[#1C2E24]">
      <Link href={`/customer/products/${product.id}`} className="flex-1 flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F3] mb-3 rounded-2xl border border-[#F0ECE1]">
          <img
            src={getProductImage(product.images)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23FAF8F3'/%3E%3Ctext x='150' y='200' text-anchor='middle' font-family='serif' font-size='14' fill='%238C9890'%3ENo Image%3C/text%3E%3C/svg%3E`;
            }}
          />

          {/* Featured or Out of Stock tags */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {product.is_featured && (
              <span className="bg-[#0D2619] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                FEATURED
              </span>
            )}
            {product.stock_quantity === 0 && (
              <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Wishlist Icon */}
          <button
            onClick={async (e) => {
              e.preventDefault();
              if (!isAuthenticated) {
                toast.error("Please sign in to save to wishlist");
                return;
              }
              try {
                const added = await toggleWishlist(product.id);
                toast.success(added ? "Added to wishlist" : "Removed from wishlist");
              } catch (err) {
                toast.error(getApiError(err));
              }
            }}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center transition-all ${
              wishlisted ? "text-red-600 fill-red-600" : "text-[#1C2E24] hover:text-red-600"
            } shadow-2xs`}
          >
            <Heart size={14} className={wishlisted ? "fill-current" : ""} />
          </button>
        </div>

        {/* Product Details */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 text-[11px] text-[#8C9890] font-semibold">
              <span className="truncate uppercase">{product.category?.name || "Handloom"}</span>
              {ratingAvg > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  <Star size={11} fill="currentColor" />
                  {ratingAvg.toFixed(1)}
                </span>
              )}
            </div>

            <h3 className="font-cormorant font-bold text-base text-[#1C2E24] line-clamp-1 group-hover:text-[#0D2619] transition-colors">
              {product.name}
            </h3>

            {/* Price section */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-bold text-sm text-[#1C2E24]">{formatPrice(product.price)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className="text-xs text-[#8C9890] line-through">{formatPrice(product.compare_price)}</span>
                  <span className="text-[10px] font-bold text-emerald-700">({discount}% OFF)</span>
                </>
              )}
            </div>
          </div>

          {/* Color swatches */}
          {showColors && (
            <div className="flex items-center gap-1.5 pt-1">
              {swatches.map((s, idx) => (
                <div key={idx} title={s.name} className={`w-2.5 h-2.5 rounded-full ${s.color} border border-white shadow-2xs`} />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding || product.stock_quantity === 0}
        className="w-full mt-3 bg-[#0D2619] hover:bg-[#19402B] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <ShoppingBag size={13} />
        <span>{isAdding ? "Adding..." : "Add to Bag"}</span>
      </button>
    </div>
  );
}
