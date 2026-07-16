"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ShoppingBag, Star, Package, ChevronLeft, Plus, Minus, 
  Loader2, Heart, BadgePercent, ShieldCheck, 
  ThumbsUp, RefreshCw, MessageSquare, Camera, Trash2, Image as ImageIcon, MapPin
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
      days = 7; // Local warehouse state (Andhra Pradesh - Guntur)
    } else if (firstDigit === "5") {
      days = 7; // Southern Region (AP/TS/KA)
    } else if (firstDigit === "6") {
      days = 8; // Tamil Nadu / Kerala
    } else {
      days = 10; // North/West/East India
    }

    const date = new Date();
    date.setDate(date.getDate() + days);

    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" };
    const dateString = date.toLocaleDateString("en-IN", options);
    
    setDeliveryDate(`${dateString} (${days} days)`);
    setPincodeStatus("success");
  };

  useEffect(() => {
    setIsLoading(true);
    productApi.get(Number(id))
      .then((r) => {
        const prod = r.data;
        setProduct(prod);
        // Load similar products in the same category
        if (prod.category_id) {
          productApi.list({ category_id: prod.category_id, page_size: 6 })
            .then((res) => {
              const items = res.data.items || [];
              setSimilarProducts(items.filter((p: Product) => p.id !== prod.id));
            })
            .catch(() => {});
        }
      })
      .catch(() => toast.error("Product not found"))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Load real reviews for the product
  useEffect(() => {
    if (product) {
      setIsFetchingReviews(true);
      productApi.getReviews(product.id)
        .then((res) => {
          setReviews(res.data);
        })
        .catch((err) => {
          console.error("Failed to load reviews:", err);
        })
        .finally(() => setIsFetchingReviews(false));
    }
  }, [product]);

  // Review Photo Helpers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newFiles = filesArray.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setSelectedReviewFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedReviewFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to write a review.");
      router.push("/auth/login");
      return;
    }
    if (!commentText.trim()) {
      toast.error("Please write some review text.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const uploadedUrls: string[] = [];

      // 1. Upload each selected photo converting it to base64
      for (const item of selectedReviewFiles) {
        const base64Str = await convertToBase64(item.file);
        const uploadRes = await productApi.upload({
          filename: item.file.name,
          base64: base64Str,
        });
        if (uploadRes.data?.url) {
          uploadedUrls.push(uploadRes.data.url);
        }
      }

      // 2. Submit the completed review payload to the backend router
      const addRes = await productApi.addReview(product!.id, {
        rating: userRating,
        comment: commentText.trim(),
        images: uploadedUrls,
      });

      // 3. Prepend the newly created review dynamically to update UI instantly!
      setReviews((prev) => [addRes.data, ...prev]);

      // 4. Update the local product review stats
      if (product) {
        const newCount = (product.rating_count || 0) + 1;
        const newAvg = ((product.rating_avg || 0) * (product.rating_count || 0) + userRating) / newCount;
        setProduct({
          ...product,
          rating_count: newCount,
          rating_avg: Math.round(newAvg * 10) / 10,
        });
      }

      toast.success("Thank you for your feedback!");

      // 5. Reset input fields
      setCommentText("");
      setUserRating(5);
      // Revoke preview object URLs to release memory
      selectedReviewFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      setSelectedReviewFiles([]);
    } catch (err) {
      toast.error(getApiError(err) || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { 
      toast.error("Please sign in to add to cart"); 
      router.push("/auth/login"); 
      return; 
    }
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

  const handleBuyNow = async () => {
    if (!isAuthenticated) { 
      toast.error("Please sign in to complete purchase"); 
      router.push("/auth/login"); 
      return; 
    }
    setIsAdding(true);
    try {
      await addItem(product!.id, quantity);
      router.push("/customer/orders/checkout");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsAdding(false);
    }
  };

  // Dynamic reviews metrics calculations
  const totalReviewsCount = reviews.length > 0 ? reviews.length : (product?.rating_count || 0);
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : (product?.rating_avg || 0);

  // Compute percentages
  const getStarPercentage = (starNum: number) => {
    if (reviews.length === 0) {
      // Return beautiful default static layouts if there are no reviews yet
      const staticMap: Record<number, number> = { 5: 70, 4: 18, 3: 8, 2: 3, 1: 1 };
      return staticMap[starNum] || 0;
    }
    const count = reviews.filter(r => r.rating === starNum).length;
    return Math.round((count / reviews.length) * 100);
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-white">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <button onClick={() => router.back()}
          className="flex items-center gap-1 font-cinzel text-xs tracking-wide text-muted hover:text-brown transition-colors">
          <ChevronLeft size={14} /> BACK TO LISTING
        </button>
        <span className="text-xs text-gray-400 font-medium">Category: {product.category?.name || "Premium Collection"}</span>
      </div>

      {/* Primary Amazon-Style Viewport */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* ================= LEFT GALLERY COLUMN ================= */}
        <div className="lg:col-span-4 flex flex-col md:flex-row gap-4">
          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-x-visible">
              {images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(i)}
                  className={`w-14 h-14 md:w-16 md:h-16 flex-shrink-0 border-2 rounded transition-all bg-ivory overflow-hidden
                    ${i === selectedImage ? "border-gold-500 shadow-sm" : "border-gray-200 hover:border-gold-300"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Primary View Area */}
          <div className="flex-1 order-1 md:order-2">
            <div className="relative aspect-square w-full bg-[#FAF9F6] border border-gray-100 rounded-lg overflow-hidden group">
              <img 
                src={images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = getProductImage([]); }}
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold tracking-widest px-3 py-1 rounded shadow-sm">
                  {discount}% OFF
                </span>
              )}
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-3 italic">
              Hover image to zoom · Crafted with 100% genuine traditional materials
            </p>
          </div>
        </div>

        {/* ================= CENTER PRODUCT DETAILS COLUMN ================= */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            {product.category && (
              <span className="inline-block bg-gold-50 text-gold-700 text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded border border-gold-200 uppercase mb-2">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-serif text-[#111] leading-snug font-medium mb-1">
              {product.name}
            </h1>
            <p className="text-sm text-gold-600 font-medium">Brand: Ratnamayuri Exclusive</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
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
            <span className="text-xs text-blue-600 hover:text-red-700 cursor-pointer font-medium mt-0.5">
              {averageRating.toFixed(1)} rating · {totalReviewsCount} customer reviews
            </span>
          </div>

          {/* Deals and Promo Section */}
          <div className="bg-[#FFF8F0] border border-orange-100 p-4 rounded-md flex items-start gap-3">
            <BadgePercent className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-xs font-bold text-orange-800">Special Heritage Launch Offer Included</p>
              <p className="text-xs text-orange-700 mt-1">Get free secure transit insurance & elegant traditional box packaging with this product automatically today.</p>
            </div>
          </div>

          {/* Detailed Specifications table */}
          <div>
            <h3 className="text-sm font-bold text-[#111] border-b border-gray-100 pb-2 mb-3">Product Details & Specifications</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-500">Material Type</span>
                <span className="font-semibold text-gray-800">{product.attributes?.material || "Premium Silk / 22K Gold Plated"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-500">Occasion</span>
                <span className="font-semibold text-gray-800">{product.attributes?.occasion || "Wedding / Festival"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-500">Origin Godown</span>
                <span className="font-semibold text-gray-800">Guntur, AP</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-500">Weave / Style</span>
                <span className="font-semibold text-gray-800">{product.attributes?.style || "Traditional Handloom"}</span>
              </div>
              {product.attributes && Object.entries(product.attributes).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-gray-50 pb-1.5 col-span-2 md:col-span-1">
                  <span className="text-gray-500 capitalize">{key.replace("_", " ")}</span>
                  <span className="font-semibold text-gray-800">{val as string}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About this item Bullet points */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#111]">About this item</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>**Elegant Indian Craftsmanship:** Completely authentic weaving and designing by local award-winning artisans.</li>
              <li>**Strict Quality Guarantee:** Fully certified raw products with authentic hallmark stamp of craftsmanship.</li>
              <li>**Godown-Direct shipping:** Shipped under sanitized protocols direct from our master Guntur distribution warehouse.</li>
              <li>**Secure Packing:** Arrives encased in an exquisite luxury gift box with customized fabric protectors.</li>
            </ul>
          </div>

          {/* Full description */}
          {product.description && (
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-[#111] mb-2">Product Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-serif">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* ================= RIGHT COL (Secure Buy Box + Delivery Route Map) ================= */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Buy Box Container */}
          <div className="border border-gray-200 rounded-lg p-5 bg-[#FAFAFA] shadow-sm space-y-4">
            
            {/* Price Box */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-medium text-gray-900">{formatPrice(product.price)}</span>
              </div>
              {product.compare_price && (
                <div className="text-xs text-gray-500 mt-1">
                  M.R.P.: <span className="line-through">{formatPrice(product.compare_price)}</span> ({discount}% Off)
                </div>
              )}
            </div>

            {/* expected Delivery Date Pincode Verification Widget */}
            <div className="border-t border-b border-gray-100 py-3.5 space-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                <MapPin size={15} className="text-gold-600" />
                <span>Delivery Availability</span>
              </div>
              <form onSubmit={handlePincodeCheck} className="flex gap-1.5 mt-1.5">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  className="font-garamond text-xs px-2.5 py-1.5 border border-gold-200 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500 rounded flex-1"
                  required
                />
                <button type="submit" className="bg-deep hover:bg-brown text-gold-300 px-3 py-1.5 text-[10px] font-cinzel font-semibold tracking-wider rounded">
                  CHECK
                </button>
              </form>
              
              {pincodeStatus === "success" && deliveryDate && (
                <div className="text-[11px] text-green-700 bg-green-50 border border-green-150 p-2 mt-1 rounded space-y-0.5 animate-fade-in">
                  <p className="font-semibold">✓ Deliverable to {pincode}</p>
                  <p>Estimated Delivery: {deliveryDate}</p>
                  <p className="text-[9px] text-muted normal-case font-normal">(Dispatched from Guntur warehouse center)</p>
                </div>
              )}

              {pincodeStatus === "error" && (
                <div className="text-[11px] text-red-700 bg-red-50 border border-red-150 p-2 mt-1 rounded animate-fade-in">
                  ⚠ Please enter a valid 6-digit numeric Pincode.
                </div>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${product.stock_quantity > 0 ? "bg-green-600" : "bg-red-500"}`} />
              <span className={`text-xs font-bold tracking-wider uppercase
                ${product.stock_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                {product.stock_quantity > 0 ? "IN STOCK" : "OUT OF STOCK"}
              </span>
            </div>

            {/* Quantity select */}
            {product.stock_quantity > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Qty:</span>
                <div className="flex items-center border border-gray-300 rounded bg-white">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-2 py-1 text-gray-500 hover:text-black">
                    <Minus size={12} />
                  </button>
                  <span className="px-3 py-1 text-xs font-bold">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    className="px-2 py-1 text-gray-500 hover:text-black">
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
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-medium py-2 px-4 rounded text-sm transition-colors border border-[#FCD200] shadow-sm flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} />
                  ADD TO CART
                </button>
                <button 
                  onClick={handleBuyNow} 
                  disabled={isAdding}
                  className="w-full bg-[#FFA41C] hover:bg-[#F3A847] text-gray-900 font-medium py-2 px-4 rounded text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  BUY NOW
                </button>
              </div>
            ) : (
              <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-2 rounded text-sm cursor-not-allowed">
                OUT OF STOCK
              </button>
            )}

            {/* Wishlist button */}
            <button
              onClick={async () => {
                if (!isAuthenticated) { toast.error("Please sign in to save to wishlist"); return; }
                try {
                  const added = await toggleWishlist(product.id);
                  toast.success(added ? "Saved to wishlist!" : "Removed from wishlist");
                } catch { toast.error("Failed to update wishlist"); }
              }}
              className="w-full border border-gray-300 hover:bg-gray-50 py-1.5 px-4 rounded text-xs font-medium text-gray-700 flex items-center justify-center gap-2 transition-all"
            >
              <Heart size={14} fill={wishlisted ? "#6B1A1A" : "none"} className={wishlisted ? "text-gold-500" : "text-gray-500"} />
              {wishlisted ? "SAVED TO WISHLIST" : "ADD TO WISHLIST"}
            </button>
          </div>

        </div>
      </div>

      {/* ================= SIMILAR PRODUCTS SECTION ================= */}
      {similarProducts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-serif text-[#111]">Customers who viewed this item also viewed</h2>
              <p className="text-xs text-gray-400 mt-1">Hand-picked similar items matching this material & design weave</p>
            </div>
            <Link href="/customer/products" className="text-xs font-cinzel font-bold text-[#6B1A1A] hover:text-gold-600 transition-colors">
              VIEW ALL
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {similarProducts.slice(0, 5).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}

      {/* ================= CUSTOMER REVIEWS & FEEDBACK BREAKDOWN ================= */}
      <div className="mt-16 pt-10 border-t border-gray-100 grid md:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Review Matrix */}
        <div className="md:col-span-4 space-y-4">
          <h2 className="text-xl font-serif text-[#111]">Customer reviews</h2>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array(5).fill(0).map((_, i) => (
                <Star 
                  key={i} 
                  size={18} 
                  fill={i < Math.round(averageRating) ? "#F5A623" : "none"} 
                  className="text-[#F5A623]" 
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-800">
              {averageRating.toFixed(1)} out of 5
            </span>
          </div>
          <p className="text-xs text-gray-400">{totalReviewsCount} customer ratings</p>

          {/* Dynamic Progress matrix */}
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = getStarPercentage(star);
              return (
                <div key={star} className="flex items-center gap-3 text-xs text-blue-600 hover:underline cursor-pointer">
                  <span className="w-8 flex-shrink-0 text-right">{star} star</span>
                  <div className="flex-1 h-3.5 bg-gray-100 border border-gray-200 rounded overflow-hidden">
                    <div className="h-full bg-[#F5A623] transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 flex-shrink-0 text-left font-medium text-gray-700">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Add Review Panel */}
          {isAuthenticated ? (
            <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
              <h3 className="font-cinzel text-xs font-bold tracking-widest text-[#6B1A1A] uppercase">Share Your Feedback</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4 bg-[#FAF9F6] border border-gold-200 p-4 rounded-md shadow-sm">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1 font-cinzel tracking-widest">SELECT RATING</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setUserRatingHover(star)}
                        onMouseLeave={() => setUserRatingHover(0)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star
                          size={20}
                          fill={star <= (userRatingHover || userRating) ? "#F5A623" : "none"}
                          className="text-[#F5A623]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1 font-cinzel tracking-widest">WRITE A CRITIQUE</label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Describe the design quality, material texture, and weaving precision of this masterpiece."
                    rows={4}
                    className="w-full border border-gray-300 rounded p-2.5 text-xs outline-none focus:border-gold-500 font-serif bg-white text-gray-800 leading-relaxed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1.5 font-cinzel tracking-widest">ADD PRODUCT IMAGES (OPTIONAL)</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    <label className="w-12 h-12 border border-dashed border-gray-400 hover:border-gold-500 rounded flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                      <Camera size={16} className="text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    {selectedReviewFiles.map((fileItem, idx) => (
                      <div key={idx} className="relative w-12 h-12 border border-gray-200 rounded overflow-hidden">
                        <img src={fileItem.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute -top-0.5 -right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 shadow-sm transition-colors"
                        >
                          <Trash2 size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-[#6B1A1A] hover:bg-gold-600 text-white font-cinzel font-bold text-[10px] py-2.5 px-4 rounded tracking-widest transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-white" />
                      SUBMITTING FEEDBACK...
                    </>
                  ) : (
                    "SUBMIT REVIEW"
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-6 mt-6 p-4 rounded bg-ivory border border-gold-200">
              <p className="text-xs text-gray-500 font-serif leading-relaxed mb-3">
                Want to share your experience with this premium product? Please sign in to write a customer review.
              </p>
              <Link href="/auth/login" className="btn-primary py-2 text-center text-xs block font-cinzel font-bold tracking-wider">
                SIGN IN TO REVIEW
              </Link>
            </div>
          )}
        </div>

        {/* Right Comments panel */}
        <div className="md:col-span-8 space-y-6">
          <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider font-cinzel border-b border-gray-100 pb-2">Top reviews from India</h3>
          
          {isFetchingReviews ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="animate-spin text-gold-500" size={24} />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center font-serif text-gray-500">
              <MessageSquare className="mx-auto text-gold-300 w-12 h-12 mb-3" />
              <p className="text-lg">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to share your thoughts about this masterpiece!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    {review.reviewer_avatar ? (
                      <img src={review.reviewer_avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#FAF6EE] border border-gold-300 flex items-center justify-center font-bold text-[#6B1A1A] text-[10px]">
                        {review.reviewer_name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-gray-800">{review.reviewer_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          size={11} 
                          fill={i < review.rating ? "#F5A623" : "none"} 
                          className="text-[#F5A623]" 
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-800">
                      {review.rating === 5 ? "Highly Recommended!" : review.rating >= 4 ? "Very Good Purchase" : "Verified Purchase"}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-gray-500 font-mono">Reviewed in India on {formatDate(review.created_at)}</p>
                  
                  <p className="text-xs text-gray-600 font-serif leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Review Photos Clickable Grid */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {review.images.map((imgUrl, idx) => (
                        <a 
                          key={idx} 
                          href={imgUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="relative w-16 h-16 border border-gray-200 rounded overflow-hidden hover:opacity-90 transition-opacity bg-[#FAF9F6] block flex-shrink-0"
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-3 pt-1">
                    <button className="border border-gray-300 hover:bg-gray-50 px-2.5 py-0.5 rounded text-[10px] font-medium text-gray-700 flex items-center gap-1 shadow-sm transition-colors">
                      <ThumbsUp size={10} /> Helpful
                    </button>
                    <span>|</span>
                    <span className="cursor-pointer hover:text-red-600 text-[10px] transition-colors">Report abuse</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
