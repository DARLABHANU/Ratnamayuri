"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ShoppingBag, Star, ChevronLeft, Plus, Minus, 
  Loader2, Heart, BadgePercent, ShieldCheck, 
  ThumbsUp, RefreshCw, MessageSquare, Camera, Trash2, MapPin
} from "lucide-react";
import toast from "react-hot-toast";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice, getProductImage, getApiError, formatDate } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import Link from "next/link";
import ProductCard from "@/components/customer/ProductCard";

interface Review {
  id: number;
  product_id: number;
  rating: number;
  comment: string;
  images: string[];
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const wishlisted = product ? isWishlisted(product.id) : false;

  // Reviews States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFetchingReviews, setIsFetchingReviews] = useState(true);
  const [userRating, setUserRating] = useState(5);
  const [userRatingHover, setUserRatingHover] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [selectedReviewFiles, setSelectedReviewFiles] = useState<{ file: File; preview: string }[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Pincode Delivery Estimation States
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "success" | "error">("idle");
  const [deliveryDate, setDeliveryDate] = useState("");

  // Helpful votes state
  const [helpfulVotes, setHelpfulVotes] = useState<Record<number, { count: number; voted: boolean }>>({});

  const handleHelpfulClick = (reviewId: number) => {
    setHelpfulVotes((prev) => {
      const current = prev[reviewId] || { count: Math.floor((reviewId * 7) % 40) + 12, voted: false };
      if (current.voted) {
        return { ...prev, [reviewId]: { count: current.count - 1, voted: false } };
      }
      return { ...prev, [reviewId]: { count: current.count + 1, voted: true } };
    });
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setPincodeStatus("error");
      return;
    }
    
    const firstDigit = pincode[0];
    const startsWith52 = pincode.startsWith("52");
    
    let days = 7;
    if (startsWith52) {
      days = 7;
    } else if (firstDigit === "5") {
      days = 7;
    } else if (firstDigit === "6") {
      days = 8;
    } else {
      days = 10;
    }

    const date = new Date();
    date.setDate(date.getDate() + days);

    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" };
    const dateString = date.toLocaleDateString("en-IN", options);
    
    setDeliveryDate(`${dateString} (${days} days)`);
    setPincodeStatus("success");
  };

  useEffect(() => {
    if (!id) return;
    loadProduct();
    loadReviews();
  }, [id]);

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const { data } = await productApi.get(Number(id));
      setProduct(data);

      if (data.category?.slug) {
        const similarRes = await productApi.list({ category: data.category.slug, page_size: 4 });
        setSimilarProducts(similarRes.data.items.filter((p: Product) => p.id !== data.id));
      }
    } catch {
      toast.error("Failed to load product details");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    setIsFetchingReviews(true);
    try {
      const { data } = await productApi.getReviews(Number(id));
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setIsFetchingReviews(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (selectedReviewFiles.length + files.length > 3) {
      toast.error("You can upload a maximum of 3 images for a review.");
      return;
    }

    const newEntries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedReviewFiles((prev) => [...prev, ...newEntries]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedReviewFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to write a review");
      return;
    }
    if (!commentText.trim()) {
      toast.error("Please enter your review comments");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const base64Images: string[] = [];
      for (const item of selectedReviewFiles) {
        const b64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(item.file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
        base64Images.push(b64);
      }

      await productApi.addReview(Number(id), {
        rating: userRating,
        comment: commentText.trim(),
        images: base64Images,
      });

      toast.success("Thank you! Your verified review has been published.");
      setCommentText("");
      setSelectedReviewFiles([]);
      setUserRating(5);
      loadReviews();
      loadProduct();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add to cart");
      return;
    }
    if (!product) return;

    setIsAdding(true);
    try {
      await addItem(product.id, quantity);
      toast.success(`Added ${quantity} item(s) to bag!`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to continue checkout");
      return;
    }
    if (!product) return;

    setIsAdding(true);
    try {
      await addItem(product.id, quantity);
      router.push("/customer/cart");
    } catch (err) {
      toast.error(getApiError(err));
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-[#0D2619]" size={36} />
        <p className="text-xs text-[#8C9890] font-bold">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-24 text-center p-8 bg-white border border-[#E5E0D5] rounded-3xl shadow-xs space-y-4">
        <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Product Not Found</h2>
        <p className="text-xs text-[#8C9890]">The requested item is no longer available or was removed.</p>
        <button onClick={() => router.push("/customer/products")} className="border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all">
          Return to Catalog
        </button>
      </div>
    );
  }

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const averageRating = product.rating_avg || 5.0;
  const totalReviewsCount = reviews.length || product.rating_count || 0;
  const images = product.images?.length ? product.images : [getProductImage([])];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-garamond text-[#1C2E24] space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-[#0D2619] hover:underline transition-colors"
        >
          <ChevronLeft size={15} /> Back to Catalog
        </button>
        <span className="text-xs text-[#8C9890] font-bold">Category: {product.category?.name || "Premium Collection"}</span>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* ================= LEFT GALLERY COLUMN ================= */}
        <div className="lg:col-span-4 flex flex-col md:flex-row gap-4">
          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-x-visible">
              {images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(i)}
                  className={`w-14 h-14 md:w-16 md:h-16 flex-shrink-0 border-2 rounded-xl transition-all bg-[#FAF8F3] overflow-hidden ${
                    i === selectedImage ? "border-[#0D2619] shadow-2xs" : "border-[#E5E0D5] hover:border-[#0D2619]"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Primary View Area */}
          <div className="flex-1 order-1 md:order-2">
            <div className="relative aspect-square w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-3xl overflow-hidden group shadow-xs">
              <img 
                src={images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = getProductImage([]); }}
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-700 text-white text-[11px] font-bold tracking-wider px-3 py-1 rounded-md shadow-2xs">
                  {discount}% OFF
                </span>
              )}
            </div>
            
            <p className="text-center text-xs text-[#8C9890] mt-3">
              Crafted with 100% genuine traditional materials
            </p>
          </div>
        </div>

        {/* ================= CENTER PRODUCT DETAILS COLUMN ================= */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            {product.category && (
              <span className="inline-block bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-md uppercase mb-2">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-cormorant text-[#1C2E24] leading-snug font-bold">
              {product.name}
            </h1>
            <p className="text-xs text-[#8C9890] font-bold mt-1">Brand: Ratnamayuri Exclusive</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-4">
            <div className="flex gap-0.5">
              {Array(5).fill(0).map((_, i) => (
                <Star 
                  key={i} 
                  size={15}
                  fill={i < Math.round(averageRating) ? "#F5A623" : "none"}
                  className="text-[#F5A623]" 
                />
              ))}
            </div>
            <span className="text-xs text-[#0D2619] font-bold">
              {averageRating.toFixed(1)} rating · {totalReviewsCount} customer reviews
            </span>
          </div>

          {/* Deals and Promo Section */}
          <div className="bg-[#FAF8F3] border border-[#E5E0D5] p-4 rounded-2xl flex items-start gap-3">
            <BadgePercent className="text-[#0D2619] flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-xs font-bold text-[#1C2E24]">Special Heritage Launch Offer Included</p>
              <p className="text-xs text-[#556B5D] mt-0.5 leading-relaxed">
                Get free secure transit insurance &amp; elegant traditional box packaging with this product automatically today.
              </p>
            </div>
          </div>

          {/* Detailed Specifications table */}
          <div className="space-y-3">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-2">Product Details &amp; Specifications</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              <div className="flex justify-between border-b border-[#F5F2EA] pb-1.5">
                <span className="text-[#8C9890]">Material Type</span>
                <span className="font-bold text-[#1C2E24]">{product.attributes?.material || "Premium Silk / 22K Gold Plated"}</span>
              </div>
              <div className="flex justify-between border-b border-[#F5F2EA] pb-1.5">
                <span className="text-[#8C9890]">Occasion</span>
                <span className="font-bold text-[#1C2E24]">{product.attributes?.occasion || "Wedding / Festival"}</span>
              </div>
              <div className="flex justify-between border-b border-[#F5F2EA] pb-1.5">
                <span className="text-[#8C9890]">Origin Godown</span>
                <span className="font-bold text-[#1C2E24]">Guntur, AP</span>
              </div>
              <div className="flex justify-between border-b border-[#F5F2EA] pb-1.5">
                <span className="text-[#8C9890]">Weave / Style</span>
                <span className="font-bold text-[#1C2E24]">{product.attributes?.style || "Traditional Handloom"}</span>
              </div>
              {product.attributes && Object.entries(product.attributes).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-[#F5F2EA] pb-1.5 col-span-2 md:col-span-1">
                  <span className="text-[#8C9890] capitalize">{key.replace("_", " ")}</span>
                  <span className="font-bold text-[#1C2E24]">{val as string}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About this item Bullet points */}
          <div className="space-y-2">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">About this item</h3>
            <ul className="list-disc pl-5 text-xs text-[#556B5D] space-y-1.5 leading-relaxed">
              <li><strong>Elegant Indian Craftsmanship:</strong> Authentic weaving and designing by local award-winning artisans.</li>
              <li><strong>Strict Quality Guarantee:</strong> Fully certified raw products with authentic hallmark stamp of craftsmanship.</li>
              <li><strong>Godown-Direct Shipping:</strong> Shipped under sanitized protocols direct from our central warehouse.</li>
              <li><strong>Secure Packing:</strong> Arrives encased in an exquisite luxury gift box with protective covers.</li>
            </ul>
          </div>

          {/* Full description */}
          {product.description && (
            <div className="border-t border-[#F0ECE1] pt-4 space-y-2">
              <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Product Description</h3>
              <p className="text-xs text-[#556B5D] leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Sold By / Merchant Store Card */}
          <div className="border border-[#E5E0D5] rounded-2xl p-4 bg-[#FAF8F3] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              {product.merchant?.logo_url ? (
                <img 
                  src={product.merchant.logo_url} 
                  alt={product.merchant.business_name} 
                  className="w-10 h-10 rounded-full object-cover border border-[#E5E0D5]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0D2619] text-white flex items-center justify-center font-bold text-xs">
                  {product.merchant?.business_name ? product.merchant.business_name.substring(0, 2).toUpperCase() : "RM"}
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-[#1C2E24]">
                  {product.merchant?.business_name || "RATNAMAYURI BOUTIQUE OFFICIAL"}
                </h4>
                <p className="text-[11px] text-[#2E7D32] font-semibold mt-0.5">Verified Authorised Merchant</p>
              </div>
            </div>
            <Link href={`/customer/products?merchant_id=${product.merchant_id}`} className="border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all">
              View Shop
            </Link>
          </div>

          {/* Trust Seals Bar */}
          <div className="grid grid-cols-3 gap-2 border-t border-b border-[#F0ECE1] py-4 bg-[#FAF8F3] rounded-2xl text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck size={20} className="text-[#0D2619] mb-1" />
              <span className="text-[11px] font-bold text-[#1C2E24]">LOWEST PRICE</span>
              <span className="text-[10px] text-[#8C9890]">Direct Factory Rate</span>
            </div>
            <div className="flex flex-col items-center border-x border-[#E5E0D5] px-1">
              <ShieldCheck size={20} className="text-[#0D2619] mb-1" />
              <span className="text-[11px] font-bold text-[#1C2E24]">100% SECURE</span>
              <span className="text-[10px] text-[#8C9890]">Razorpay Encrypted</span>
            </div>
            <div className="flex flex-col items-center">
              <RefreshCw size={20} className="text-[#0D2619] mb-1" />
              <span className="text-[11px] font-bold text-[#1C2E24]">7-DAY RETURNS</span>
              <span className="text-[10px] text-[#8C9890]">Instant RMA Refund</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COL (Secure Buy Box) ================= */}
        <div className="lg:col-span-3 space-y-6">
          <div className="border border-[#E5E0D5] rounded-3xl p-6 bg-white shadow-xs space-y-5">
            {/* Price Box */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-cormorant text-3xl font-extrabold text-[#1C2E24]">{formatPrice(product.price)}</span>
              </div>
              {product.compare_price && (
                <div className="text-xs text-[#8C9890] mt-1">
                  M.R.P.: <span className="line-through">{formatPrice(product.compare_price)}</span> <strong className="text-[#2E7D32]">({discount}% Off)</strong>
                </div>
              )}
            </div>

            {/* Pincode Delivery Check */}
            <div className="border-t border-b border-[#F0ECE1] py-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#1C2E24] font-bold">
                <MapPin size={15} className="text-[#0D2619]" />
                <span>Delivery Availability</span>
              </div>
              <form onSubmit={handlePincodeCheck} className="flex gap-2 mt-1.5">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  className="text-xs px-3 py-2 border border-[#E5E0D5] bg-[#FAF8F3] focus:outline-none focus:border-[#0D2619] rounded-xl flex-1 font-semibold text-[#1C2E24]"
                  required
                />
                <button type="submit" className="bg-[#0D2619] hover:bg-[#19402B] text-white px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-2xs">
                  CHECK
                </button>
              </form>
              
              {pincodeStatus === "success" && deliveryDate && (
                <div className="text-xs text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] p-2.5 mt-2 rounded-xl space-y-0.5">
                  <p className="font-bold">✓ Deliverable to {pincode}</p>
                  <p>Estimated Delivery: {deliveryDate}</p>
                </div>
              )}

              {pincodeStatus === "error" && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 mt-2 rounded-xl">
                  ⚠ Please enter a valid 6-digit numeric Pincode.
                </div>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${product.stock_quantity > 0 ? "bg-emerald-600" : "bg-red-500"}`} />
              <span className={`text-xs font-bold uppercase ${product.stock_quantity > 0 ? "text-[#2E7D32]" : "text-red-600"}`}>
                {product.stock_quantity > 0 ? "IN STOCK" : "OUT OF STOCK"}
              </span>
            </div>

            {/* Quantity Select */}
            {product.stock_quantity > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1C2E24]">Quantity:</span>
                <div className="flex items-center border border-[#E5E0D5] rounded-xl bg-[#FAF8F3]">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-[#1C2E24] hover:bg-[#E5E0D5]/50 rounded-l-xl">
                    <Minus size={12} />
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-[#1C2E24]">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))} className="px-3 py-1.5 text-[#1C2E24] hover:bg-[#E5E0D5]/50 rounded-r-xl">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Buying Buttons */}
            {product.stock_quantity > 0 ? (
              <div className="space-y-2">
                <button 
                  onClick={handleAddToCart} 
                  disabled={isAdding}
                  className="w-full bg-[#0D2619] hover:bg-[#19402B] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingBag size={15} />
                  <span>ADD TO BAG</span>
                </button>
                <button 
                  onClick={handleBuyNow} 
                  disabled={isAdding}
                  className="w-full border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>BUY NOW</span>
                </button>
              </div>
            ) : (
              <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-3 rounded-xl text-xs cursor-not-allowed">
                OUT OF STOCK
              </button>
            )}

            {/* Wishlist Button */}
            <button
              onClick={async () => {
                if (!isAuthenticated) { toast.error("Please sign in to save to wishlist"); return; }
                try {
                  const added = await toggleWishlist(product.id);
                  toast.success(added ? "Saved to wishlist!" : "Removed from wishlist");
                } catch { toast.error("Failed to update wishlist"); }
              }}
              className="w-full border border-[#E5E0D5] bg-[#FAF8F3] hover:bg-white py-2.5 px-4 rounded-xl text-xs font-bold text-[#1C2E24] flex items-center justify-center gap-2 transition-all"
            >
              <Heart size={14} className={wishlisted ? "fill-red-600 text-red-600" : "text-[#1C2E24]"} />
              <span>{wishlisted ? "SAVED TO WISHLIST" : "ADD TO WISHLIST"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= REVIEWS SECTION ================= */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 md:p-8 shadow-xs space-y-8 mt-12">
        <div className="border-b border-[#F0ECE1] pb-4">
          <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Customer Ratings &amp; Verified Reviews</h2>
          <p className="text-xs text-[#8C9890] mt-0.5">Real feedback from verified purchasers</p>
        </div>

        {/* Submit Review Box */}
        {isAuthenticated && (
          <form onSubmit={handleReviewSubmit} className="bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl p-6 space-y-4">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Write a Product Review</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1C2E24] block">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setUserRatingHover(star)}
                    onMouseLeave={() => setUserRatingHover(0)}
                    className="text-amber-400 p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      size={20}
                      fill={(userRatingHover || userRating) >= star ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C2E24] block mb-1">Your Review Comment</label>
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your experience with fabric quality, weave, sizing, and delivery..."
                className="w-full bg-white border border-[#E5E0D5] rounded-xl p-3 text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619] resize-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C2E24] block mb-1">Upload Customer Photos (Max 3)</label>
              <div className="flex flex-wrap gap-3 items-center">
                {selectedReviewFiles.map((fileObj, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl border border-[#E5E0D5] overflow-hidden group">
                    <img src={fileObj.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                {selectedReviewFiles.length < 3 && (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#E5E0D5] hover:border-[#0D2619] bg-white flex flex-col items-center justify-center cursor-pointer transition-all">
                    <Camera size={18} className="text-[#8C9890]" />
                    <span className="text-[9px] font-bold text-[#8C9890] mt-1">Add Photo</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview || !commentText.trim()}
              className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              <span>Submit Review</span>
            </button>
          </form>
        )}

        {/* Reviews List */}
        {isFetchingReviews ? (
          <div className="py-8 text-center"><Loader2 className="animate-spin text-[#0D2619] mx-auto" size={24} /></div>
        ) : reviews.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8C9890]">No reviews written yet for this product. Be the first to share feedback!</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-[#1C2E24]">{rev.reviewer_name || "Verified Customer"}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex text-amber-400">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#8C9890]">{formatDate(rev.created_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleHelpfulClick(rev.id)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      helpfulVotes[rev.id]?.voted
                        ? "bg-[#0D2619] text-white border-[#0D2619]"
                        : "bg-white text-[#556B5D] border-[#E5E0D5] hover:border-[#0D2619]"
                    }`}
                  >
                    <ThumbsUp size={11} />
                    <span>Helpful ({helpfulVotes[rev.id]?.count || 12})</span>
                  </button>
                </div>

                <p className="text-[#556B5D] leading-relaxed">{rev.comment}</p>

                {rev.images && rev.images.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {rev.images.map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-[#E5E0D5]" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Similar Products Carousel / Grid */}
      {similarProducts.length > 0 && (
        <div className="space-y-4 mt-12">
          <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Similar Collections You May Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarProducts.map((sp) => (
              <ProductCard key={sp.id} product={sp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
