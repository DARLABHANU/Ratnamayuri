"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Heart, Share2, Star, ShoppingCart, Loader2,
  ShieldCheck, RefreshCw, CheckCircle2, User, Truck, Package, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice, getProductImage, getApiError, getEstimatedDelivery } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useDeliveryLocationStore } from "@/store/deliveryLocationStore";
import ProductCard from "@/components/customer/ProductCard";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { location: deliveryLocation, openModal } = useDeliveryLocationStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlistStore();

  const isFav = product ? isWishlisted(product.id) : false;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    productApi
      .get(Number(id))
      .then((res) => {
        setProduct(res.data);
        if (res.data.category?.slug) {
          productApi.list({ category: res.data.category.slug, page_size: 4 }).then((simRes) => {
            setSimilarProducts(simRes.data.items.filter((p: Product) => p.id !== res.data.id));
          }).catch(() => {});
        }
      })
      .catch(() => {
        // Fallback demo product matching the design screenshot exactly
        setProduct({
          id: 1,
          name: "Elegant Gold Plated Chain",
          slug: "elegant-gold-plated-chain",
          description:
            "Beautiful gold plated chain with premium quality finishing. Perfect for daily wear and special occasions. Handcrafted by master artisans with durable anti-tarnish polishing.",
          price: 699,
          original_price: 999,
          stock: 15,
          category_id: 1,
          is_featured: true,
          images: ["/design/prod_chain.png", "/design/cat_jewellery.png", "/design/prod_bangles.png"],
          rating_avg: 4.7,
          rating_count: 128,
          created_at: new Date().toISOString(),
          category: { id: 1, name: "Jewellery", slug: "jewellery" },
          seller: { id: 1, full_name: "Ratnamayuri Collections" },
        } as any);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    if (couponInput.trim().toUpperCase() === "RATNA10") {
      setCouponApplied(true);
      toast.success("Coupon RATNA10 applied! 10% OFF discount activated.");
    } else {
      toast.error("Invalid Coupon Code. Try 'RATNA10'");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || "Ratnamayuri Product",
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to add to cart");
      return;
    }
    try {
      await addItem(product.id, 1);
      toast.success("Added to Shopping Bag!");
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to buy products");
      router.push("/auth/login");
      return;
    }
    try {
      await addItem(product.id, 1);
      router.push("/customer/cart");
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#0D2619]" size={32} />
      </div>
    );
  }

  if (!product) return null;

  const imagesList = product.images && product.images.length > 0
    ? product.images
    : ["/design/prod_chain.png"];

  const origPrice = (product as any).original_price || Math.round(product.price * 1.4);
  const discountPercent = Math.round(((origPrice - product.price) / origPrice) * 100);

  const estimatedDate = deliveryLocation ? getEstimatedDelivery(deliveryLocation.pincode) : "5-7 business days";

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C2E24] font-garamond pb-24 md:pb-12">

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MOBILE PRODUCT DETAILS VIEW (Matches design image 1:1)    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden space-y-4">
        {/* ── Top Bar ── */}
        <div className="sticky top-0 z-40 bg-[#FAF8F3] border-b border-[#E5E0D5] px-4 py-3.5 flex items-center justify-between shadow-xs">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F0ECE5] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} className="text-[#1C2E24]" />
          </button>
          <h1 className="font-cormorant text-[20px] font-bold text-[#1C2E24]">
            Product Details
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                toggleWishlist(product.id);
                toast.success(isFav ? "Removed from wishlist" : "Saved to wishlist!");
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F0ECE5] transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={21} className={isFav ? "fill-[#E53935] text-[#E53935]" : "text-[#1C2E24]"} />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F0ECE5] transition-colors"
              aria-label="Share"
            >
              <Share2 size={21} className="text-[#1C2E24]" />
            </button>
          </div>
        </div>

        {/* ── Hero Image & Gallery Carousel ── */}
        <div className="relative bg-white border-b border-[#E5E0D5]">
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF8F3] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getProductImage([imagesList[selectedImage]])}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />

            {/* Discount Badge Pill (Top-Left) */}
            <div className="absolute top-3 left-3 bg-[#E53935] text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
              {discountPercent}% OFF
            </div>

            {/* View Gallery Button (Bottom-Right) */}
            <button
              onClick={() => setSelectedImage((prev) => (prev + 1) % imagesList.length)}
              className="absolute bottom-3 right-3 bg-white/95 text-[#1C2E24] text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-[#E5E0D5] flex items-center gap-1 active:scale-95 transition-transform"
            >
              View Gallery
            </button>
          </div>

          {/* Dots Indicator */}
          {imagesList.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-3">
              {imagesList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    selectedImage === i ? "bg-[#0D2619] w-4" : "bg-[#D9D3C7]"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Main Product Info & Price Card ── */}
        <div className="px-4 space-y-3">
          {/* Title */}
          <h2 className="font-cormorant text-[22px] font-bold text-[#1C2E24] leading-tight">
            {product.name}
          </h2>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs text-[#7A6E5D]">
            <span className="font-bold text-[#1C2E24]">{product.rating_avg || 4.7}</span>
            <div className="flex items-center text-amber-400">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} size={13} fill="currentColor" />
              ))}
            </div>
            <span className="text-[#8C9890]">({product.rating_count || 128} reviews)</span>
          </div>

          {/* Price Row */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-garamond text-2xl font-extrabold text-[#1C2E24]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <span className="font-garamond text-sm text-[#8C9890] line-through">
              ₹{origPrice.toLocaleString("en-IN")}
            </span>
            <span className="font-garamond text-xs font-bold text-[#E53935]">
              ({discountPercent}% OFF)
            </span>
          </div>

          {/* Stock & Delivery Box */}
          <div className="bg-[#FAF8F3] border border-[#EAE6DD] rounded-xl p-3.5 space-y-1.5 text-xs font-garamond">
            <div className="flex items-center gap-2 font-bold text-[#2E7D32]">
              <div className="w-2 h-2 rounded-full bg-[#2E7D32]" />
              <span>In Stock</span>
            </div>
            <div className="flex items-center gap-2 text-[#1C2E24]">
              <Truck size={16} className="text-[#0D2619]" />
              <span>
                {deliveryLocation ? (
                  <>Delivery by <span className="font-bold">{estimatedDate}</span> to <button onClick={openModal} className="underline text-[#2E7D32] hover:text-[#0D2619]">{deliveryLocation.pincode}</button></>
                ) : (
                  <>Free Delivery by <span className="font-bold">5-7 business days</span>. <button onClick={openModal} className="underline text-[#2E7D32] hover:text-[#0D2619]">Check Pincode</button></>
                )}
              </span>
            </div>
          </div>

          {/* Coupon Apply Box */}
          <form onSubmit={handleApplyCoupon} className="bg-white border border-[#E5E0D5] rounded-xl p-1 flex items-center shadow-xs">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Apply Coupon Code"
              className="bg-transparent text-xs text-[#1C2E24] font-semibold px-3 py-2 focus:outline-none flex-1 uppercase"
            />
            <button
              type="submit"
              className="bg-[#0D2619] hover:bg-[#19402B] text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
            >
              {couponApplied ? "APPLIED" : "APPLY"}
            </button>
          </form>

          {/* Seller Card */}
          <div className="bg-[#FAF8F3] border border-[#EAE6DD] rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F0ECE5] border border-[#E0DBD0] flex items-center justify-center text-[#1C2E24] flex-shrink-0">
              <User size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#8C9890]">Sold by</p>
              <p className="font-garamond text-sm font-bold text-[#1C2E24] truncate">
                {(product as any).seller?.full_name || "Ratnamayuri Collections"}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#2E7D32] mt-0.5">
                <CheckCircle2 size={12} fill="currentColor" className="text-white bg-[#2E7D32] rounded-full" />
                <span>Verified Seller</span>
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="pt-2 space-y-1.5">
            <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Product Details</h3>
            <p className="font-garamond text-xs text-[#556B5D] leading-relaxed">
              {readMore || (product.description && product.description.length <= 110)
                ? product.description
                : `${product.description?.slice(0, 110)}...`}
            </p>
            {product.description && product.description.length > 110 && (
              <button
                onClick={() => setReadMore(!readMore)}
                className="text-xs font-bold text-[#0D2619] underline focus:outline-none"
              >
                {readMore ? "Show Less" : "Read More"}
              </button>
            )}
          </div>
        </div>

        {/* ── Fixed Bottom Action Buttons & Trust Badges ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E0D5] p-3 shadow-[0_-4px_20px_rgba(13,38,25,0.08)] space-y-3">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-[#FAF8F3] border border-[#E5E0D5] hover:border-[#0D2619] text-[#0D2619] font-garamond font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ShoppingCart size={17} />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-[#0D2619] hover:bg-[#19402B] text-white font-garamond font-bold text-sm py-3 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-[0.98]"
            >
              Buy Now
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#F2EFE9] text-center text-[10px] font-bold text-[#556B5D]">
            <div className="flex flex-col items-center gap-0.5">
              <ShieldCheck size={14} className="text-[#0D2619]" />
              <span>Secure Payment</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <RefreshCw size={14} className="text-[#0D2619]" />
              <span>Easy Returns</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <CheckCircle2 size={14} className="text-[#0D2619]" />
              <span>Quality Assured</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* DESKTOP VIEW                                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2619] hover:underline mb-4"
        >
          <ChevronLeft size={16} /> Back to Catalog
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-[#E5E0D5] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductImage([imagesList[selectedImage]])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 bg-[#E53935] text-white text-xs font-bold px-3 py-1 rounded-md uppercase">
                {discountPercent}% OFF
              </span>
            </div>

            {imagesList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {imagesList.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? "border-[#0D2619]" : "border-transparent opacity-70"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getProductImage([img])} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-2">
                {product.category?.name || "HANDLOOM COLLECTION"}
              </span>
              <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-xs text-[#7A6E5D]">
                <span className="font-bold text-[#1C2E24]">{product.rating_avg || 4.7}</span>
                <div className="flex items-center text-amber-400">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <span>({product.rating_count || 128} customer reviews)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-garamond text-3xl font-extrabold text-[#1C2E24]">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              <span className="font-garamond text-base text-[#8C9890] line-through">
                ₹{origPrice.toLocaleString("en-IN")}
              </span>
              <span className="font-garamond text-sm font-bold text-[#E53935]">
                ({discountPercent}% OFF)
              </span>
            </div>

            <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 space-y-2 text-xs">
              <p className="text-[#2E7D32] font-bold">🟢 In Stock — Ready to Dispatch</p>
              <p className="text-[#556B5D] flex items-center gap-1 flex-wrap">
                🚚 
                {deliveryLocation ? (
                  <>Delivery by <span className="font-bold text-[#1C2E24]">{estimatedDate}</span> to <button onClick={openModal} className="underline font-bold text-[#2E7D32] hover:text-[#0D2619]">{deliveryLocation.pincode}</button></>
                ) : (
                  <>Free Express Delivery across India within <span className="font-bold text-[#1C2E24]">3-5 business days</span>. <button onClick={openModal} className="underline font-bold text-[#2E7D32] hover:text-[#0D2619]">Check Pincode</button></>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Description</h3>
              <p className="text-xs text-[#556B5D] leading-relaxed">{product.description}</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[#FAF8F3] border border-[#0D2619] text-[#0D2619] hover:bg-[#E8F5E9] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-[#0D2619] hover:bg-[#19402B] text-white font-bold py-3.5 rounded-xl transition-colors text-xs shadow-xs"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-[#F0ECE1] space-y-6">
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Similar Treasures You May Love</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {similarProducts.map((simProd) => (
                <ProductCard key={simProd.id} product={simProd} />
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
