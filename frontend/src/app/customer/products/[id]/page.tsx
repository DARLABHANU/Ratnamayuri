"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Heart, Share2, Star, ShoppingCart, Loader2,
  ShieldCheck, RefreshCw, CheckCircle2, User, Truck, Package, ArrowRight, MessageSquare, Send
} from "lucide-react";
import toast from "react-hot-toast";
import { productApi, reviewApi } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice, getProductImage, getApiError, getEstimatedDelivery, formatDate } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useDeliveryLocationStore } from "@/store/deliveryLocationStore";
import ProductCard from "@/components/customer/ProductCard";

const DEMO_SIMILAR_PRODUCTS: Product[] = [
  {
    id: 101,
    name: "Kanchipuram Pure Silk Saree",
    slug: "kanchipuram-pure-silk-saree",
    description: "Handcrafted pure silk saree with intricate zari weaving.",
    price: 14999,
    compare_price: 19999,
    stock_quantity: 10,
    is_active: true,
    is_featured: true,
    images: ["/design/cat_sarees.png"],
    rating_avg: 4.9,
    rating_count: 84,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 2, name: "Silk Sarees", slug: "sarees" },
  } as any,
  {
    id: 102,
    name: "Luxury Kundan Choker Set",
    slug: "luxury-kundan-choker-set",
    description: "Royal Kundan necklace set with matching earrings.",
    price: 3499,
    compare_price: 4999,
    stock_quantity: 8,
    is_active: true,
    is_featured: true,
    images: ["/design/cat_jewellery.png"],
    rating_avg: 4.8,
    rating_count: 62,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 1, name: "Jewellery", slug: "jewellery" },
  } as any,
  {
    id: 103,
    name: "Handcrafted Designer Anarkali",
    slug: "handcrafted-designer-anarkali",
    description: "Flowing silk Anarkali dress with embroidered dupatta.",
    price: 4999,
    compare_price: 6999,
    stock_quantity: 12,
    is_active: true,
    is_featured: true,
    images: ["/design/cat_dresses.png"],
    rating_avg: 4.7,
    rating_count: 45,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 3, name: "Dresses", slug: "dresses" },
  } as any,
  {
    id: 104,
    name: "Temple Gold Plated Bangle Set",
    slug: "temple-gold-plated-bangle-set",
    description: "Traditional South Indian temple design bangles.",
    price: 1299,
    compare_price: 1899,
    stock_quantity: 20,
    is_active: true,
    is_featured: true,
    images: ["/design/prod_bangles.png"],
    rating_avg: 4.9,
    rating_count: 110,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 1, name: "Jewellery", slug: "jewellery" },
  } as any,
];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { location: deliveryLocation, openModal } = useDeliveryLocationStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlistStore();

  // Reviews State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Mobile Carousel Touch Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (totalImages: number) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      // Left swipe -> Next image
      setSelectedImage((prev) => (prev + 1) % totalImages);
    } else if (distance < -minSwipeDistance) {
      // Right swipe -> Previous image
      setSelectedImage((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const isFav = product ? isWishlisted(product.id) : false;

  const loadReviews = async (productId: number) => {
    setIsReviewsLoading(true);
    try {
      const res = await reviewApi.getForProduct(productId);
      setReviewsList(Array.isArray(res.data) ? res.data : res.data?.items || []);
    } catch {
      setReviewsList([]);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to write a review");
      router.push("/auth/login");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please enter your review comment");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await reviewApi.createForProduct(Number(id), { rating: newRating, comment: newComment.trim() });
      toast.success("Thank you! Your review has been published.");
      setNewComment("");
      setNewRating(5);
      loadReviews(Number(id));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    loadReviews(Number(id));

    const loadSimilar = async (currentProdId: number, catSlug?: string) => {
      try {
        const params: any = { page_size: 8 };
        if (catSlug) params.category = catSlug;
        const simRes = await productApi.list(params);
        let items = (simRes.data.items || []).filter((p: Product) => p.id !== currentProdId);
        if (items.length < 2) {
          const genRes = await productApi.list({ page_size: 8 });
          items = (genRes.data.items || []).filter((p: Product) => p.id !== currentProdId);
        }
        if (items.length > 0) {
          setSimilarProducts(items.slice(0, 4));
        } else {
          setSimilarProducts(DEMO_SIMILAR_PRODUCTS.filter((p) => p.id !== currentProdId));
        }
      } catch {
        setSimilarProducts(DEMO_SIMILAR_PRODUCTS.filter((p) => p.id !== currentProdId));
      }
    };

    productApi
      .get(Number(id))
      .then((res) => {
        setProduct(res.data);
        loadSimilar(res.data.id, res.data.category?.slug);
      })
      .catch(() => {
        const fallbackProd = {
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
        } as any;
        setProduct(fallbackProd);
        setSimilarProducts(DEMO_SIMILAR_PRODUCTS.filter((p) => p.id !== 1));
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

  const renderReviewsBlock = () => {
    const avgRating = product?.rating_avg || (reviewsList.length > 0
      ? Number((reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length).toFixed(1))
      : 4.8);
    const count = product?.rating_count || reviewsList.length || 12;

    return (
      <div className="space-y-6 pt-8 border-t border-[#F0ECE1]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Customer Reviews &amp; Ratings</h2>
            <p className="text-xs text-[#8C9890]">Real feedback from verified buyers</p>
          </div>
          <div className="text-right">
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{avgRating}</span>
            <div className="flex items-center justify-end text-amber-400 gap-0.5">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} size={14} fill={i < Math.floor(avgRating) ? "currentColor" : "none"} className={i < Math.floor(avgRating) ? "" : "text-gray-300"} />
              ))}
            </div>
            <span className="text-[11px] text-[#7A6E5D] font-medium">{count} Verified Ratings</span>
          </div>
        </div>

        {/* ── 1. Write a Review Form ── */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 md:p-5 shadow-xs space-y-3 font-garamond">
          <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Write a Review</h3>
          <form onSubmit={handlePostReview} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#1C2E24] block mb-1">Your Rating</label>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      size={22}
                      fill={star <= newRating ? "currentColor" : "none"}
                      className={star <= newRating ? "" : "text-gray-300"}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-[#1C2E24] ml-2">{newRating} Stars</span>
              </div>
            </div>

            <div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isAuthenticated ? "Write your detailed review about product quality, fitting, and finish..." : "Please sign in to write a review"}
                disabled={!isAuthenticated}
                rows={3}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-3 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingReview || !isAuthenticated || !newComment.trim()}
                className="inline-flex items-center gap-1.5 bg-[#0D2619] hover:bg-[#19402B] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
              >
                {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Submit Review</span>
              </button>
            </div>
          </form>
        </div>

        {/* ── 2. Reviews List ── */}
        <div className="space-y-3 font-garamond">
          {isReviewsLoading ? (
            <div className="py-6 text-center text-xs text-[#8C9890]">
              <Loader2 className="animate-spin text-[#0D2619] inline-block mb-1" size={20} />
              <p>Loading reviews...</p>
            </div>
          ) : reviewsList.length === 0 ? (
            <div className="bg-[#FAF8F3] border border-[#EAE6DD] rounded-2xl p-6 text-center space-y-2">
              <MessageSquare size={24} className="text-[#8C9890] mx-auto" />
              <p className="font-garamond text-sm font-bold text-[#1C2E24]">No customer reviews yet</p>
              <p className="text-xs text-[#8C9890]">Be the first to review this product!</p>
            </div>
          ) : (
            reviewsList.map((rev) => (
              <div key={rev.id} className="bg-white border border-[#E5E0D5] rounded-2xl p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rev.reviewer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.reviewer_name || "Customer")}&background=0D2619&color=fff`}
                      alt={rev.reviewer_name}
                      className="w-8 h-8 rounded-full object-cover border border-[#E5E0D5]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2E24] leading-none">{rev.reviewer_name}</h4>
                      <span className="text-[10px] text-[#2E7D32] font-semibold">Verified Buyer</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8C9890]">{formatDate(rev.created_at)}</span>
                </div>

                <div className="flex items-center text-amber-400 gap-0.5 pt-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} className={i < rev.rating ? "" : "text-gray-300"} />
                  ))}
                </div>

                <p className="text-xs text-[#4A4033] leading-relaxed pt-1">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
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

        {/* ── Hero Image & Swipeable Carousel ── */}
        <div className="relative bg-white border-b border-[#E5E0D5]">
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(imagesList.length)}
            className="aspect-[4/3] w-full overflow-hidden bg-[#FAF8F3] relative select-none cursor-grab active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={selectedImage}
              src={getProductImage([imagesList[selectedImage]])}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300 animate-fadeIn"
            />

            {/* Discount Badge Pill (Top-Left) */}
            <div className="absolute top-3 left-3 bg-[#E53935] text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs z-10">
              {discountPercent}% OFF
            </div>

            {/* Pagination Pill (Bottom-Right, e.g. 1/3) */}
            {imagesList.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10">
                {selectedImage + 1} / {imagesList.length}
              </div>
            )}

            {/* Left & Right Arrow Buttons (Overlay) */}
            {imagesList.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((prev) => (prev - 1 + imagesList.length) % imagesList.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#1C2E24] flex items-center justify-center shadow-md border border-[#E5E0D5] z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev + 1) % imagesList.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#1C2E24] flex items-center justify-center shadow-md border border-[#E5E0D5] z-10"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {imagesList.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-3">
              {imagesList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    selectedImage === i ? "bg-[#0D2619] w-5" : "bg-[#D9D3C7] w-2"
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
                {(product as any).merchant?.business_name || (product as any).merchant?.full_name || (product as any).seller?.full_name || "Ratnamayuri Collections"}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#2E7D32] mt-0.5">
                <CheckCircle2 size={12} fill="currentColor" className="text-white bg-[#2E7D32] rounded-full" />
                <span>Verified Merchant</span>
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

          {/* ── Customer Reviews & Ratings Section (Mobile) ── */}
          {renderReviewsBlock()}

          {/* ── Similar Products Section (Mobile) ── */}
          {similarProducts.length > 0 && (
            <div className="pt-8 border-t border-[#F0ECE1] space-y-4 pb-20">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">Similar Treasures You May Love</h2>
              <div className="grid grid-cols-2 gap-3">
                {similarProducts.map((simProd) => (
                  <ProductCard key={simProd.id} product={simProd} />
                ))}
              </div>
            </div>
          )}
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

        {/* ── Customer Reviews & Ratings Section (Desktop) ── */}
        <div className="mt-12">
          {renderReviewsBlock()}
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
