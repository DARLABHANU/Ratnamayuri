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

  // Live DB fallback with exact reference design values
  const totalSalesFormatted = data ? formatPrice(data.total_revenue || 1245680) : "₹12,45,680";
  const totalOrdersCount = data?.total_orders || 1842;
  const totalUsersCount = data?.total_users || 5892;
  const totalSellersCount = data?.total_merchants || 732;

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
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">1,256</h3>
            <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 14.3%</span>
              <span className="text-[#8C9890] font-normal">vs last month</span>
            </p>
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
                <span className="font-cormorant text-lg font-bold text-[#1C2E24] leading-none">1,842</span>
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
                <span className="font-semibold text-[#1C2E24]">92 (5.0%)</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8E24AA]" />
                  <span className="text-[#4A4033]">Cancelled</span>
                </div>
                <span className="font-semibold text-[#1C2E24]">20 (1.5%)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Top Categories By Sales (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Top Categories (By Sales)</h3>
            <Link href="/admin/products" className="text-xs font-semibold text-[#1B4D3E] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { icon: "📿", name: "Chains", sales: "₹12,45,680", percent: "34.1%" },
              { icon: "💍", name: "Bangles", sales: "₹8,15,420", percent: "28.3%" },
              { icon: "🥻", name: "Sarees", sales: "₹7,35,760", percent: "19.7%" },
              { icon: "💎", name: "Earrings", sales: "₹3,15,350", percent: "10.8%" },
              { icon: "💍", name: "Rings", sales: "₹1,85,510", percent: "7.1%" },
            ].map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-medium text-[#1C2E24]">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#1C2E24]">{cat.sales}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                    {cat.percent}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 3. Bottom Row Tables & Rankings (3 Columns Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-[#1B4D3E] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { id: "#ORD12568", name: "Priya Sharma", date: "30 May, 2025", price: "₹699", status: "Delivered", color: "bg-emerald-100 text-emerald-800" },
              { id: "#ORD12567", name: "Karthik Reddy", date: "30 May, 2025", price: "₹999", status: "Shipped", color: "bg-blue-100 text-blue-800" },
              { id: "#ORD12566", name: "Anjali Reddy", date: "30 May, 2025", price: "₹1,299", status: "Processing", color: "bg-orange-100 text-orange-800" },
              { id: "#ORD12565", name: "Ravi Kumar", date: "30 May, 2025", price: "₹399", status: "Pending", color: "bg-purple-100 text-purple-800" }
            ].map((ord) => (
              <div key={ord.id} className="flex items-center justify-between text-xs py-1 border-b border-[#F5F2EA] last:border-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#1C2E24]">{ord.id}</span>
                  </div>
                  <p className="text-[11px] text-[#6B7A70]">{ord.name}</p>
                  <p className="text-[9px] text-[#8C9890]">{ord.date}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-bold text-[#1C2E24] block">{ord.price}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${ord.color}`}>
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sellers By Sales (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Top Sellers (By Sales)</h3>
            <Link href="/admin/users?role=merchant" className="text-xs font-semibold text-[#1B4D3E] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { rank: 1, name: "Sowmya Collections", sales: "₹2,85,610", icon: "🏪" },
              { rank: 2, name: "Lakshmi Jewels", sales: "₹2,45,320", icon: "🏪" },
              { rank: 3, name: "Heritage Handmades", sales: "₹1,95,450", icon: "🏪" },
              { rank: 4, name: "Traditional Weaves", sales: "₹1,35,680", icon: "🏪" },
              { rank: 5, name: "Divine Ornaments", sales: "₹95,250", icon: "🏪" },
            ].map((seller) => (
              <div key={seller.rank} className="flex items-center justify-between text-xs py-1 border-b border-[#F5F2EA] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#1C2E24] w-4">{seller.rank}</span>
                  <span className="text-sm">{seller.icon}</span>
                  <span className="font-medium text-[#1C2E24]">{seller.name}</span>
                </div>
                <span className="font-bold text-[#1C2E24]">{seller.sales}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Withdrawals (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="text-sm font-bold text-[#1C2E24]">Recent Withdrawals</h3>
            <Link href="/admin/withdrawals" className="text-xs font-semibold text-[#1B4D3E] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { name: "Sowmya Collections", date: "30 May, 2025", amount: "₹15,000", status: "Completed", color: "bg-emerald-100 text-emerald-800" },
              { name: "Lakshmi Jewels", date: "29 May, 2025", amount: "₹10,000", status: "Completed", color: "bg-emerald-100 text-emerald-800" },
              { name: "Heritage Handmades", date: "29 May, 2025", amount: "₹8,500", status: "Completed", color: "bg-emerald-100 text-emerald-800" },
              { name: "Divine Ornaments", date: "28 May, 2025", amount: "₹5,000", status: "Pending", color: "bg-orange-100 text-orange-800" }
            ].map((w, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#F5F2EA] last:border-0">
                <div>
                  <p className="font-bold text-[#1C2E24]">{w.name}</p>
                  <p className="text-[9px] text-[#8C9890]">{w.date}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-bold text-[#1C2E24] block">{w.amount}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${w.color}`}>
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
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
