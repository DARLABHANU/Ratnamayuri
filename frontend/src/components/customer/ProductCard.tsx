"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Star } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { formatPrice, getProductImage, getApiError } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error("Please sign in to add to cart"); return; }
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
    <Link href={`/customer/products/${product.id}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-ivory mb-3">
        <img
          src={getProductImage(product.images)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23F5EFE6'/%3E%3Ctext x='150' y='200' text-anchor='middle' font-family='serif' font-size='14' fill='%237A6355'%3ENo Image%3C/text%3E%3C/svg%3E`;
          }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.is_featured && (
            <span className="bg-deep text-gold-400 font-cinzel text-xs px-2 py-0.5 tracking-wide">
              FEATURED
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-700 text-white font-cinzel text-xs px-2 py-0.5 tracking-wide">
              {discount}% OFF
            </span>
          )}
          {product.stock_quantity === 0 && (
            <span className="bg-muted text-white font-cinzel text-xs px-2 py-0.5 tracking-wide">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center
            justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
        >
          <Heart size={14} fill={wishlisted ? "#C9A96E" : "none"} className={wishlisted ? "text-gold-500" : "text-brown"} />
        </button>

        {/* Add to cart overlay */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock_quantity === 0}
            className="w-full bg-deep text-gold-300 font-cinzel text-xs tracking-widest py-3
              flex items-center justify-center gap-2 hover:bg-brown transition-colors
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ShoppingBag size={12} />
            {isAdding ? "ADDING..." : product.stock_quantity === 0 ? "SOLD OUT" : "ADD TO BAG"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div>
        {product.category && (
          <p className="font-cinzel text-xs tracking-widest text-gold-500 mb-1">
            {product.category.name.toUpperCase()}
          </p>
        )}
        <h3 className="font-cormorant text-lg font-medium text-brown leading-tight mb-1 group-hover:text-gold-700 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating_count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={10} fill="#C9A96E" className="text-gold-500" />
            <span className="font-garamond text-xs text-muted">
              {product.rating_avg.toFixed(1)} ({product.rating_count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-cinzel text-base text-brown">{formatPrice(product.price)}</span>
          {product.compare_price && (
            <span className="font-garamond text-sm text-muted line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
