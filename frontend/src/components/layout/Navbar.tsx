"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Heart, Menu, X, User, LogOut, Settings, Award } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { authApi } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout, role } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { wishlistIds, fetchWishlist } = useWishlistStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/customer/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setMobileOpen(false);
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
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
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

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const dashboardLink = role ? `/${role}/dashboard` : "/auth/login";
  const cartCount = cart?.item_count || 0;

  const navLinks = [
    { href: "/customer/products?category=sarees", label: "Sarees" },
    { href: "/customer/products?category=jewellery", label: "Jewellery" },
    { href: "/customer/products?category=bridal", label: "Bridal Collection" },
    { href: "/customer/products?is_featured=true", label: "New Arrivals" },
    { href: "/customer/products?sort_by=total_sold&sort_order=desc", label: "Best Sellers" },
    { href: "/customer/products?subcategory=gift-sets", label: "Gift Collection" },
    { href: "/customer/products?subcategory=festival", label: "Festival Collection" },
    { href: "/customer/products?sort_by=price&sort_order=asc", label: "Offers" },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-deep text-center py-2 px-4">
        <p className="font-cinzel text-xs tracking-widest text-gold-300">
          ✦ FREE SHIPPING ON ORDERS ABOVE ₹2,999 &nbsp;|&nbsp; USE CODE <span className="text-gold-400">WELCOME15</span> FOR 15% OFF ✦
        </p>
      </div>

      <nav className={`sticky top-0 z-50 transition-all duration-300
        ${scrolled ? "bg-cream/98 shadow-md backdrop-blur-sm" : "bg-cream"}
        border-b border-gold-100`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* ── Row 1: Logo & Actions ── */}
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Left: Mobile Toggle & Search */}
            <div className="flex items-center gap-3">
              <button className="lg:hidden text-brown" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>

              {/* Desktop Search Bar */}
              <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="font-garamond text-xs px-3.5 py-1.5 pl-8 border border-gold-200 bg-cream/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-full w-48 lg:w-60 transition-all"
                />
                <button type="submit" className="absolute left-2.5 text-gold-600 hover:text-gold-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>
              </form>
            </div>

            {/* Middle: Brand Logo (Centered, No Overlap) */}
            <Link href="/" className="flex items-center gap-2 leading-none py-1">
              <div className="w-8 h-8 lg:w-9 lg:h-9 border border-gold-500 rounded-full flex items-center justify-center
                text-gold-500 font-bold text-sm lg:text-base flex-shrink-0" style={{ fontFamily: "Georgia, serif" }}>R</div>
              <div className="flex flex-col text-left">
                <span className="font-cormorant text-base lg:text-lg font-extrabold tracking-[0.18em] text-brown leading-none">
                  RATNAMAYURI
                </span>
                <span className="text-gold-500 text-[8px] lg:text-[9px] tracking-[0.2em] font-bold mt-0.5">
                  JEWELLERY &amp; SAREES
                </span>
              </div>
            </Link>

            {/* Right: Wishlist, Cart & Account */}
            <div className="flex items-center gap-3 lg:gap-5 flex-shrink-0">
              <Link href="/customer/wishlist" className="relative text-brown hover:text-gold-600 transition-colors p-1" title="Wishlist">
                <Heart size={20} />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 text-deep
                    font-cinzel text-[10px] font-bold flex items-center justify-center rounded-full">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/customer/cart" className="relative text-brown hover:text-gold-600 transition-colors p-1" title="Shopping Cart">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 text-deep
                    font-cinzel text-[10px] font-bold flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {mounted && isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 font-cinzel text-xs tracking-wide
                      bg-deep text-gold-300 px-3 py-1.5 hover:bg-brown transition-colors rounded-md">
                    <User size={13} />
                    <span className="hidden sm:inline">{user?.full_name?.split(" ")[0] || "Account"}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gold-100
                      shadow-lg z-50 animate-fade-in rounded-md overflow-hidden">
                      <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 font-cinzel text-xs tracking-wide
                          text-brown hover:bg-ivory transition-colors border-b border-gold-50">
                        <User size={12} /> Dashboard
                      </Link>
                      <Link href="/customer/support" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 font-cinzel text-xs tracking-wide
                          text-brown hover:bg-ivory transition-colors border-b border-gold-50">
                        <Settings size={12} /> Support Help
                      </Link>
                      {user?.is_promoter && (
                        <Link href="/promoter/dashboard" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 font-cinzel text-xs tracking-wide
                            text-gold-600 hover:bg-gold-50 transition-colors border-b border-gold-50">
                          <Award size={12} className="text-gold-500" /> Affiliate Portal
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 font-cinzel text-xs
                          tracking-wide text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={12} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="btn-primary px-4 py-2 text-xs">
                  SIGN IN
                </Link>
              )}
            </div>
          </div>

          {/* ── Row 2: Dedicated Category Navigation Links ── */}
          <div className="hidden lg:block border-t border-gold-100/70 py-2.5">
            <ul className="flex items-center justify-center gap-6 xl:gap-8 flex-wrap">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="font-cinzel text-[11px] font-semibold tracking-[0.12em] text-brown hover:text-gold-600 transition-colors uppercase">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="lg:hidden bg-white border-t border-gold-100 px-4 py-4 space-y-3">
              {/* Mobile Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex items-center relative mb-4">
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full font-garamond text-xs px-3 py-2 pl-8 border border-gold-200 bg-cream/40 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-full"
                />
                <button type="submit" className="absolute left-2.5 text-gold-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>
              </form>

              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-cinzel text-xs tracking-widest text-brown py-2 border-b border-gold-50 uppercase">
                  {link.label}
                </Link>
              ))}
              {mounted && isAuthenticated && (
                <>
                  <Link href={dashboardLink}
                    onClick={() => setMobileOpen(false)}
                    className="block font-cinzel text-xs tracking-widest text-brown py-2 border-b border-gold-50">
                    MY ACCOUNT
                  </Link>
                  <Link href="/customer/support"
                    onClick={() => setMobileOpen(false)}
                    className="block font-cinzel text-xs tracking-widest text-brown py-2 border-b border-gold-50">
                    SUPPORT HELP
                  </Link>
                  {user?.is_promoter && (
                    <Link href="/promoter/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 font-cinzel text-xs tracking-widest text-gold-600 py-2 border-b border-gold-50">
                      <Award size={13} className="text-gold-500" />
                      AFFILIATE PORTAL
                    </Link>
                  )}
                </>
              )}
              {mounted && !isAuthenticated && (
                <Link href="/auth/login" className="btn-primary block text-center mt-4"
                  onClick={() => setMobileOpen(false)}>
                  SIGN IN
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
