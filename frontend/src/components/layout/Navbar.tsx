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
    { href: "/customer/products?category=sarees", label: "Silk Sarees" },
    { href: "/customer/products?search=bangles", label: "Bangles" },
    { href: "/customer/products?search=chain", label: "Gold Chains" },
    { href: "/customer/products?category=jewellery", label: "Jewellery" },
    { href: "/customer/products", label: "New Arrivals" },
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
        ${scrolled ? "bg-cream/97 shadow-sm backdrop-blur-sm" : "bg-cream"}
        border-b border-gold-100`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left: Mobile Menu Toggles & Desktop Navigation */}
            <div className="flex items-center">
              <button className="lg:hidden text-brown mr-4" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              
              <ul className="hidden lg:flex items-center gap-6">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="font-cinzel text-[11px] tracking-widest text-brown hover:text-gold-500 transition-colors uppercase">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Middle: Centered Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center">
              <Link href="/" className="flex items-center gap-1.5 justify-center leading-none">
                <div className="w-8 h-8 border border-gold-500 rounded-full flex items-center justify-center
                  text-gold-500 font-bold text-sm" style={{ fontFamily: "Georgia, serif" }}>R</div>
                <div className="flex flex-col text-left">
                  <span className="font-cormorant text-sm lg:text-base font-extrabold tracking-[0.15em] text-brown leading-none">
                    RATNAMAYURI
                  </span>
                  <span className="text-gold-500 text-[8px] lg:text-[9px] tracking-[0.2em] font-bold mt-0.5">
                    JEWELLERY & SAREES
                  </span>
                </div>
              </Link>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-3 lg:gap-4">
              <Link href="/customer/wishlist" className="relative text-brown hover:text-gold-600 transition-colors">
                <Heart size={20} />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-gold-500 text-deep
                    font-cinzel text-xs flex items-center justify-center rounded-full">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/customer/cart" className="relative text-brown hover:text-gold-600 transition-colors">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-gold-500 text-deep
                    font-cinzel text-xs flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {mounted && isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 font-cinzel text-xs tracking-wide
                      bg-deep text-gold-300 px-3 py-2 hover:bg-brown transition-colors rounded-md">
                    <User size={14} />
                    <span className="hidden lg:inline">{user?.full_name?.split(" ")[0] || "Account"}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gold-100
                      shadow-lg z-50 animate-fade-in rounded-md overflow-hidden">
                      <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 font-cinzel text-xs tracking-wide
                          text-brown hover:bg-cream transition-colors">
                        <Settings size={12} /> Dashboard
                      </Link>
                      <Link href="/customer/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 font-cinzel text-xs tracking-wide
                          text-brown hover:bg-cream transition-colors">
                        <User size={12} /> Profile
                      </Link>
                      {user?.is_promoter && (
                        <Link href="/promoter/dashboard" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 font-cinzel text-xs tracking-wide
                            text-brown hover:bg-cream transition-colors">
                          <Award size={12} className="text-gold-600" /> Affiliate Portal
                        </Link>
                      )}
                      <div className="border-t border-gold-100" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 font-cinzel text-xs
                          tracking-wide text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={12} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="btn-primary px-4 py-2.5 text-xs hidden lg:block">
                  SIGN IN
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gold-100 px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block font-cinzel text-xs tracking-widest text-brown py-2 border-b border-gold-50">
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
      </nav>
    </>
  );
}
