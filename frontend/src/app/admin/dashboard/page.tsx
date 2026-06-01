"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Package, ShoppingBag, DollarSign, Clock, Tag, ChevronRight, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AdminDashboard, Order } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") { router.push("/auth/login"); return; }
    adminApi.dashboard().then((r) => setData(r.data)).finally(() => setIsLoading(false));
  }, [isAuthenticated, role]);

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );

  const stats = data ? [
    { label: "Customers",      value: data.total_users,              icon: Users,       href: "/admin/users",                 color: "text-blue-600"   },
    { label: "Merchants",      value: data.total_merchants,          icon: Package,     href: "/admin/users?role=merchant",   color: "text-purple-600" },
    { label: "Total Orders",   value: data.total_orders,             icon: ShoppingBag, href: "/admin/orders",                color: "text-orange-600" },
    { label: "Total Revenue",  value: formatPrice(data.total_revenue),icon: DollarSign,  href: "/admin/orders",                color: "text-blue-700"  },
    { label: "Net Profit",     value: formatPrice(data.total_profit), icon: DollarSign,  href: "/admin/orders",                color: "text-green-600"  },
    { label: "Pending Orders", value: data.pending_orders,           icon: Clock,       href: "/admin/orders?status=pending", color: "text-yellow-600" },
    { label: "Active Coupons", value: data.active_coupons,           icon: Tag,         href: "/admin/coupons",               color: "text-gold-600"   },
  ] : [];

  return (
    <div>
      <div className="mb-8">
        <span className="section-tag">CONTROL CENTRE</span>
        <h1 className="section-title">Admin <em className="italic">Dashboard</em></h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="card p-5 hover:border-gold-300 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <p className="font-cinzel text-xs tracking-widest text-muted">{label}</p>
              <Icon size={18} className={color} />
            </div>
            <p className="font-cormorant text-3xl font-light text-brown group-hover:text-gold-700 transition-colors">
              {value}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-cinzel text-xs tracking-widest text-brown">RECENT ORDERS</h2>
        <Link href="/admin/orders" className="font-cinzel text-xs text-gold-600 hover:text-gold-500 flex items-center gap-1">
          VIEW ALL <ChevronRight size={12} />
        </Link>
      </div>

      <div className="card overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-ivory">
            <tr>
              <th className="table-th">Order</th>
              <th className="table-th">Items</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Status</th>
              <th className="table-th">Date</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recent_orders || []).map((order: Order) => (
              <tr key={order.id} className="hover:bg-ivory/50 transition-colors">
                <td className="table-td font-cinzel text-xs text-gold-700">#{order.order_number}</td>
                <td className="table-td font-garamond text-sm text-muted">{order.items.length}</td>
                <td className="table-td font-cinzel text-xs text-brown">{formatPrice(order.total_amount)}</td>
                <td className="table-td">
                  <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="table-td font-garamond text-xs text-muted">{formatDate(order.created_at)}</td>
              </tr>
            ))}
            {!data?.recent_orders?.length && (
              <tr><td colSpan={5} className="table-td text-center py-8 font-garamond text-muted">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/admin/users",       label: "Manage Users",     desc: "View, edit, deactivate" },
          { href: "/admin/coupons",     label: "Create Coupon",    desc: "Add new discount codes"  },
          { href: "/admin/orders",      label: "All Orders",       desc: "Full order management"   },
          { href: "/admin/commissions", label: "Pay Commissions",  desc: "Settle promoter payouts" },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href} className="card p-5 hover:border-gold-400 transition-all group">
            <p className="font-cinzel text-xs tracking-wide text-brown group-hover:text-gold-700 transition-colors mb-1">{label}</p>
            <p className="font-garamond text-xs text-muted">{desc}</p>
            <span className="font-cinzel text-xs text-gold-500 mt-3 block">GO →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
