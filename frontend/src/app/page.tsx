"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/layout/Footer";
import { ChevronLeft, ChevronRight, Heart, Star, Truck, ShieldCheck, RefreshCw, BadgeCheck, Lock, Search, ShoppingBag, User, LogOut, ChevronRight as ArrowRight } from "lucide-react";
import { productApi } from "@/lib/api";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { getProductImage } from "@/lib/utils";

// ─── Color tokens (matches reference: maroon + gold + cream) ──────────────────
// Primary maroon: #6B1A1A  |  Gold: #C9973E  |  Cream: #FAF6EE

const HERO_SLIDES = [
  {
    tag: "ROYAL HERITAGE WEAVES",
    heading: ["Silk Sarees of", "Unparalleled "],
    highlight: "Elegance.",
    sub: "Kanjivaram, Banarasi & Mysore Silk — the absolute finest handloom weaves in India.",
    cta: "EXPLORE SAREES",
    href: "/customer/products?category=sarees",
    bg: "from-[#FAF0E4] to-[#F5E6D0]",
    img: "/hero_saree_new.png",
  },
  {
    tag: "HANDCRAFTED ORNAMENTS",
    heading: ["Heritage Bangles &", "Royal "],
    highlight: "Kadas.",
    sub: "Exquisite 22K gold-plated Kada bangles set with uncut polki and precious stones.",
    cta: "EXPLORE BANGLES",
    href: "/customer/products?search=bangles",
    bg: "from-[#F5E8F0] to-[#EDD5E4]",
    img: "/hero_bridal_model_1780120945368.png",
  },
  {
    tag: "TIMELESS GOLD CHAINS",
    heading: ["Delicate Gold Chains", "and "],
    highlight: "Neckpieces.",
    sub: "Finest handmade gold chains, temple chokers, and daily wear neckwear.",
    cta: "EXPLORE CHAINS",
    href: "/customer/products?search=chain",
    bg: "from-[#E8F0F5] to-[#D5E4EF]",
    img: "/hero_chain_new.png",
  },
];

const CATEGORIES = [
  { label: "Sarees", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=200&auto=format&fit=crop", href: "/customer/products?category=sarees" },
  { label: "Bangles", img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200&auto=format&fit=crop", href: "/customer/products?search=bangles" },
  { label: "Chains", img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop", href: "/customer/products?search=chain" },
  { label: "Jewellery", img: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=200&auto=format&fit=crop", href: "/customer/products?category=jewellery" },
  { label: "Rings", img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=200&auto=format&fit=crop", href: "/customer/products?search=rings" },
  { label: "Earrings", img: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=200&auto=format&fit=crop", href: "/customer/products?search=earrings" },
  { label: "New Arrivals", img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=200&auto=format&fit=crop", href: "/customer/products" },
  { label: "Gifts", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop", href: "/customer/products" },
];

const TRUST_BADGES = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
    title: "PREMIUM QUALITY",
    sub: "Finest Craftsmanship"
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: "CERTIFIED JEWELLERY",
    sub: "BIS Hallmarked"
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    title: "FREE SHIPPING",
    sub: "On Orders Above ₹1999"
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 21v-5h5"/>
      </svg>
    ),
    title: "EASY RETURNS",
    sub: "7 Days Return Policy"
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: "SECURE PAYMENTS",
    sub: "100% Safe & Secure"
  }
];

const TRENDING = [
  { name: "Pure Kanjivaram Silk Saree", price: 14500, original: 19500, discount: 25, rating: 4.9, sold: 132, img: "/model_green_saree_1780037759680.png" },
  { name: "Handcrafted Gold-Plated Kadas", price: 4200, original: 5999, discount: 30, rating: 4.8, sold: 114, img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=400&auto=format&fit=crop" },
  { name: "Delicate Dailywear 22K Gold Chain", price: 8900, original: 11999, discount: 25, rating: 4.7, sold: 98, img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=400&auto=format&fit=crop" },
  { name: "Authentic Banarasi Silk Saree", price: 12500, original: 17500, discount: 28, rating: 4.9, sold: 92, img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400&auto=format&fit=crop" },
  { name: "Temple Heritage Choker Set", price: 18500, original: 24999, discount: 26, rating: 4.8, sold: 76, img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=400&auto=format&fit=crop" },
  { name: "Polki Diamond Embellished Kada", price: 6500, original: 8999, discount: 27, rating: 4.7, sold: 81, img: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=400&auto=format&fit=crop" },
];

const COLLECTIONS = [
  {
    label: "Wedding Edit",
    sub: "For your big day",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9973E]">
        <circle cx="8" cy="12" r="6" fill="#C9973E" opacity="0.1"/>
        <circle cx="16" cy="12" r="6" fill="#C9973E" opacity="0.1"/>
      </svg>
    )
  },
  {
    label: "Festive Edit",
    sub: "Celebrate in style",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9973E]">
        <path d="M12 2S9 6 9 9a3 3 0 0 0 6 0c0-3-3-7-3-7z" fill="#C9973E" opacity="0.2"/>
        <path d="M12 2v6"/>
        <path d="M22 17a10 10 0 0 1-20 0c0-2.5 2-5 5-5h6c3 0 5 2.5 5 5z"/>
        <path d="M6 14v2M18 14v2M12 12v3"/>
      </svg>
    )
  },
  {
    label: "Everyday Edit",
    sub: "Elegance daily",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9973E]">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 1.5 6.5-2.8 11.2A7 7 0 0 1 11 20z" fill="#C9973E" opacity="0.2"/>
        <path d="M9.8 6.1c.2 3.5 2 6.4 4.7 8.4M19 2s-3.5 6-8 18"/>
      </svg>
    )
  },
  {
    label: "Gifts & Hampers",
    sub: "Perfect for loved ones",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9973E]">
        <rect x="3" y="8" width="18" height="13" fill="#C9973E" opacity="0.1"/>
        <path d="M12 22V8M3 12h18M12 8a3 3 0 1 0-3-3M12 8a3 3 0 1 1 3-3"/>
      </svg>
    )
  },
  {
    label: "Customised Jewellery",
    sub: "Made just for you",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9973E]">
        <path d="M5 3a7 7 0 0 0 14 0" fill="#C9973E" opacity="0.1"/>
        <path d="M12 10v4M10 14h4M8 9.5v2M16 9.5v2"/>
        <circle cx="12" cy="17" r="1.5" fill="#C9973E"/>
      </svg>
    )
  },
];

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistedLocal, setWishlistedLocal] = useState<number[]>([]);

  const { user, isAuthenticated, logout, role } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { wishlistIds, fetchWishlist, toggleWishlist, isWishlisted } = useWishlistStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const router = useRouter();

  // Auto-advance hero carousel
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
      fetchCart();
    }
  }, [isAuthenticated, fetchWishlist, fetchCart]);

  useEffect(() => {
    async function loadTrending() {
      try {
        setLoading(true);
        // Try fetching featured products
        const { data: res } = await productApi.list({ is_featured: true, page_size: 6 });
        let items = res.items || [];
        
        // If no featured products, fetch latest products
        if (items.length === 0) {
          const { data: latestRes } = await productApi.list({ page_size: 6 });
          items = latestRes.items || [];
        }

        if (items.length > 0) {
          const mapped = items.map((p: Product) => {
            const disc = p.compare_price
              ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
              : 0;
            return {
              id: p.id,
              name: p.name,
              price: p.price,
              original: p.compare_price || p.price,
              discount: disc,
              rating: p.rating_avg || 4.5,
              sold: p.total_sold || Math.floor((p.id * 17) % 50) + 10,
              img: getProductImage(p.images),
            };
          });
          setTrending(mapped);
        } else {
          setTrending(TRENDING);
        }
      } catch (err) {
        console.error("Failed to load trending products:", err);
        setTrending(TRENDING);
      } finally {
        setLoading(false);
      }
    }
    loadTrending();
  }, []);

  const prev = () => setSlide(s => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = () => setSlide(s => (s + 1) % HERO_SLIDES.length);

  const handleToggleWish = async (e: React.MouseEvent, item: any, index: number) => {
    e.preventDefault();
    if (!item.id) {
      // Local state fallback for mock static products
      setWishlistedLocal(w => w.includes(index) ? w.filter(x => x !== index) : [...w, index]);
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please sign in to save to wishlist");
      return;
    }

    try {
      const added = await toggleWishlist(item.id);
      toast.success(added ? "Saved to wishlist!" : "Removed from wishlist");
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleSearchSubmit = () => {
    let url = "/customer/products";
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }
    
    if (selectedCategory !== "All Categories") {
      const slug = selectedCategory.toLowerCase() === "silk sarees" ? "sarees" : selectedCategory.toLowerCase();
      params.append("category", slug);
    }
    
    const queryStr = params.toString();
    router.push(queryStr ? `${url}?${queryStr}` : url);
  };

  const dashboardLink = role ? `/${role}/dashboard` : "/auth/login";
  const cartCount = cart?.item_count || 0;

  const SkeletonCard = () => (
    <div className="bg-white border border-[#E8D5B0] animate-pulse flex flex-col h-full rounded-lg overflow-hidden">
      <div className="aspect-square bg-[#FAF6EE] relative w-full animate-pulse" />
      <div className="p-2.5 flex flex-col gap-2 flex-1">
        <div className="h-3 bg-[#E8D5B0] rounded w-3/4" />
        <div className="h-3 bg-[#E8D5B0] rounded w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="h-4 bg-[#E8D5B0] rounded w-12" />
          <div className="h-4 bg-[#E8D5B0] rounded w-12" />
        </div>
        <div className="h-3 bg-[#E8D5B0] rounded w-20 mt-1" />
      </div>
    </div>
  );

  const cur = HERO_SLIDES[slide];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EE]">
      {/* ── 1. Top Info Bar (Absolute Top, matches target reference) ───────── */}
      <div className="bg-[#4A0F0F] text-[#E8D5B0] py-2 px-4 border-b border-[#5A1212]">
        <div className="max-w-7xl mx-auto flex items-center justify-center lg:justify-between text-[9px] lg:text-[10px] font-bold tracking-widest uppercase">
          {/* Mobile centered simple announcement */}
          <div className="flex lg:hidden items-center justify-center text-center">
            <span>✦ FREE SHIPPING ABOVE ₹1999 &amp; 100% SECURE PAYMENTS ✦</span>
          </div>
          {/* Desktop full bar */}
          <div className="hidden lg:flex items-center gap-6">
            <span className="flex items-center gap-1.5"><Truck size={12} className="text-[#C9973E]" /> Free Shipping on Orders Above ₹1999</span>
            <span className="text-[#3A1F1F]">|</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#C9973E]" /> 100% Secure Payments</span>
            <span className="text-[#3A1F1F]">|</span>
            <span className="flex items-center gap-1.5"><RefreshCw size={12} className="text-[#C9973E]" /> Easy Returns</span>
          </div>
          <div className="hidden lg:flex items-center gap-4 text-[10px]">
            <a href="#" className="hover:text-[#C9973E] transition-colors">Track Order</a>
            <span className="text-[#3A1F1F]">|</span>
            <a href="#" className="hover:text-[#C9973E] transition-colors">Help Center</a>
            <span className="text-[#3A1F1F]">|</span>
            <a href="/auth/signup?role=merchant" className="hover:text-[#C9973E] transition-colors">Sell With Us</a>
          </div>
        </div>
      </div>

      {/* ── 2. Main Branding, Search & Labeled Icons Row ──────────────────── */}
      <header className="bg-white border-b border-[#E8D5B0] py-4 px-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Serif Brand Logo (Target reference styled) */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 border border-[#C9973E] rounded-full flex items-center justify-center
              text-[#C9973E] font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>R</div>
            <div className="flex flex-col">
              <span className="text-[#4A0F0F] font-extrabold text-lg tracking-[0.15em] leading-none" style={{ fontFamily: "Georgia, serif" }}>
                RATNAMAYURI
              </span>
              <span className="text-[#C9973E] text-[9px] tracking-[0.2em] font-bold mt-1">
                JEWELLERY & SAREES
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-2xl bg-white border border-[#C9973E] rounded-md h-11 relative">
            <input
              type="text"
              placeholder="Search for jewellery, sarees and more..."
              className="flex-1 px-4 py-2 text-xs text-[#4A0F0F] placeholder-[#9A7070] focus:outline-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            />
            <div className="h-5 w-[1px] bg-[#E8D5B0]" />
            <div 
              className="relative px-3 flex items-center text-xs text-[#7A5C5C] font-semibold cursor-pointer select-none h-full"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            >
              <span>{selectedCategory}</span>
              <ChevronRight size={12} className={`ml-1 text-[#C9973E] transition-transform duration-200 ${categoryDropdownOpen ? "rotate-90" : ""}`} />
              
              {/* Category Dropdown List */}
              {categoryDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E8D5B0] shadow-lg z-50 py-1 rounded-md overflow-hidden text-left">
                  {["All Categories", "Silk Sarees", "Bangles", "Chains", "Jewellery"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(cat);
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-garamond text-[#4A0F0F] hover:bg-[#FAF6EE] transition-colors
                        ${selectedCategory === cat ? "bg-[#FAF6EE] font-bold text-[#6B1A1A]" : ""}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearchSubmit}
              className="bg-[#6B1A1A] hover:bg-[#8B2020] text-white w-12 h-full flex items-center justify-center transition-colors flex-shrink-0 rounded-r-md"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Right: Labeled outline Icons (Wishlist, Cart, Account) */}
          <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
            {/* Wishlist */}
            <Link href="/customer/wishlist" className="flex flex-col items-center group relative">
              <div className="relative">
                <Heart size={20} className="text-[#4A0F0F] group-hover:text-[#6B1A1A] transition-colors" />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#6B1A1A] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistIds.length}
                  </span>
                )}
              </div>
              <span className="hidden md:inline-block text-[10px] font-bold tracking-wider text-[#7A5C5C] mt-1 group-hover:text-[#6B1A1A] transition-colors">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link href="/customer/cart" className="flex flex-col items-center group relative">
              <div className="relative">
                <ShoppingBag size={20} className="text-[#4A0F0F] group-hover:text-[#6B1A1A] transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#6B1A1A] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline-block text-[10px] font-bold tracking-wider text-[#7A5C5C] mt-1 group-hover:text-[#6B1A1A] transition-colors">Cart</span>
            </Link>

            {/* Account */}
            <div className="relative flex flex-col items-center group cursor-pointer" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <User size={20} className="text-[#4A0F0F] group-hover:text-[#6B1A1A] transition-colors" />
              <span className="hidden md:inline-block text-[10px] font-bold tracking-wider text-[#7A5C5C] mt-1 group-hover:text-[#6B1A1A] transition-colors">
                {isAuthenticated ? (user?.full_name?.split(" ")[0] || "Account") : "Account"}
              </span>
              
              {/* Account Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-[110%] w-48 bg-white border border-[#E8D5B0] shadow-lg z-50 py-1">
                  {isAuthenticated ? (
                    <>
                      <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs font-bold text-[#4A0F0F] hover:bg-[#FAF6EE] transition-colors">
                        Dashboard
                      </Link>
                      <Link href="/customer/profile" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs font-bold text-[#4A0F0F] hover:bg-[#FAF6EE] transition-colors">
                        Profile
                      </Link>
                      {user?.is_promoter && (
                        <Link href="/promoter/dashboard" onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs font-bold text-[#C9973E] hover:bg-[#FAF6EE] transition-colors">
                          Affiliate Portal
                        </Link>
                      )}
                      <div className="border-t border-[#E8D5B0]" />
                      <button onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link href="/auth/login" onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-xs font-bold text-[#4A0F0F] hover:bg-[#FAF6EE] transition-colors">
                      Sign In / Register
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar Row (Visible only on mobile viewports) */}
      <div className="block md:hidden bg-white px-4 py-2 border-b border-[#E8D5B0]">
        <div className="flex items-center bg-[#FAF6EE] border border-[#C9973E] rounded-md h-10 px-3">
          <Search size={14} className="text-[#9A7070] mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search jewellery, sarees..."
            className="flex-1 text-xs text-[#4A0F0F] placeholder-[#9A7070] bg-transparent focus:outline-none h-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
          />
          <button 
            onClick={handleSearchSubmit}
            className="font-cinzel text-[10px] font-bold text-[#6B1A1A] border-l border-[#E8D5B0] pl-2 hover:text-[#8B2020] transition-colors flex-shrink-0 h-full flex items-center"
          >
            SEARCH
          </button>
        </div>
      </div>

      {/* ── 3. Sub-Navigation Bar (HOME, JEWELLERY, SAREES...) with Offers Zone ── */}
      <div className="bg-[#FAF6EE] border-b border-[#E8D5B0] py-2 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <ul className="flex items-center gap-8">
            {[
              { href: "/", label: "HOME", active: true },
              { href: "/customer/products?category=sarees", label: "SILK SAREES" },
              { href: "/customer/products?search=bangles", label: "HANDCRAFTED BANGLES" },
              { href: "/customer/products?search=chain", label: "GOLD CHAINS" },
              { href: "/customer/products?category=jewellery", label: "JEWELLERY" },
              { href: "/customer/products?is_featured=true", label: "COLLECTIONS" },
              { href: "/customer/products", label: "NEW ARRIVALS" },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`font-semibold tracking-wider text-xs pb-1 transition-all ${
                    link.active
                      ? "text-[#6B1A1A] border-b-2 border-[#6B1A1A]"
                      : "text-[#4A0F0F] hover:text-[#6B1A1A] hover:border-b-2 hover:border-[#6B1A1A]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          
          <Link
            href="/customer/products?discount_min=10"
            className="flex items-center gap-2 bg-[#5C1010] hover:bg-[#6B1A1A] text-white px-5 py-2 text-xs font-extrabold tracking-widest transition-all"
          >
            {/* Outline price tag icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9973E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9973E]">
              <path d="M7.5 10.5h.01"/>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 7.6-4.7 8.38 8.38 0 0 1 3.8.9L21 3z"/>
            </svg>
            OFFERS ZONE
          </Link>
        </div>
      </div>

      <main className="flex-1">

        {/* ── Hero Carousel ─────────────────────────────────────────────────── */}
        {/* Full-bleed rectangular banner carousel — matches reference exactly */}
        <section className="relative w-full overflow-hidden" style={{ height: "clamp(260px, 45vw, 580px)" }}>

          {/* Full bleed image background */}
          <div className="relative w-full h-full">
            <img
              key={cur.img}
              src={cur.img}
              alt={cur.tag}
              className="w-full h-full object-cover object-right transition-opacity duration-700"
              style={{ display: "block" }}
            />

            {/* Seamless blended text overlay on the left */}
            <div
              className="absolute inset-y-0 left-0 w-[50%] sm:w-[52%] md:w-[55%] flex flex-col justify-center transition-all duration-700"
              style={{
                background: `linear-gradient(to right, ${
                  cur.bg.includes("#FAF0E4") ? "#FAF0E4 70%, rgba(250,240,228,0.85) 85%, transparent 100%" :
                  cur.bg.includes("#F5E8F0") ? "#F5EAE2 70%, rgba(245,234,226,0.85) 85%, transparent 100%" :
                  "#EAF0F5 70%, rgba(234,240,245,0.85) 85%, transparent 100%"
                })`,
                padding: "0 4% 0 6%"
              }}
            >
              {/* Gold tag line: — TIMELESS BEAUTY. — */}
              <p
                className="flex items-center gap-3 font-semibold tracking-widest mb-5 transition-all duration-500"
                style={{ color: "#C9973E", fontSize: "11px" }}
              >
                <span style={{ display: "inline-block", width: "28px", height: "1px", backgroundColor: "#C9973E" }} />
                {cur.tag}
                <span style={{ display: "inline-block", width: "28px", height: "1px", backgroundColor: "#C9973E" }} />
              </p>

              {/* Main heading — large bold serif, very close to reference */}
              <h1
                className="font-bold leading-[1.1] mb-3 lg:mb-5 transition-all duration-500"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "clamp(1.1rem, 5vw, 3.6rem)",
                  color: "#1a0505",
                  letterSpacing: "-0.5px",
                }}
              >
                {cur.heading.map((line, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {line}
                    {i === cur.heading.length - 1 && (
                      <span style={{ color: "#C9973E" }}>{cur.highlight}</span>
                    )}
                  </span>
                ))}
              </h1>

              {/* Subtitle */}
              <p
                className="mb-9 transition-all duration-500"
                style={{ color: "#5a4040", fontSize: "clamp(0.9rem, 1.2vw, 1rem)", fontWeight: 400 }}
              >
                {cur.sub}
              </p>

              {/* CTA Button — dark maroon, sharp corners */}
              <Link
                href={cur.href}
                className="self-start font-bold tracking-widest transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  backgroundColor: "#5C1010",
                  color: "#ffffff",
                  padding: "clamp(8px, 1.5vw, 14px) clamp(16px, 3vw, 32px)",
                  fontSize: "clamp(10px, 1.2vw, 13px)",
                  letterSpacing: "0.12em",
                  display: "inline-block",
                }}
              >
                {cur.cta}
              </Link>
            </div>
          </div>

          {/* ── Left Arrow — floats absolute on left edge */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center
              bg-white hover:bg-gray-50 shadow transition-all duration-200"
            style={{ left: "15px", width: "38px", height: "38px", borderRadius: "0px" }}
          >
            <ChevronLeft size={16} style={{ color: "#1a0505" }} />
          </button>

          {/* ── Right Arrow — floats absolute on right edge */}
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center
              bg-white hover:bg-gray-50 shadow transition-all duration-200"
            style={{ right: "15px", width: "38px", height: "38px", borderRadius: "0px" }}
          >
            <ChevronRight size={16} style={{ color: "#1a0505" }} />
          </button>

          {/* ── Dots — positioned absolutely over text section */}
          <div
            className="absolute z-30 flex items-center gap-2"
            style={{ bottom: "24px", left: "20%", transform: "translateX(-50%)" }}
          >
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === slide ? "24px" : "10px",
                  height: "10px",
                  backgroundColor: i === slide ? "#6B1A1A" : "rgba(107,26,26,0.3)",
                }}
              />
            ))}
          </div>
        </section>


        {/* ── Category Icons ────────────────────────────────────────────────── */}
        <section className="bg-white py-8 border-b border-[#E8D5B0]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-x-2 gap-y-6 lg:gap-4">
              {CATEGORIES.map((cat) => (
                <Link key={cat.label} href={cat.href}
                  className="flex flex-col items-center gap-2 group">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[#E8D5B0]
                    group-hover:border-[#C9973E] transition-all overflow-hidden bg-[#FAF6EE] shadow-sm
                    group-hover:shadow-md">
                    <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <p className="text-[#1a0505] text-[11px] font-bold tracking-wide text-center
                    group-hover:text-[#6B1A1A] transition-colors">
                    {cat.label.toUpperCase()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust Badges ──────────────────────────────────────────────────── */}
        <section className="bg-[#FAF6EE] py-5 border-b border-[#E8D5B0]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {TRUST_BADGES.map((b) => (
                <div key={b.title} className="flex items-center gap-3">
                  <div className="flex-shrink-0">{b.icon}</div>
                  <div>
                    <p className="text-[#1a0505] font-bold text-xs tracking-wide">{b.title}</p>
                    <p className="text-[#7a5c5c] text-[11px]">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Promotional Banners (3 cards) ─────────────────────────────────── */}
        <section className="py-5 sm:py-6 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

            {/* Card 1 — Saree Collection */}
            <div className="relative bg-[#5A1212] border border-[#3A1F1F] overflow-hidden p-6 flex flex-col justify-between min-h-[160px] sm:min-h-[180px] shadow-sm hover:shadow-md transition-shadow rounded-lg">
              <div className="relative z-10 my-auto">
                <p className="text-[#C9973E] font-bold text-xs tracking-widest mb-1">ROYAL SAREES</p>
                <p className="text-white text-[10px] tracking-[0.2em] font-semibold mb-1">UP TO</p>
                <p className="text-white font-extrabold text-4xl leading-none mb-4"
                  style={{ fontFamily: "Georgia, serif" }}>40% OFF</p>
                <Link href="/customer/products?category=sarees"
                  className="inline-block bg-white text-[#5A1212] text-[11px] font-extrabold tracking-widest px-5 py-2.5
                    hover:bg-[#FAF6EE] transition-colors rounded-md shadow-sm">
                  SHOP SAREES
                </Link>
              </div>
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300&auto=format&fit=crop"
                alt="Sarees"
                className="absolute right-0 bottom-0 h-full w-44 object-cover object-center mix-blend-lighten opacity-80"
              />
            </div>

            {/* Card 2 — Bangles Collection */}
            <div className="relative bg-[#FAF0E4] border border-[#E8D5B0] overflow-hidden p-6 flex flex-col justify-between min-h-[160px] sm:min-h-[180px] shadow-sm hover:shadow-md transition-shadow rounded-lg">
              <div className="relative z-10 my-auto">
                <p className="text-[#5A1212] font-bold text-xs tracking-widest mb-1">HERITAGE BANGLES</p>
                <p className="text-[#5A1212]/80 text-[10px] tracking-[0.2em] font-semibold mb-1">UP TO</p>
                <p className="text-[#5A1212] font-extrabold text-4xl leading-none mb-4"
                  style={{ fontFamily: "Georgia, serif" }}>30% OFF</p>
                <Link href="/customer/products?search=bangles"
                  className="inline-block bg-[#5A1212] text-white text-[11px] font-extrabold tracking-widest px-5 py-2.5
                    hover:bg-[#7A1E1E] transition-colors rounded-md shadow-sm">
                  SHOP BANGLES
                </Link>
              </div>
              <img
                src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=300&auto=format&fit=crop"
                alt="Bangles"
                className="absolute right-0 bottom-0 h-full w-44 object-cover object-center opacity-95"
              />
            </div>

            {/* Card 3 — Chains Collection */}
            <div className="relative bg-[#FAF6EE] border border-[#E8D5B0] overflow-hidden p-6 flex flex-col justify-between min-h-[160px] sm:min-h-[180px] shadow-sm hover:shadow-md transition-shadow rounded-lg">
              <div className="relative z-10 my-auto">
                <p className="text-[#5A1212] font-bold text-xs tracking-widest mb-1">GOLD CHAINS</p>
                <p className="text-[#4A0F0F] font-extrabold text-3xl leading-tight mb-4"
                  style={{ fontFamily: "Georgia, serif" }}>NEW RELEASES</p>
                <Link href="/customer/products?search=chain"
                  className="inline-block bg-[#5A1212] text-white text-[11px] font-extrabold tracking-widest px-5 py-2.5
                    hover:bg-[#7A1E1E] transition-colors rounded-md shadow-sm">
                  EXPLORE CHAINS
                </Link>
              </div>
              <img
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop"
                alt="Chains"
                className="absolute right-0 bottom-0 h-full w-40 object-cover object-center mix-blend-multiply opacity-90"
              />
            </div>
          </div>
        </section>

        {/* ── Trending Now ──────────────────────────────────────────────────── */}
        <section className="py-6 sm:py-8 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-[#1a0505] font-black text-lg sm:text-xl tracking-wide"
              style={{ fontFamily: "Georgia, serif" }}>TRENDING NOW</h2>
            <Link href="/customer/products"
              className="flex items-center gap-1 text-[#6B1A1A] text-xs font-bold tracking-widest hover:underline">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {loading ? (
              Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              trending.map((p, i) => {
                const isWish = p.id && isAuthenticated ? isWishlisted(p.id) : wishlistedLocal.includes(i);
                return (
                  <Link key={i} href={p.id ? `/customer/products/${p.id}` : "/customer/products"}
                    className="group bg-white border border-[#E8D5B0] hover:border-[#C9973E] hover:shadow-lg
                      transition-all duration-300 flex flex-col rounded-lg overflow-hidden">
                    <div className="relative overflow-hidden aspect-square bg-[#FAF6EE]">
                      <img src={p.img} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop"; }} />
                      <button
                        onClick={(e) => handleToggleWish(e, p, i)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center">
                        <Heart size={13} className={isWish ? "fill-[#6B1A1A] text-[#6B1A1A]" : "text-[#9a7070]"} />
                      </button>
                      {p.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-[#6B1A1A] text-white text-[10px] font-bold px-1.5 py-0.5">
                          {p.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-2.5 flex flex-col gap-1">
                      <p className="text-[#1a0505] text-xs font-semibold leading-tight line-clamp-2">{p.name}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#1a0505] text-sm font-black">&#8377;{p.price.toLocaleString()}</span>
                        {p.original > p.price && (
                          <span className="text-[#9a7070] text-xs line-through">&#8377;{p.original.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="fill-[#C9973E] text-[#C9973E]" />
                        <span className="text-[10px] font-bold text-[#3a2020]">{p.rating}</span>
                        <span className="text-[10px] text-[#9a7070]">({p.sold} Sold)</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* ── Shop by Collection ────────────────────────────────────────────── */}
        <section className="py-6 sm:py-8 px-4 max-w-7xl mx-auto border-t border-[#E8D5B0]">
          <h2 className="text-[#1a0505] font-black text-lg sm:text-xl tracking-wide mb-5 sm:mb-6"
            style={{ fontFamily: "Georgia, serif" }}>SHOP BY COLLECTION</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {COLLECTIONS.map((c) => (
              <Link key={c.label} href="/customer/products"
                className="group flex flex-col items-center gap-3 p-4 sm:p-6 bg-white border border-[#E8D5B0]
                  hover:border-[#C9973E] hover:shadow-md transition-all duration-300 text-center rounded-md">
                <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-[#C9973E] rounded-full flex items-center justify-center
                  bg-[#FAF6EE] text-2xl group-hover:scale-110 transition-transform duration-300">
                  {c.icon}
                </div>
                <div>
                  <p className="text-[#1a0505] font-bold text-[10px] sm:text-xs tracking-wide group-hover:text-[#6B1A1A] transition-colors">
                    {c.label.toUpperCase()}
                  </p>
                  <p className="text-[#9a7070] text-[10px] mt-0.5 hidden sm:block">{c.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Trusted by Thousands stats bar ────────────────────────────────── */}
        <section className="bg-[#FAF0E4] border-y border-[#E8D5B0] py-5 sm:py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
              {[
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  ),
                  stat: "50K+",
                  label: "Happy Customers"
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ),
                  stat: "4.8/5",
                  label: "Average Rating"
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  ),
                  stat: "Assured",
                  label: "Quality"
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"/>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  ),
                  stat: "Pan India",
                  label: "Delivery"
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ),
                  stat: "Secure &",
                  label: "Encrypted Checkout"
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-[#6B1A1A] font-black text-base">{item.stat}</p>
                    <p className="text-[#7a5c5c] text-xs">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────────────────── */}
        <section className="py-8 sm:py-10 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-[#1a0505] font-black text-lg sm:text-xl tracking-wide"
              style={{ fontFamily: "Georgia, serif" }}>WHAT OUR CUSTOMERS SAY</h2>
            <div className="w-16 h-0.5 bg-[#C9973E] mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: "Ananya Sharma", loc: "Jaipur", text: "The Kanjivaram silk I ordered for my wedding was beyond expectations. The zari work is exquisite and the fabric feels truly royal.", stars: 5 },
              { name: "Meera Kapoor", loc: "Bengaluru", text: "Finding jewellery that respects tradition while looking modern is rare. Ratnamayuri's collection hits that sweet spot perfectly.", stars: 5 },
              { name: "Priya Rai", loc: "Chennai", text: "The bespoke service was seamless. They understood my bridal vision and delivered a masterpiece I will cherish forever.", stars: 5 },
            ].map((t) => (
              <div key={t.name} className="bg-white border border-[#E8D5B0] p-5 sm:p-6 hover:shadow-md transition-shadow rounded-lg">
                <div className="flex mb-3">
                  {Array(t.stars).fill(0).map((_, i) => (
                    <Star key={i} size={14} className="fill-[#C9973E] text-[#C9973E]" />
                  ))}
                </div>
                <p className="text-[#3a2020] text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-[#E8D5B0]">
                  <div className="w-9 h-9 rounded-full bg-[#6B1A1A] flex items-center justify-center
                    text-white font-bold text-xs flex-shrink-0">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[#1a0505] font-bold text-xs">{t.name}</p>
                    <p className="text-[#9a7070] text-[11px]">{t.loc} · Verified Buyer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
