"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TrendingUp, Package, ShoppingBag, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { merchantApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";

const GOLD_PALETTE = ["#6B1A1A", "#C9973E", "#5A1212", "#E8D5B0", "#8B2020"];

export default function MerchantAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") { router.push("/auth/login"); return; }
    loadAnalytics();
  }, [isAuthenticated, role, days]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data } = await merchantApi.analytics(days);
      setAnalytics(data);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = analytics ? [
    { label: "Total Revenue", value: formatPrice(analytics.total_revenue), icon: DollarSign, color: "text-green-600" },
    { label: "Total Orders", value: analytics.total_orders, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Products Listed", value: analytics.total_products, icon: Package, color: "text-purple-600" },
    { label: "Escrow Hold", value: formatPrice(analytics.pending_payout), icon: TrendingUp, color: "text-yellow-600" },
    { label: "Available to Withdraw", value: formatPrice(analytics.available_payout || 0), icon: DollarSign, color: "text-gold-600" },
  ] : [];

  const pieData = (analytics?.top_products || []).map((p: any) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name,
    value: p.revenue,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="section-tag">INSIGHTS</span>
          <h1 className="section-title">Sales <em className="italic">Analytics</em></h1>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`font-cinzel text-xs tracking-wide px-4 py-2 transition-all
                ${days === d ? "bg-deep text-gold-400" : "border border-gold-200 text-muted hover:border-gold-500"}`}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-gold-500" size={32} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-cinzel text-xs tracking-widest text-muted">{label}</p>
                  <Icon size={16} className={color} />
                </div>
                <p className="font-cormorant text-2xl font-medium text-brown">{value}</p>
                <p className="font-garamond text-xs text-muted mt-1">Last {days} days</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h2 className="font-cinzel text-xs tracking-widest text-muted mb-6">TOP PRODUCTS BY REVENUE</h2>
              {analytics?.top_products?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analytics.top_products}
                    margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5EFE6" />
                    <XAxis dataKey="name"
                      tick={{ fontFamily: "var(--font-garamond)", fontSize: 11 }}
                      angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontFamily: "var(--font-garamond)", fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [formatPrice(v), "Revenue"]}
                      contentStyle={{ fontFamily: "var(--font-garamond)", fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#0C2337" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="font-garamond text-muted">No sales data yet</p>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-cinzel text-xs tracking-widest text-muted mb-6">REVENUE DISTRIBUTION</h2>
              {pieData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" outerRadius={85}
                      dataKey="value" nameKey="name"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {pieData.map((_: any, i: number) => (
                        <Cell key={i} fill={GOLD_PALETTE[i % GOLD_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Legend formatter={(v) =>
                      <span style={{ fontFamily: "var(--font-garamond)", fontSize: 11 }}>{v}</span>} />
                    <Tooltip formatter={(v: any) => [formatPrice(v), "Revenue"]}
                      contentStyle={{ fontFamily: "var(--font-garamond)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="font-garamond text-muted">No data yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-cinzel text-xs tracking-widest text-muted mb-4">PRODUCT PERFORMANCE TABLE</h2>
            {analytics?.top_products?.length ? (
              <table className="w-full">
                <thead className="bg-ivory">
                  <tr>
                    <th className="table-th">Product</th>
                    <th className="table-th">Units Sold</th>
                    <th className="table-th">Revenue</th>
                    <th className="table-th">Avg per Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.top_products.map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-ivory/50 transition-colors">
                      <td className="table-td font-garamond text-sm text-brown">{p.name}</td>
                      <td className="table-td font-garamond text-sm text-muted">{p.units_sold}</td>
                      <td className="table-td font-cinzel text-xs text-brown">{formatPrice(p.revenue)}</td>
                      <td className="table-td font-garamond text-sm text-muted">
                        {p.units_sold ? formatPrice(Math.round(p.revenue / p.units_sold)) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="font-garamond text-sm text-muted text-center py-8">No sales data for this period</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
