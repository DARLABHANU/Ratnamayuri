"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ShoppingBag, Star, Package, ChevronLeft, Plus, Minus, 
  Loader2, Heart, Truck, MapPin, BadgePercent, ShieldCheck, 
  Map, ThumbsUp, RefreshCw, MessageSquare 
} from "lucide-react";
import toast from "react-hot-toast";
import { productApi, addressApi } from "@/lib/api";
import { Product, Address } from "@/types";
import { formatPrice, getProductImage, getApiError } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import Link from "next/link";
import ProductCard from "@/components/customer/ProductCard";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const wishlisted = product ? isWishlisted(product.id) : false;

  // Delivery & Map States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [customPincode, setCustomPincode] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customState, setCustomState] = useState("");
  const [mapDestination, setMapDestination] = useState("Guntur (Godown)");
  const [mapDistance, setMapDistance] = useState(0);
  const [mapETA, setMapETA] = useState("");
  const [mapPathProgress, setMapPathProgress] = useState(0);

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

  // Load addresses when logged in
  useEffect(() => {
    if (isAuthenticated) {
      addressApi.list()
        .then((res) => {
          setAddresses(res.data);
          const def = res.data.find((a: Address) => a.is_default);
          if (def) {
            setSelectedAddressId(def.id);
            updateDeliveryMetrics(def.city, def.state);
          } else if (res.data.length > 0) {
            setSelectedAddressId(res.data[0].id);
            updateDeliveryMetrics(res.data[0].city, res.data[0].state);
          } else {
            // Default to AP/Guntur local
            updateDeliveryMetrics("Guntur", "Andhra Pradesh");
          }
        })
        .catch(() => {});
    } else {
      // Default to Guntur Godown local
      updateDeliveryMetrics("Guntur", "Andhra Pradesh");
    }
  }, [isAuthenticated]);

  // Trigger metrics update when user changes selected address
  const handleAddressChange = (addrId: number) => {
    setSelectedAddressId(addrId);
    const addr = addresses.find((a) => a.id === addrId);
    if (addr) {
      updateDeliveryMetrics(addr.city, addr.state);
      toast.success(`Shipping route recalculated to ${addr.city}!`);
    }
  };

  const handleCustomPincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPincode.trim()) return;

    // Simple mock geolocation mapping from pincodes
    let city = "Hyderabad";
    let state = "Telangana";
    const digit = customPincode.charAt(0);

    if (customPincode.startsWith("522")) {
      city = "Guntur Local";
      state = "Andhra Pradesh";
    } else if (digit === "5") {
      city = "Vijayawada / Nellore";
      state = "Andhra Pradesh";
    } else if (digit === "6") {
      city = "Chennai / Bangalore";
      state = "Tamil Nadu / Karnataka";
    } else if (digit === "4") {
      city = "Mumbai / Pune";
      state = "Maharashtra";
    } else if (digit === "1" || digit === "2") {
      city = "New Delhi / NCR";
      state = "Delhi";
    } else if (digit === "7") {
      city = "Kolkata / Guwahati";
      state = "West Bengal";
    }

    setCustomCity(city);
    setCustomState(state);
    setSelectedAddressId(null); // Deselect address cards
    updateDeliveryMetrics(city, state);
    toast.success(`Delivery calculated for ${city}, ${customPincode}`);
  };

  const updateDeliveryMetrics = (city: string, state: string) => {
    const dest = `${city}, ${state}`;
    setMapDestination(dest);

    // Dynamic routing parameters calculated from GUNTUR, AP
    let dist = 15;
    let days = 1;
    let progressVal = 98; // almost immediate

    const lowerState = state.toLowerCase();
    const lowerCity = city.toLowerCase();

    if (lowerCity.includes("guntur")) {
      dist = 12;
      days = 1;
      progressVal = 98;
    } else if (lowerState.includes("andhra pradesh")) {
      dist = Math.floor(Math.random() * 250) + 50;
      days = 2;
      progressVal = 75;
    } else if (lowerState.includes("telangana") || lowerCity.includes("hyderabad")) {
      dist = Math.floor(Math.random() * 100) + 260;
      days = 2;
      progressVal = 65;
    } else if (lowerState.includes("karnataka") || lowerState.includes("tamil nadu") || lowerState.includes("odisha")) {
      dist = Math.floor(Math.random() * 300) + 500;
      days = 3;
      progressVal = 50;
    } else if (lowerState.includes("maharashtra") || lowerState.includes("gujarat") || lowerState.includes("west bengal")) {
      dist = Math.floor(Math.random() * 500) + 800;
      days = 4;
      progressVal = 35;
    } else {
      // North India / North East
      dist = Math.floor(Math.random() * 800) + 1400;
      days = 6;
      progressVal = 20;
    }

    setMapDistance(dist);
    setMapPathProgress(progressVal);

    // Calculate delivery date formatted like Amazon: "Wednesday, June 3"
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setMapETA(targetDate.toLocaleDateString('en-US', options));
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
                  fill={i < (product.rating_avg || 4.5) ? "#F5A623" : "none"}
                  className="text-[#F5A623]" 
                />
              ))}
            </div>
            <span className="text-xs text-blue-600 hover:text-red-700 cursor-pointer font-medium mt-0.5">
              {(product.rating_avg || 4.5).toFixed(1)} rating · {product.rating_count || 12} customer reviews
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

            {/* expected Delivery Date Widget */}
            <div className="border-t border-b border-gray-100 py-3 space-y-1 text-sm">
              <div className="flex items-center gap-1.5 text-gray-800">
                <Truck size={16} className="text-gold-600" />
                <span>Delivery by: <strong className="text-green-700">{mapETA}</strong></span>
              </div>
              <p className="text-xs text-gray-500 pl-5">Direct dispatch from master godown hub</p>
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

          {/* ================= GUNTUR DELIVERY LIVE ROUTE MAP ================= */}
          <div className="border border-gold-200 rounded-lg overflow-hidden bg-ivory shadow-sm">
            <div className="bg-[#6B1A1A] text-white p-3 flex items-center gap-2">
              <Map size={16} className="text-gold-400 animate-pulse" />
              <span className="font-cinzel text-xs font-bold tracking-wider">Transit Route Planner</span>
            </div>

            <div className="p-4 space-y-4">
              {/* Address Picker Dropdown */}
              {isAuthenticated && addresses.length > 0 ? (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 tracking-wider">SELECT DELIVERY ADDRESS</label>
                  <select 
                    value={selectedAddressId || ""} 
                    onChange={(e) => handleAddressChange(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white text-gray-700"
                  >
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label.toUpperCase()} - {addr.city}, {addr.state}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Custom Pincode Check */}
              <form onSubmit={handleCustomPincodeSubmit} className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 tracking-wider">ENTER CUSTOM PINCODE</label>
                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    placeholder="E.g. 500001 or 400001" 
                    value={customPincode}
                    onChange={(e) => setCustomPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="flex-1 border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:border-gold-500 bg-white text-gray-800"
                  />
                  <button type="submit" className="bg-[#6B1A1A] text-gold-400 font-cinzel font-bold text-[10px] px-3 py-1 rounded hover:bg-gold-600 transition-colors">
                    CALCULATE
                  </button>
                </div>
              </form>

              {/* Interactive Shipping Road Map Vector representation */}
              <div className="relative h-28 w-full bg-[#FAF9F6] border border-gold-100 rounded-md overflow-hidden p-2">
                {/* Visual Route Grid Lines */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" 
                  style={{ 
                    backgroundImage: "radial-gradient(#C9A96E 1px, transparent 1px)", 
                    backgroundSize: "10px 10px" 
                  }} 
                />

                <svg className="w-full h-full" viewBox="0 0 300 90" preserveAspectRatio="none">
                  {/* Highway Line Guntur to Dest */}
                  <path d="M 30,55 Q 150,15 270,45" fill="none" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Flow Route Line */}
                  <path d="M 30,55 Q 150,15 270,45" fill="none" stroke="#C9973E" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="300" strokeDashoffset={300 - (3 * mapPathProgress)} className="transition-all duration-1000 ease-out" />
                  
                  {/* Hub (Guntur) */}
                  <g transform="translate(30, 55)">
                    <circle r="5" fill="#FAF6EE" stroke="#6B1A1A" strokeWidth="2" />
                    <circle r="2.5" fill="#6B1A1A" />
                    <text y="-8" textAnchor="middle" className="font-mono text-[7px] font-bold fill-brown">Guntur Hub</text>
                  </g>

                  {/* Destination */}
                  <g transform="translate(270, 45)">
                    <circle r="6" fill="#FAF6EE" stroke="#22C55E" strokeWidth="2" className="animate-pulse" />
                    <circle r="3" fill="#22C55E" />
                    <text y="-10" textAnchor="middle" className="font-mono text-[7px] font-bold fill-brown">Destination</text>
                  </g>

                  {/* Truck Node */}
                  <g transform="translate(150, 26)">
                    <circle r="10" fill="#6B1A1A" className="animate-ping opacity-15" />
                    <circle r="6" fill="#6B1A1A" />
                    <Truck size={6} className="text-white absolute -mt-1 -ml-1 text-[6px] translate-x-1.5 translate-y-1.5" />
                  </g>
                </svg>

                {/* Details absolute tooltip card */}
                <div className="absolute bottom-1 right-1 bg-white/95 px-2 py-0.5 border border-gold-200 text-[8px] font-mono tracking-tighter text-gray-500 rounded">
                  Route: Guntur → {mapDestination.split(",")[0]}
                </div>
              </div>

              {/* Delivery stats list */}
              <div className="space-y-1.5 text-xs border-t border-gold-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Dispatch Godown:</span>
                  <span className="font-bold text-gray-800">Guntur (Andhra Pradesh)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Location:</span>
                  <span className="font-bold text-gray-800">{mapDestination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Distance:</span>
                  <span className="font-bold text-green-700 font-mono">{mapDistance} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Duration:</span>
                  <span className="font-bold text-green-700">{Math.ceil(mapDistance / 350)} Transit Days</span>
                </div>
              </div>
            </div>
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
      <div className="mt-16 pt-10 border-t border-gray-100 grid md:grid-cols-12 gap-8">
        
        {/* Left Review Matrix */}
        <div className="md:col-span-4 space-y-4">
          <h2 className="text-xl font-serif text-[#111]">Customer reviews</h2>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} size={18} fill={i < 4 ? "#F5A623" : "none"} className="text-[#F5A623]" />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-800">4.5 out of 5</span>
          </div>
          <p className="text-xs text-gray-400">{(product.rating_count || 12) * 4} global ratings</p>

          {/* Progress matrix */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs text-blue-600 hover:underline cursor-pointer">
              <span>5 star</span>
              <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-[#F5A623]" style={{ width: "70%" }} />
              </div>
              <span>70%</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-600 hover:underline cursor-pointer">
              <span>4 star</span>
              <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-[#F5A623]" style={{ width: "18%" }} />
              </div>
              <span>18%</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-600 hover:underline cursor-pointer">
              <span>3 star</span>
              <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-[#F5A623]" style={{ width: "8%" }} />
              </div>
              <span>8%</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-600 hover:underline cursor-pointer">
              <span>2 star</span>
              <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-[#F5A623]" style={{ width: "3%" }} />
              </div>
              <span>3%</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-600 hover:underline cursor-pointer">
              <span>1 star</span>
              <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-[#F5A623]" style={{ width: "1%" }} />
              </div>
              <span>1%</span>
            </div>
          </div>
        </div>

        {/* Right Comments panel */}
        <div className="md:col-span-8 space-y-6">
          <h3 className="text-sm font-bold text-[#111]">Top reviews from India</h3>
          
          <div className="border-b border-gray-100 pb-5 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">SR</div>
              <span className="font-semibold text-gray-800">Sita Rao</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} size={11} fill="#F5A623" className="text-[#F5A623]" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-800">Outstanding Handloom saree! Absolute masterpiece</span>
            </div>
            <p className="text-[10px] text-gray-500">Reviewed in India on May 15, 2026</p>
            <p className="text-xs text-gray-600 font-serif">
              Purchased for my daughter&apos;s wedding. The silk is extraordinarily soft, pure, and heavy. The Guntur dispatch was rapid — arrived in Vizag in less than 24 hours under pristine packing. Extremely happy!
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
              <button className="border border-gray-300 hover:bg-gray-50 px-2.5 py-0.5 rounded text-[10px] font-medium text-gray-700 flex items-center gap-1 shadow-sm">
                <ThumbsUp size={10} /> Helpful
              </button>
              <span>|</span>
              <span>Report abuse</span>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-5 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">PK</div>
              <span className="font-semibold text-gray-800">Prasad K.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} size={11} fill={i < 4 ? "#F5A623" : "none"} className="text-[#F5A623]" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-800">Exquisite gold plating</span>
            </div>
            <p className="text-[10px] text-gray-500">Reviewed in India on May 20, 2026</p>
            <p className="text-xs text-gray-600 font-serif">
              Very premium packaging and finish. Highly detailed artwork. Route planner tracking was surprisingly fun and reliable. Delivering from Guntur directly makes it feel incredibly reliable. Highly recommended!
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
              <button className="border border-gray-300 hover:bg-gray-50 px-2.5 py-0.5 rounded text-[10px] font-medium text-gray-700 flex items-center gap-1 shadow-sm">
                <ThumbsUp size={10} /> Helpful
              </button>
              <span>|</span>
              <span>Report abuse</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
