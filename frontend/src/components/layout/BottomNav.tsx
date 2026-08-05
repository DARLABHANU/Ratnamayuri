"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, Heart, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";

// Only hide on internal staff/portal dashboards
const HIDDEN_PREFIXES = ["/admin", "/merchant", "/promoter", "/support", "/customer"];

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    match: (path: string) => path === "/",
  },
  {
    label: "Categories",
    href: "/customer/categories",
    icon: Grid3x3,
    match: (path: string) =>
      path.startsWith("/customer/categories") || path.startsWith("/customer/products"),
  },
  {
    label: "Wishlist",
    href: "/customer/wishlist",
    icon: Heart,
    match: (path: string) => path.startsWith("/customer/wishlist"),
    badge: "wishlist",
  },
  {
    label: "Cart",
    href: "/customer/cart",
    icon: ShoppingBag,
    match: (path: string) => path.startsWith("/customer/cart"),
    badge: "cart",
  },
  {
    label: "Profile",
    href: "/customer/profile",
    icon: User,
    match: (path: string) =>
      path.startsWith("/customer/profile") ||
      path.startsWith("/customer/orders") ||
      path.startsWith("/customer/dashboard") ||
      path.startsWith("/customer/support") ||
      path.startsWith("/auth/"),
    authHref: "/auth/login",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cart } = useCartStore();
  const { wishlistIds } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  // Hide ONLY on internal staff portals
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const cartCount = cart?.item_count || 0;
  const wishlistCount = wishlistIds.length || 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden"
      style={{
        background: "#FAF8F3",
        borderTop: "1.5px solid #E5E0D5",
        boxShadow: "0 -2px 24px rgba(13,38,25,0.10)",
      }}
    >
      <div className="flex items-stretch">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          const href =
            "authHref" in item && !isAuthenticated
              ? (item.authHref as string)
              : item.href;

          const badge =
            item.badge === "cart"
              ? cartCount
              : item.badge === "wishlist"
              ? wishlistCount
              : 0;

          return (
            <Link
              key={item.label}
              href={href}
              className="flex-1 flex flex-col items-center justify-center relative"
              style={{ minHeight: 62, paddingTop: 12, paddingBottom: 8 }}
            >
              {/* Active top pill */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 32, height: 3, background: "#0D2619" }}
                />
              )}

              {/* Icon + badge */}
              <span className="relative">
                <Icon
                  size={23}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  style={{ color: isActive ? "#0D2619" : "#9AA49E" }}
                />
                {badge > 0 && (
                  <span
                    className="absolute flex items-center justify-center rounded-full text-white font-bold"
                    style={{
                      top: -6,
                      right: -9,
                      minWidth: 17,
                      height: 17,
                      fontSize: 9.5,
                      background: "#0D2619",
                      paddingInline: 3,
                    }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                style={{
                  marginTop: 3,
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#0D2619" : "#9AA49E",
                  lineHeight: 1,
                  fontFamily: "var(--font-garamond, sans-serif)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* iOS home-indicator safe area */}
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}
