"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Package, ShoppingBag, DollarSign, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { merchantApi, orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Order } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

export default function MerchantDashboard() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") { router.push("/auth/login"); return; }
    loadData();
  }, [isAuthenticated, role]);

  const loadData = async () => {
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        merchantApi.analytics(30),
        orderApi.merchantOrders({ page: 1, page_size: 5 }),
      ]);
      setAnalytics(analyticsRes.data);
      setRecentOrders(ordersRes.data.items);
    } catch (err: any) {
      if (err?.response?.status === 404) setHasProfile(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );

  if (!hasProfile) return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <Store size={48} className="text-gold-300 mx-auto mb-4" />
      <h2 className="font-cormorant text-3xl font-light text-brown mb-2">Set Up Your Store</h2>
      <p className="font-garamond text-muted mb-6">
        Complete your merchant profile to start selling on Ratnamayuri.
      </p>
      <Link href="/merchant/profile" className="btn-primary">CREATE MERCHANT PROFILE</Link>
    </div>
  );

  const stats = [
    { label: "Revenue (30d)", value: formatPrice(analytics?.total_revenue || 0), icon: DollarSign, color: "text-green-600" },
    { label: "Orders (30d)", value: analytics?.total_orders || 0, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Total Products", value: analytics?.total_products || 0, icon: Package, color: "text-purple-600" },
    { label: "Pending Payout", value: formatPrice(analytics?.pending_payout || 0), icon: TrendingUp, color: "text-gold-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <span className="section-tag">OVERVIEW</span>
        <h1 className="section-title">Merchant <em className="italic">Dashboard</em></h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-cinzel text-xs tracking-widest text-muted">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className="font-cormorant text-2xl font-medium text-brown">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-cinzel text-xs tracking-widest text-brown">RECENT ORDERS</h2>
            <Link href="/merchant/orders" className="font-cinzel text-xs text-gold-600 hover:text-gold-500 flex items-center gap-1">
              ALL ORDERS <ChevronRight size={12} />
            </Link>
          </div>
          <div className="card overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-garamond text-muted">No orders yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-ivory">
                  <tr>
                    <th className="table-th">Order</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-ivory/50 transition-colors">
                      <td className="table-td">
                        <Link href={`/merchant/orders?id=${order.id}`}
                          className="font-cinzel text-xs text-gold-700 hover:text-gold-600">
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="table-td">
                        <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="table-td font-garamond text-sm">{formatPrice(order.total_amount)}</td>
                      <td className="table-td font-garamond text-xs text-muted">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top products */}
        <div>
          <h2 className="font-cinzel text-xs tracking-widest text-brown mb-4">TOP PRODUCTS</h2>
          <div className="space-y-3">
            {analytics?.top_products?.length ? (
              analytics.top_products.map((p: any, i: number) => (
                <div key={i} className="card p-4">
                  <p className="font-garamond text-sm text-brown font-medium truncate">{p.name}</p>
                  <div className="flex justify-between mt-1">
                    <span className="font-garamond text-xs text-muted">{p.units_sold} units</span>
                    <span className="font-cinzel text-xs text-gold-700">{formatPrice(p.revenue)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-6 text-center">
                <p className="font-garamond text-sm text-muted">No sales data yet</p>
              </div>
            )}
          </div>

          <div className="card p-4 mt-4 bg-gold-50 border-gold-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-gold-600" />
              <p className="font-cinzel text-xs tracking-wide text-brown">QUICK ACTIONS</p>
            </div>
            <div className="space-y-2 mt-3">
              <Link href="/merchant/products?action=add" className="btn-primary w-full text-center text-xs py-2 block">
                + ADD PRODUCT
              </Link>
              <Link href="/merchant/orders" className="btn-outline w-full text-center text-xs py-2 block">
                VIEW ORDERS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Store({ size, className }: { size: number; className: string }) {
  return <Package size={size} className={className} />;
}
