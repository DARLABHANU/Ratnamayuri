"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, Star, Package, ChevronLeft, Plus, Minus, Loader2, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice, getProductImage, getApiError } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const wishlisted = product ? isWishlisted(product.id) : false;

  useEffect(() => {
    productApi.get(Number(id))
      .then((r) => setProduct(r.data))
      .catch(() => toast.error("Product not found"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error("Please sign in to add to cart"); router.push("/auth/login"); return; }
    setIsAdding(true);
    try {
      await addItem(product!.id, quantity);
      toast.success("Added to bag!");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <p className="font-cormorant text-2xl text-muted">Product not found</p>
    </div>
  );

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const images = product.images?.length ? product.images : [getProductImage([])];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1 font-cinzel text-xs tracking-wide text-muted hover:text-brown transition-colors mb-8">
        <ChevronLeft size={14} /> BACK TO PRODUCTS
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square overflow-hidden bg-ivory mb-3 rounded-lg">
            <img src={images[selectedImage]} alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = getProductImage([]); }}
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`aspect-square overflow-hidden border-2 transition-all rounded-md
                    ${i === selectedImage ? "border-gold-500" : "border-transparent hover:border-gold-300"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <span className="section-tag">{product.category.name.toUpperCase()}</span>
          )}
          <h1 className="font-cormorant text-4xl font-light text-brown leading-tight mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          {product.rating_count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} size={12}
                    fill={i < Math.floor(product.rating_avg) ? "#C9973E" : "none"}
                    className="text-gold-500" />
                ))}
              </div>
              <span className="font-garamond text-sm text-muted">
                {product.rating_avg.toFixed(1)} ({product.rating_count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-4 mb-6">
            <span className="font-cinzel text-2xl text-brown">{formatPrice(product.price)}</span>
            {product.compare_price && (
              <>
                <span className="font-garamond text-lg text-muted line-through">
                  {formatPrice(product.compare_price)}
                </span>
                <span className="font-cinzel text-xs text-red-600 tracking-wide">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <Package size={14} className={product.stock_quantity > 0 ? "text-green-600" : "text-red-500"} />
            <span className={`font-cinzel text-xs tracking-wide
              ${product.stock_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
              {product.stock_quantity > 0
                ? product.stock_quantity <= product.low_stock_threshold
                  ? `ONLY ${product.stock_quantity} LEFT`
                  : "IN STOCK"
                : "OUT OF STOCK"}
            </span>
          </div>

          {/* Description */}
          {product.short_description && (
            <p className="font-garamond text-base text-muted leading-relaxed mb-6 border-l-2 border-gold-300 pl-4">
              {product.short_description}
            </p>
          )}

          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.entries(product.attributes).map(([key, val]) => (
                <div key={key} className="bg-ivory px-3 py-2 rounded-md">
                  <p className="font-cinzel text-xs tracking-wide text-muted mb-0.5">{key.toUpperCase()}</p>
                  <p className="font-garamond text-sm text-brown">{val as string}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quantity + Add to cart */}
          {product.stock_quantity > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Top row on mobile: Qty selector + Wishlist side by side */}
              <div className="flex gap-3 sm:contents">
                <div className="flex items-center border border-gold-200 rounded-md overflow-hidden flex-shrink-0">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-11 flex items-center justify-center text-muted hover:text-brown transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-cinzel text-sm text-brown">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    className="w-10 h-11 flex items-center justify-center text-muted hover:text-brown transition-colors">
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={async () => {
                    if (!isAuthenticated) {
                      toast.error("Please sign in to save to wishlist");
                      return;
                    }
                    try {
                      const added = await toggleWishlist(product!.id);
                      toast.success(added ? "Saved to wishlist!" : "Removed from wishlist");
                    } catch (err) {
                      toast.error("Failed to update wishlist");
                    }
                  }}
                  className="w-11 h-11 border border-gold-200 hover:border-gold-500 flex items-center justify-center transition-all bg-white hover:scale-105 rounded-md flex-shrink-0 sm:order-last"
                  title="Save to Wishlist"
                >
                  <Heart
                    size={18}
                    fill={wishlisted ? "#5A1212" : "none"}
                    className={wishlisted ? "text-gold-500" : "text-brown"}
                  />
                </button>
              </div>

              {/* Add to Bag — full width on mobile, flex-1 on sm+ */}
              <button onClick={handleAddToCart} disabled={isAdding}
                className="btn-primary w-full sm:flex-1 flex items-center justify-center gap-2">
                {isAdding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                {isAdding ? "ADDING..." : "ADD TO BAG"}
              </button>
            </div>
          )}

          {/* Full description */}
          {product.description && (
            <div className="border-t border-gold-100 pt-6">
              <h3 className="font-cinzel text-xs tracking-widest text-muted mb-3">PRODUCT DETAILS</h3>
              <p className="font-garamond text-base text-muted leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="font-garamond text-xs text-muted mt-4">SKU: {product.sku}</p>
          )}
        </div>
      </div>
    </div>
  );
}
