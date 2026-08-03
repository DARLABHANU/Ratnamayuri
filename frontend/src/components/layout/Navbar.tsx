"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag, Heart, User, LogOut, Settings, Award,
  Package, Search, ChevronDown, MapPin, Menu, X, Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { authApi } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, role } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { wishlistIds, fetchWishlist } = useWishlistStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    let url = `/customer/products?search=${encodeURIComponent(searchQuery.trim())}`;
    if (searchCategory !== "all") url += `&category=${encodeURIComponent(searchCategory)}`;
    router.push(url);
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const coupon = urlParams.get("coupon");
      if (coupon) {
        Cookies.set("affiliate_coupon", coupon, { expires: 7, sameSite: "Lax" });
        toast.success(`Referral discount code "${coupon.toUpperCase()}" activated!`);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) { fetchCart(); fetchWishlist(); }
  }, [isAuthenticated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !user) {
      authApi.me().then((res) => useAuthStore.getState().setUser(res.data)).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); router.push("/auth/login"); };
  const dashboardLink = role ? `/${role}/dashboard` : "/auth/login";
  const cartCount = cart?.item_count || 0;

  // Pages with their own mobile top bar matching design screenshots 1:1
  const HIDE_MOBILE_HEADER_PAGES = [
    "/customer/profile",
    "/customer/categories",
    "/customer/wishlist",
    "/customer/cart",
  ];
  const isMobileHeaderHidden = HIDE_MOBILE_HEADER_PAGES.some((p) => pathname.startsWith(p));

  return (
    <>
      {/* ─── Desktop Announcement Bar ─── */}
      <div className="hidden md:block bg-[#1E3A2B] text-[#E2EBE4] py-1.5 px-4 text-xs font-garamond">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span>Eco-Friendly</span><span>•</span>
            <span>Handmade with Love</span><span>•</span>
            <span>Supporting Small Artisans</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 font-medium text-emerald-200">
            <MapPin size={13} className="text-emerald-300" />
            <span>Delivering Across India</span>
          </div>
        </div>
      </div>

      {/* ─── Main Header ─── */}
      <header
        className={`bg-[#FAF8F3] border-b border-[#E5E0D5] sticky top-0 z-50 transition-all duration-200 ${
          isMobileHeaderHidden ? "hidden md:block" : ""
        } ${scrolled ? "shadow-sm bg-[#FAF8F3]/95 backdrop-blur-md" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8">

          {/* ════════════════════════════════════════════════ */}
          {/* MOBILE HEADER — ☰ | Logo Center | 🔔           */}
          {/* ════════════════════════════════════════════════ */}
          <div className="md:hidden">
            <div className="flex items-center justify-between py-3">
              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-9 h-9 flex items-center justify-center text-[#1C2E24] rounded-lg hover:bg-[#F0ECE5] transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              {/* Center Brand */}
              <Link href="/" className="flex flex-col items-center gap-0.5">
                {/* Lotus SVG */}
                <svg width="24" height="17" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2C10 5 7 6.5 4 6.5C4 10 7 13 12 15C17 13 20 10 20 6.5C17 6.5 14 5 12 2Z"
                    fill="#C9973E" fillOpacity="0.25" stroke="#C9973E" strokeWidth="1.3" strokeLinejoin="round"
                  />
                  <path
                    d="M12 5C10.8 7 8.5 8 6.5 8C6.5 10.5 8.5 12.5 12 14C15.5 12.5 17.5 10.5 17.5 8C15.5 8 13.2 7 12 5Z"
                    stroke="#B58A46" strokeWidth="1"
                  />
                </svg>
                <span className="font-cormorant text-[20px] font-bold tracking-tight text-[#1C2E24] leading-none">
                  Ratnamayuri
                </span>
                <span className="text-[9.5px] font-garamond text-[#7A6E5D] tracking-wide leading-none mt-0.5">
                  Handmade with Love ❤️
                </span>
              </Link>

              {/* Bell */}
              <button
                className="w-9 h-9 flex items-center justify-center text-[#1C2E24] rounded-lg hover:bg-[#F0ECE5] transition-colors"
                aria-label="Notifications"
              >
                <Bell size={22} />
              </button>
            </div>

            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pb-3">
              <div className="flex items-center w-full bg-white border border-[#E0DBD0] rounded-full overflow-hidden focus-within:border-[#1E3A2B] transition-all shadow-xs">
                <Search size={15} className="ml-4 text-[#8C8273] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for jewellery, sarees, dresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-3 text-xs font-garamond text-[#1C2E24] bg-transparent focus:outline-none placeholder-[#8C8273]"
                />
                <button type="submit" className="pr-4 text-[#8C8273] hover:text-[#1E3A2B] transition-colors">
                  <Search size={15} />
                </button>
              </div>
            </form>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* DESKTOP HEADER ROW                              */}
          {/* ════════════════════════════════════════════════ */}
          <div className="hidden md:flex items-center justify-between gap-4 py-3.5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#FAF8F3] border border-[#D8C7A5] flex items-center justify-center text-[#B58A46] shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4C10 7.5 7 9 4 9C4 13 7 16 12 19C17 16 20 13 20 9C17 9 14 7.5 12 4Z" fill="#C9973E" fillOpacity="0.2" stroke="#C9973E" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M12 7C10.8 9.5 8.5 10.5 6 10.5C6 13.5 8.5 15.5 12 17.5C15.5 15.5 18 13.5 18 10.5C15.5 10.5 13.2 9.5 12 7Z" stroke="#B58A46" strokeWidth="1.2"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-cormorant text-2xl font-bold tracking-tight text-[#1C2E24] leading-none">Ratnamayuri</span>
                <span className="text-[10px] font-garamond font-medium text-[#7A6E5D] tracking-wide mt-0.5">Handmade with Love 💕</span>
              </div>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center flex-1 max-w-xl mx-4">
              <div className="flex items-center w-full bg-white border border-[#D8D2C5] rounded-lg overflow-hidden shadow-xs focus-within:border-[#1E3A2B] focus-within:ring-1 focus-within:ring-[#1E3A2B] transition-all">
                <input
                  type="text"
                  placeholder="Search for jewellery, sarees, dresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C8273] bg-transparent focus:outline-none"
                />
                <div className="relative border-l border-[#E5E0D5] px-3 py-2 bg-[#FAF8F3]">
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="text-xs font-garamond font-medium text-[#4A4033] bg-transparent appearance-none pr-5 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="jewellery">Jewellery</option>
                    <option value="sarees">Sarees</option>
                    <option value="dresses">Dresses</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A6E5D] pointer-events-none" />
                </div>
                <button type="submit" className="bg-[#1E3A2B] hover:bg-[#2A4D3B] text-white p-2.5 px-3.5 transition-colors" aria-label="Search">
                  <Search size={15} />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
              <Link href="/customer/orders" className="hidden lg:flex flex-col items-center text-[#364B3E] hover:text-[#1E3A2B] transition-colors group">
                <Package size={19} className="group-hover:scale-105 transition-transform" />
                <span className="text-[10px] font-garamond font-medium mt-0.5">Track Order</span>
              </Link>
              <Link href="/customer/wishlist" className="hidden md:flex flex-col items-center text-[#364B3E] hover:text-[#1E3A2B] transition-colors relative group">
                <div className="relative">
                  <Heart size={19} className="group-hover:scale-105 transition-transform" />
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#1E3A2B] text-white font-garamond text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistIds.length > 0 ? wishlistIds.length : 3}
                  </span>
                </div>
                <span className="text-[10px] font-garamond font-medium mt-0.5 hidden sm:inline">Wishlist</span>
              </Link>
              <Link href="/customer/cart" className="hidden md:flex flex-col items-center text-[#364B3E] hover:text-[#1E3A2B] transition-colors relative group">
                <div className="relative">
                  <ShoppingBag size={19} className="group-hover:scale-105 transition-transform" />
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#1E3A2B] text-white font-garamond text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 0 ? cartCount : 2}
                  </span>
                </div>
                <span className="text-[10px] font-garamond font-medium mt-0.5 hidden sm:inline">Cart</span>
              </Link>

              {mounted && isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 text-xs font-garamond font-medium text-[#1E3A2B] border border-[#1E3A2B] px-3 py-1.5 rounded-full hover:bg-[#1E3A2B] hover:text-white transition-colors"
                  >
                    <User size={14} />
                    <span>{user?.full_name?.split(" ")[0] || "Account"}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E5E0D5] shadow-lg z-50 rounded-lg overflow-hidden py-1">
                      <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-garamond text-[#1C2E24] hover:bg-[#FAF8F3]"><User size={14} /> Dashboard</Link>
                      <Link href="/customer/support" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-garamond text-[#1C2E24] hover:bg-[#FAF8F3]"><Settings size={14} /> Support Help</Link>
                      {user?.is_promoter && (
                        <Link href="/promoter/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-garamond text-[#1E3A2B] font-semibold hover:bg-[#FAF8F3]"><Award size={14} /> Affiliate Portal</Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-garamond text-red-600 hover:bg-red-50 text-left"><LogOut size={14} /> Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="text-xs font-garamond font-medium text-[#1E3A2B] border border-[#1E3A2B] px-3.5 py-1.5 rounded-full hover:bg-[#1E3A2B] hover:text-white transition-colors">
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Bar */}
        <div className="hidden md:block bg-[#FAF8F3] border-t border-[#E5E0D5]">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-6 text-xs font-garamond font-medium">
              <div className="relative py-2">
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="bg-[#1E3A2B] hover:bg-[#2A4D3B] text-white font-garamond text-xs font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <span>Shop by Category</span>
                  <ChevronDown size={14} />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-[#E5E0D5] shadow-xl z-50 rounded-lg overflow-hidden py-2">
                    <Link href="/customer/products?category=jewellery" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-garamond text-[#1C2E24] hover:bg-[#FAF8F3] hover:text-[#1E3A2B] font-medium">✨ Jewellery Collection</Link>
                    <Link href="/customer/products?category=sarees" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-garamond text-[#1C2E24] hover:bg-[#FAF8F3] hover:text-[#1E3A2B] font-medium">🥻 Silk Sarees</Link>
                    <Link href="/customer/products?category=dresses" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-garamond text-[#1C2E24] hover:bg-[#FAF8F3] hover:text-[#1E3A2B] font-medium">👗 Designer Dresses</Link>
                    <div className="border-t border-[#E5E0D5] my-1" />
                    <Link href="/customer/products?is_featured=true" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-garamond text-[#1C2E24] hover:bg-[#FAF8F3]">New Arrivals</Link>
                    <Link href="/customer/products?sort_by=total_sold" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-garamond text-[#1C2E24] hover:bg-[#FAF8F3]">Bestsellers</Link>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 py-2">
                <Link href="/" className="bg-[#EAE5D9] text-[#1E3A2B] px-3.5 py-1.5 rounded-md font-semibold">Home</Link>
                <Link href="/customer/products?category=jewellery" className="text-[#364B3E] hover:text-[#1E3A2B] flex items-center gap-1 transition-colors">Jewellery <ChevronDown size={11} className="opacity-70" /></Link>
                <Link href="/customer/products?category=sarees" className="text-[#364B3E] hover:text-[#1E3A2B] flex items-center gap-1 transition-colors">Sarees <ChevronDown size={11} className="opacity-70" /></Link>
                <Link href="/customer/products?category=dresses" className="text-[#364B3E] hover:text-[#1E3A2B] flex items-center gap-1 transition-colors">Dresses <ChevronDown size={11} className="opacity-70" /></Link>
                <Link href="/customer/products?is_featured=true" className="text-[#364B3E] hover:text-[#1E3A2B] transition-colors">New Arrivals</Link>
                <Link href="/customer/products?sort_by=total_sold&sort_order=desc" className="text-[#364B3E] hover:text-[#1E3A2B] transition-colors">Bestsellers</Link>
                <Link href="/customer/products?sort_by=price&sort_order=asc" className="text-[#364B3E] hover:text-[#1E3A2B] transition-colors">Offers</Link>
                <Link href="/about" className="text-[#364B3E] hover:text-[#1E3A2B] transition-colors">About Us</Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════ */}
      {/* MOBILE SLIDE-IN DRAWER                          */}
      {/* ════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[9998] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />

          {/* Drawer Panel */}
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#FAF8F3] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E0D5] bg-[#0D2619]">
              <div>
                <span className="font-cormorant text-xl font-bold text-white">Ratnamayuri</span>
                <p className="text-[10px] text-emerald-300 font-garamond">Handmade with Love ❤️</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-white hover:text-emerald-300 transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto px-0 py-2">
              {[
                { href: "/", label: "🏠 Home" },
                { href: "/customer/products?category=jewellery", label: "✨ Jewellery" },
                { href: "/customer/products?category=sarees", label: "🥻 Sarees" },
                { href: "/customer/products?category=dresses", label: "👗 Dresses" },
                { href: "/customer/products?is_featured=true", label: "🌟 New Arrivals" },
                { href: "/customer/products?sort_by=total_sold", label: "🔥 Bestsellers" },
                { href: "/customer/orders", label: "📦 Track Order" },
                { href: "/contact", label: "📞 Contact Us" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-5 py-3.5 font-garamond text-sm text-[#1C2E24] hover:bg-[#F0ECE5] border-b border-[#F0ECE1] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Drawer Footer */}
            {mounted && (
              <div className="px-5 py-4 border-t border-[#E5E0D5]">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0D2619] flex items-center justify-center text-white font-cormorant font-bold text-lg">
                        {user?.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-garamond text-sm font-bold text-[#1C2E24] truncate">{user?.full_name}</p>
                        <p className="font-garamond text-xs text-[#8C9890] truncate">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="w-full bg-red-50 text-red-600 font-garamond text-xs font-semibold py-2.5 rounded-xl border border-red-200 mt-1"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-[#0D2619] text-white font-garamond text-xs font-semibold py-3 rounded-xl block text-center hover:bg-[#19402B] transition-colors"
                  >
                    Login / Signup
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
