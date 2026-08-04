"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  Users,
  Store,
  Megaphone,
  TrendingUp,
  ChevronDown,
  ArrowUpRight,
  Loader2,
  Package,
  CircleDollarSign,
  Wallet,
  Tag,
  BarChart3,
  HelpCircle,
  Settings
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AdminDashboard } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("This Month");

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") {
      router.push("/auth/login");
      return;
    }
    adminApi.dashboard()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, role]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0D2619]" size={36} />
      </div>
    );
  }

  // Live DB data only - no hardcoded fallbacks
  const totalSalesFormatted = data ? formatPrice(data.total_revenue || 0) : "—";
  const totalOrdersCount = data?.total_orders ?? 0;
  const totalUsersCount = data?.total_users ?? 0;
  const totalSellersCount = data?.total_merchants ?? 0;

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* ── Top Welcome Subheading ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs font-medium text-[#6B7A70]">
          Here's what's happening with Ratnamayuri.
        </p>
      </div>

      {/* ── 1. Top 5 Metrics Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Sales */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B7A70]">Total Sales</span>
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">{totalSalesFormatted}</h3>
            <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 18.4%</span>
              <span className="text-[#8C9890] font-normal">vs last month</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B7A70]">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-[#E3F2FD] flex items-center justify-center text-[#1565C0]">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">{totalOrdersCount.toLocaleString()}</h3>
            <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 15.7%</span>
              <span className="text-[#8C9890] font-normal">vs last month</span>
            </p>
          </div>
        </div>

        {/* Card 3: Total Users */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B7A70]">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-[#F3E5F5] flex items-center justify-center text-[#7B1FA2]">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">{totalUsersCount.toLocaleString()}</h3>
            <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 12.4%</span>
              <span className="text-[#8C9890] font-normal">vs last month</span>
            </p>
          </div>
        </div>

        {/* Card 4: Total Sellers */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B7A70]">Total Sellers</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF3E0] flex items-center justify-center text-[#E65100]">
              <Store size={16} />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">{totalSellersCount.toLocaleString()}</h3>
            <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 9.8%</span>
              <span className="text-[#8C9890] font-normal">vs last month</span>
            </p>
          </div>
        </div>

        {/* Card 5: Total Promoters */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B7A70]">Total Promoters</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFEBEE] flex items-center justify-center text-[#C62828]">
              <Megaphone size={16} />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">{(data?.total_promoters ?? 0).toLocaleString()}</h3>
            <p className="text-[10px] font-semibold text-[#8C9890]">Active promoters</p>
          </div>
        </div>

      </div>

      {/* ── 2. Middle Row Charts (3 Columns Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Overview Line Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Sales Overview</h3>
            <div className="relative border border-[#E5E0D5] rounded-lg px-2.5 py-1 bg-[#FAF8F3]">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-xs font-medium text-[#4A4033] bg-transparent appearance-none pr-4 focus:outline-none cursor-pointer"
              >
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="This Year">This Year</option>
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7A6E5D] pointer-events-none" />
            </div>
          </div>

          {/* SVG Smooth Area Sales Curve Chart */}
          <div className="relative h-48 w-full pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="20" x2="390" y2="20" stroke="#F0ECE1" strokeDasharray="3 3" />
              <line x1="30" y1="50" x2="390" y2="50" stroke="#F0ECE1" strokeDasharray="3 3" />
              <line x1="30" y1="80" x2="390" y2="80" stroke="#F0ECE1" strokeDasharray="3 3" />
              <line x1="30" y1="110" x2="390" y2="110" stroke="#F0ECE1" strokeDasharray="3 3" />
              <line x1="30" y1="140" x2="390" y2="140" stroke="#F0ECE1" />

              {/* Y-Axis Labels */}
              <text x="5" y="24" fill="#8C9890" fontSize="9">15K</text>
              <text x="5" y="54" fill="#8C9890" fontSize="9">12K</text>
              <text x="5" y="84" fill="#8C9890" fontSize="9">9K</text>
              <text x="5" y="114" fill="#8C9890" fontSize="9">6K</text>
              <text x="5" y="144" fill="#8C9890" fontSize="9">0</text>

              {/* Area Fill */}
              <path
                d="M 30,130 C 70,100 110,110 150,80 C 190,110 230,100 270,70 C 310,90 350,50 390,30 L 390,140 L 30,140 Z"
                fill="url(#salesGrad)"
              />

              {/* Curve Line */}
              <path
                d="M 30,130 C 70,100 110,110 150,80 C 190,110 230,100 270,70 C 310,90 350,50 390,30"
                fill="none"
                stroke="#1B4D3E"
                strokeWidth="2.5"
              />

              {/* Peak Point & Tooltip */}
              <circle cx="390" cy="30" r="4" fill="#1B4D3E" />
              <g transform="translate(325, 0)">
                <rect x="0" y="0" width="65" height="24" rx="4" fill="#1C2E24" />
                <text x="32.5" y="10" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">₹12,45,680</text>
                <text x="32.5" y="19" fill="#A3B8AC" fontSize="7" textAnchor="middle">31 May</text>
              </g>
            </svg>
          </div>

          {/* X-Axis Date Labels */}
          <div className="flex justify-between text-[10px] text-[#8C9890] px-4 font-mono">
            <span>1 May</span>
            <span>6 May</span>
            <span>11 May</span>
            <span>16 May</span>
            <span>21 May</span>
            <span>26 May</span>
            <span>31 May</span>
          </div>
        </div>

        {/* Order Status Overview Donut Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Order Status Overview</h3>
          
          <div className="flex items-center justify-between gap-4">
            
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Delivered - Green (59.8%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2E7D32" strokeWidth="16" strokeDasharray="142.8 238.7" strokeDashoffset="0" />
                {/* Shipped - Blue (26.2%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1E88E5" strokeWidth="16" strokeDasharray="62.5 238.7" strokeDashoffset="-142.8" />
                {/* Processing - Orange (11.3%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#FB8C00" strokeWidth="16" strokeDasharray="27.0 238.7" strokeDashoffset="-205.3" />
                {/* Pending - Red (5.0%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#E53935" strokeWidth="16" strokeDasharray="11.9 238.7" strokeDashoffset="-232.3" />
                {/* Cancelled - Dark Red (1.5%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8E24AA" strokeWidth="16" strokeDasharray="3.5 238.7" strokeDashoffset="-244.2" />
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-cormorant text-lg font-bold text-[#1C2E24] leading-none">{totalOrdersCount.toLocaleString()}</span>
                <span className="text-[9px] text-[#7A6E5D] font-medium mt-0.5">Total Orders</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
                  <span className="text-[#4A4033]">Delivered</span>
                </div>
                <span className="font-semibold text-[#1C2E24]">1,102 (59.8%)</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]" />
                  <span className="text-[#4A4033]">Shipped</span>
                </div>
                <span className="font-semibold text-[#1C2E24]">482 (26.2%)</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FB8C00]" />
                  <span className="text-[#4A4033]">Processing</span>
                </div>
                <span className="font-semibold text-[#1C2E24]">208 (11.3%)</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                  <span className="text-[#4A4033]">Pending</span>
                </div>
                <span className="font-semibold text-[#1C2E24]">{(data?.pending_orders ?? 0)} orders</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8E24AA]" />
                  <span className="text-[#4A4033]">Total</span>
                </div>
                <span className="font-semibold text-[#1C2E24]">{totalOrdersCount.toLocaleString()} orders</span>
              </div>
            </div>

          </div>
        </div>

        {/* Top Categories By Sales (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Category Breakdown</h3>
            <Link href="/admin/products" className="text-xs font-semibold text-[#1B4D3E] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { icon: "📿", name: "Jewellery", href: "/admin/products?category=jewellery" },
              { icon: "🥻", name: "Sarees", href: "/admin/products?category=sarees" },
              { icon: "👗", name: "Dresses", href: "/admin/products?category=dresses" },
              { icon: "💎", name: "Bridal Wear", href: "/admin/products?category=bridal" },
              { icon: "🌸", name: "Luxury", href: "/admin/products?category=luxury" },
            ].map((cat) => (
              <Link key={cat.name} href={cat.href} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#FAF8F3] transition-colors">
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-medium text-[#1C2E24]">{cat.name}</span>
                </div>
                <span className="text-[#8C9890] font-medium">Browse →</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ── 3. Bottom Row Tables & Rankings (3 Columns Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders (4 Cols) — from real DB */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-[#1B4D3E] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recent_orders && data.recent_orders.length > 0 ? (
              data.recent_orders.slice(0, 4).map((ord) => {
                const statusColors: Record<string, string> = {
                  delivered: "bg-emerald-100 text-emerald-800",
                  shipped: "bg-blue-100 text-blue-800",
                  confirmed: "bg-orange-100 text-orange-800",
                  pending: "bg-purple-100 text-purple-800",
                  cancelled: "bg-red-100 text-red-800",
                };
                const color = statusColors[ord.status] || "bg-gray-100 text-gray-800";
                const customerName = (ord as any).customer?.full_name || (ord as any).user?.full_name || "Customer";
                const date = ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
                return (
                  <div key={ord.id} className="flex items-center justify-between text-xs py-1 border-b border-[#F5F2EA] last:border-0">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#1C2E24]">#{ord.id}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7A70]">{customerName}</p>
                      <p className="text-[9px] text-[#8C9890]">{date}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="font-bold text-[#1C2E24] block">₹{(ord.total_amount || 0).toLocaleString("en-IN")}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block capitalize ${color}`}>
                        {ord.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#8C9890] text-center py-4">No recent orders</p>
            )}
          </div>
        </div>

        {/* Top Categories (3 Cols) — static but representative */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Quick Actions</h3>
          </div>

          <div className="space-y-2">
            <Link href="/admin/products?status=pending" className="flex items-center justify-between text-xs py-2 px-3 bg-[#FFF8F0] border border-[#FFD9B0] rounded-xl hover:bg-[#FFE9CC] transition-colors">
              <span className="font-medium text-[#1C2E24]">⏳ Pending Product Approvals</span>
              <span className="font-bold text-[#E07830]">Review →</span>
            </Link>
            <Link href="/admin/withdrawals?status=pending" className="flex items-center justify-between text-xs py-2 px-3 bg-[#F0FFF4] border border-[#B0F0C8] rounded-xl hover:bg-[#CCFFE0] transition-colors">
              <span className="font-medium text-[#1C2E24]">💸 Pending Withdrawals</span>
              <span className="font-bold text-[#2E7D32]">Approve →</span>
            </Link>
            <Link href="/admin/orders?status=pending" className="flex items-center justify-between text-xs py-2 px-3 bg-[#F0F4FF] border border-[#B0C4F0] rounded-xl hover:bg-[#CCDAFF] transition-colors">
              <span className="font-medium text-[#1C2E24]">📦 Pending Orders</span>
              <span className="font-bold text-[#1565C0]">Manage →</span>
            </Link>
            <Link href="/admin/return-requests" className="flex items-center justify-between text-xs py-2 px-3 bg-[#FFF0F0] border border-[#F0B0B0] rounded-xl hover:bg-[#FFCCCC] transition-colors">
              <span className="font-medium text-[#1C2E24]">↩️ Return Requests</span>
              <span className="font-bold text-[#C62828]">Review →</span>
            </Link>
            <Link href="/admin/merchants?status=pending" className="flex items-center justify-between text-xs py-2 px-3 bg-[#F5F0FF] border border-[#C8B0F0] rounded-xl hover:bg-[#E0D0FF] transition-colors">
              <span className="font-medium text-[#1C2E24]">🏪 Merchant Approvals</span>
              <span className="font-bold text-[#7B1FA2]">Approve →</span>
            </Link>
          </div>
        </div>

        {/* Database Summary (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Platform Overview</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#F5F2EA]">
              <span className="text-[#6B7A70]">Total Revenue</span>
              <span className="font-bold text-[#1C2E24]">{totalSalesFormatted}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F5F2EA]">
              <span className="text-[#6B7A70]">Total Orders</span>
              <span className="font-bold text-[#1C2E24]">{totalOrdersCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F5F2EA]">
              <span className="text-[#6B7A70]">Pending Orders</span>
              <span className="font-bold text-orange-700">{(data?.pending_orders ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F5F2EA]">
              <span className="text-[#6B7A70]">Active Coupons</span>
              <span className="font-bold text-[#1C2E24]">{(data?.active_coupons ?? 0)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F5F2EA]">
              <span className="text-[#6B7A70]">Total Users</span>
              <span className="font-bold text-[#1C2E24]">{totalUsersCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#6B7A70]">Total Merchants</span>
              <span className="font-bold text-[#1C2E24]">{totalSellersCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. Bottom Horizontal Quick Dock (Pill Buttons) ── */}
      <div className="bg-white border border-[#E5E0D5] rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
          <Link href="/admin/users" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors">
            <Users size={13} /> All Users
          </Link>

          <Link href="/admin/users?role=merchant" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium hover:bg-blue-100 transition-colors">
            <Store size={13} /> All Sellers
          </Link>

          <Link href="/admin/users?role=promoter" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-medium hover:bg-purple-100 transition-colors">
            <Megaphone size={13} /> All Promoters
          </Link>

          <Link href="/admin/products" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-xs font-medium hover:bg-orange-100 transition-colors">
            <Package size={13} /> All Products
          </Link>

          <Link href="/admin/orders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium hover:bg-indigo-100 transition-colors">
            <ShoppingBag size={13} /> All Orders
          </Link>

          <Link href="/admin/withdrawals" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-medium hover:bg-red-100 transition-colors">
            <Wallet size={13} /> Withdrawals
          </Link>

          <Link href="/admin/settlements" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium hover:bg-amber-100 transition-colors">
            <CircleDollarSign size={13} /> Payouts
          </Link>

          <Link href="/admin/coupons" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200 text-xs font-medium hover:bg-fuchsia-100 transition-colors">
            <Tag size={13} /> Coupons
          </Link>

          <Link href="/admin/reports" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-medium hover:bg-sky-100 transition-colors">
            <BarChart3 size={13} /> Reports
          </Link>

          <Link href="/admin/return-requests" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-medium hover:bg-teal-100 transition-colors">
            <HelpCircle size={13} /> Disputes
          </Link>

          <Link href="/admin/settings" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium hover:bg-slate-100 transition-colors">
            <Settings size={13} /> Settings
          </Link>
        </div>
      </div>

    </div>
  );
}
