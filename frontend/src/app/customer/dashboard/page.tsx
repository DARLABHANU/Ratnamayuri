"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Package, User, Heart, ChevronRight, Loader2, CreditCard, Award, MessageSquare } from "lucide-react";
import { authApi, orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Order } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

export default function CustomerDashboard() {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { wishlistIds, fetchWishlist } = useWishlistStore();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    Promise.all([
      authApi.me().then((r) => setUser(r.data)),
      orderApi.list({ page: 1, page_size: 5 }).then((r) => setRecentOrders(r.data.items)),
      fetchCart(),
      fetchWishlist(),
    ]).finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );

  const stats = [
    { label: "Total Orders", value: recentOrders.length || "0", icon: Package, href: "/customer/orders" },
    { label: "Cart Items", value: cart?.item_count || "0", icon: ShoppingBag, href: "/customer/cart" },
    { label: "Wishlist Items", value: wishlistIds.length || "0", icon: Heart, href: "/customer/wishlist" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12">
      {/* Welcome */}
      <div className="mb-10">
        <span className="section-tag">MY ACCOUNT</span>
        <h1 className="font-cormorant text-4xl font-light text-brown">
          Welcome back, <em className="italic text-gold-700">{user?.full_name?.split(" ")[0] || ""}!</em>
        </h1>
        <p className="font-garamond text-muted mt-2">
          Account #{user?.account_number} · Member since {user ? formatDate(user.created_at) : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}
            className="card p-5 sm:p-6 flex sm:flex-col items-center sm:items-center gap-4 sm:gap-0 hover:border-gold-300 transition-all group">
            <Icon size={24} className="text-gold-500 sm:mx-auto sm:mb-3" />
            <div className="sm:text-center">
              <p className="font-cinzel text-xl sm:text-2xl text-brown group-hover:text-gold-700 transition-colors">{value}</p>
              <p className="font-garamond text-xs text-muted sm:mt-1">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cinzel text-sm tracking-widest text-brown">RECENT ORDERS</h2>
            <Link href="/customer/orders"
              className="font-cinzel text-xs tracking-wide text-gold-600 hover:text-gold-500 flex items-center gap-1">
              VIEW ALL <ChevronRight size={12} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="card p-10 text-center">
              <Package size={40} className="text-gold-200 mx-auto mb-3" />
              <p className="font-cormorant text-xl text-brown mb-1">No orders yet</p>
              <p className="font-garamond text-sm text-muted mb-4">Discover our exquisite collection</p>
              <Link href="/customer/products" className="btn-primary">SHOP NOW</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/customer/orders/${order.id}`}
                  className="card p-3 sm:p-4 flex items-center justify-between gap-3 hover:border-gold-300 transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-cinzel text-xs tracking-wide text-brown">#{order.order_number}</p>
                      <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="font-garamond text-xs text-muted">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <p className="font-cinzel text-sm text-brown">{formatPrice(order.total_amount)}</p>
                    <ChevronRight size={14} className="text-muted group-hover:text-gold-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-cinzel text-sm tracking-widest text-brown mb-4">QUICK LINKS</h2>
          <div className="space-y-2">
            {[
              { href: "/customer/profile", label: "My Profile", icon: User },
              { href: "/customer/orders", label: "All Orders", icon: Package },
              { href: "/customer/cart", label: "View Cart", icon: ShoppingBag },
              { href: "/customer/payments", label: "Payment History", icon: CreditCard },
              { href: "/customer/support", label: "Support Help & Tickets", icon: MessageSquare },
              ...(user?.is_promoter ? [{ href: "/promoter/dashboard", label: "Affiliate Portal", icon: Award }] : []),
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="card p-4 flex items-center gap-3 hover:border-gold-300 transition-all group">
                <Icon size={16} className="text-gold-500" />
                <span className="font-cinzel text-xs tracking-wide text-brown group-hover:text-gold-700 transition-colors">
                  {label}
                </span>
                <ChevronRight size={12} className="ml-auto text-muted group-hover:text-gold-500 transition-colors" />
              </Link>
            ))}
          </div>

          {/* Account info */}
          {user && (
            <div className="card p-4 mt-4 bg-ivory">
              <p className="font-cinzel text-xs tracking-widest text-muted mb-3">ACCOUNT INFO</p>
              <p className="font-garamond text-sm text-brown">{user.full_name}</p>
              <p className="font-garamond text-xs text-muted mt-1">{user.email}</p>
              {user.phone && <p className="font-garamond text-xs text-muted">{user.phone}</p>}
              <div className={`mt-2 inline-flex items-center gap-1 font-cinzel text-xs
                ${user.is_verified ? "text-green-600" : "text-yellow-600"}`}>
                <span>{user.is_verified ? "✓ Verified" : "⚠ Unverified"}</span>
              </div>
            </div>
          )}

          {/* Promoter CTA Card */}
          {user?.is_promoter && (
            <Link href="/promoter/dashboard" className="card p-4 mt-4 bg-gold-400/10 border-gold-300 flex flex-col justify-between hover:bg-gold-400/20 transition-all group">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Award size={16} className="text-gold-600 animate-pulse" />
                  <p className="font-cinzel text-xs tracking-widest text-brown font-bold">EARN COMMISSIONS</p>
                </div>
                <p className="font-garamond text-xs text-muted leading-relaxed">
                  Join our partner program, refer buyers, and earn stable commission payouts on Kanjivaram Sarees and premium Kundan jewelry referrals!
                </p>
              </div>
              <div className="flex items-center gap-1 font-cinzel text-[10px] text-gold-700 font-bold mt-3 group-hover:text-gold-900 transition-colors">
                <span>ENTER PORTAL</span>
                <ChevronRight size={10} />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
