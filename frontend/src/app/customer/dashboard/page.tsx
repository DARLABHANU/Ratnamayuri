"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Package, Heart, ChevronRight, Loader2, User as UserIcon } from "lucide-react";
import { authApi, orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Order } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";

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
    ]).catch(() => {}).finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0D2619]" size={32} />
      </div>
    );
  }

  const stats = [
    { label: "Total Orders", value: recentOrders.length || "0", icon: Package, href: "/customer/orders" },
    { label: "Cart Items", value: cart?.item_count || "0", icon: ShoppingBag, href: "/customer/cart" },
    { label: "Wishlist Items", value: wishlistIds.length || "0", icon: Heart, href: "/customer/wishlist" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-[#1C2E24] font-garamond px-4 md:px-6 py-6">
      {/* Welcome Header */}
      <div className="border-b border-[#F0ECE1] pb-4">
        <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
          MY ACCOUNT
        </span>
        <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">
          Welcome back, {user?.full_name?.split(" ")[0] || "Valued Customer"}!
        </h1>
        <p className="text-xs text-[#8C9890] mt-0.5">
          Account #{user?.account_number} • Member since {user ? formatDate(user.created_at) : ""}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center justify-between hover:border-[#0D2619] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl flex items-center justify-center text-[#0D2619]">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs text-[#8C9890]">{label}</p>
                <h3 className="font-cormorant text-2xl font-bold text-[#1C2E24]">{value}</h3>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#8C9890] group-hover:text-[#0D2619] transition-colors" />
          </Link>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
          <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">Recent Orders</h2>
          <Link href="/customer/orders" className="text-xs text-[#0D2619] font-bold hover:underline">
            View All Orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#8C9890]">
            No recent orders placed yet. Start exploring our handloom catalog!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Order Number</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Total Amount</th>
                  <th className="pb-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#1C2E24]">#{order.order_number}</td>
                    <td className="py-3 px-3 text-[#8C9890]">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-3">
                      <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#1C2E24]">{formatPrice(order.total_amount)}</td>
                    <td className="py-3 px-3">
                      <Link href={`/customer/orders/${order.id}`} className="text-xs font-bold text-[#0D2619] hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
