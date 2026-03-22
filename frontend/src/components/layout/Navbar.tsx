"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Heart, Search, Menu, X, User, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { authApi } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout, role } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
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
    { href: "/customer/products", label: "New Arrivals" },
    { href: "/customer/products?category=jewellery", label: "Jewellery" },
    { href: "/customer/products?category=sarees", label: "Silk Sarees" },
    { href: "/customer/products?category=bridal", label: "Bridal" },
    { href: "/customer/products?is_featured=true", label: "Collections" },
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
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu button */}
            <button className="lg:hidden text-brown" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex flex-col items-start leading-none">
              <span className="font-cinzel text-lg lg:text-xl tracking-[0.3em] text-brown">
                RATNAMAYURI
              </span>
              <span className="font-garamond text-xs tracking-[0.3em] text-gold-500 hidden lg:block">
                LUXURY JEWELLERY & SAREES
              </span>
            </Link>

            {/* Desktop nav links */}
            <ul className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="font-cinzel text-xs tracking-widest text-brown hover:text-gold-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right icons */}
            <div className="flex items-center gap-3 lg:gap-4">
              <button className="hidden lg:flex text-brown hover:text-gold-600 transition-colors">
                <Search size={18} />
              </button>
              <button className="hidden lg:flex text-brown hover:text-gold-600 transition-colors">
                <Heart size={18} />
              </button>

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
              {isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 font-cinzel text-xs tracking-wide
                      bg-deep text-gold-300 px-3 py-2 hover:bg-brown transition-colors">
                    <User size={14} />
                    <span className="hidden lg:inline">{user?.full_name?.split(" ")[0] || "Account"}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gold-100
                      shadow-lg z-50 animate-fade-in">
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
                <Link href="/auth/login" className="btn-primary px-4 py-2 text-xs hidden lg:block">
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
            {!isAuthenticated && (
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
