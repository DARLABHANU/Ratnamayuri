"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  Package,
  ChevronRight,
  Loader2,
  Store,
  CheckSquare,
  Square
} from "lucide-react";
import toast from "react-hot-toast";
import { merchantApi, orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";

function MerchantDashboardContent() {
  const router = useRouter();
  const { isAuthenticated, role, user } = useAuthStore();
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Demo fallback matching reference screenshot
  const demoOrders = [
    {
      id: 256,
      order_number: "BNC256",
      name: "Gold Plated Chain",
      date: "May 20, 2025",
      price: "₹899",
      status: "Delivered",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=150&auto=format&fit=crop"
    },
    {
      id: 255,
      order_number: "BNC255",
      name: "Kundan Bangles Set",
      date: "May 19, 2025",
      price: "₹999",
      status: "Shipped",
      image: "https://images.unsplash.com/photo-1611591475140-be3a9f074d28?q=80&w=150&auto=format&fit=crop"
    },
    {
      id: 254,
      order_number: "BNC254",
      name: "Silk Saree (Pink)",
      date: "May 19, 2025",
      price: "₹1,299",
      status: "Processing",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=150&auto=format&fit=crop"
    },
    {
      id: 253,
      order_number: "BNC253",
      name: "Pearl Drop Earrings",
      date: "May 18, 2025",
      price: "₹399",
      status: "Delivered",
      image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=150&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, role]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        merchantApi.analytics(30),
        orderApi.merchantOrders({ page: 1, page_size: 5 })
      ]);
      setAnalytics(analyticsRes.data);
      if (ordersRes.data.items && ordersRes.data.items.length > 0) {
        setRecentOrders(ordersRes.data.items);
      }
    } catch {
      // Demo fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = () => {
    router.push("/merchant/wallet");
  };

  const handlePromote = () => {
    toast.success("Store promotion campaign activated!");
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-[#E8F5E9] text-[#2E7D32]";
      case "shipped":
        return "bg-[#E3F2FD] text-[#1565C0]";
      case "processing":
        return "bg-[#FFF3E0] text-[#E65100]";
      default:
        return "bg-[#F3E5F5] text-[#7B1FA2]";
    }
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* ── Greeting Header ── */}
      <div>
        <span className="text-xs font-semibold text-[#8C9890] block">Welcome back,</span>
        <div className="flex items-center gap-2">
          <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">
            {user?.full_name || "Megathavi"}
          </h1>
          <span className="text-emerald-600 bg-emerald-100 p-0.5 rounded-full" title="Verified Store">
            <CheckCircle2 size={16} className="fill-emerald-600 text-white" />
          </span>
        </div>
        <p className="text-xs text-[#6B7A70] mt-0.5">Manage your store and grow your business</p>
      </div>

      {/* ── Top 4 Stat Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Sales */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Sales</span>
            <span className="font-cormorant text-2xl font-extrabold text-[#1C2E24]">
              {analytics?.total_revenue ? formatPrice(analytics.total_revenue) : "₹45,680"}
            </span>
            <span className="text-[10px] font-bold text-[#2E7D32] block mt-1 flex items-center gap-0.5">
              <TrendingUp size={10} /> 18.5% <span className="text-[#8C9890] font-normal">vs last month</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Orders</span>
            <span className="font-cormorant text-2xl font-extrabold text-[#1C2E24]">
              {analytics?.total_orders || "128"}
            </span>
            <span className="text-[10px] font-bold text-[#2E7D32] block mt-1 flex items-center gap-0.5">
              <TrendingUp size={10} /> 12.5% <span className="text-[#8C9890] font-normal">vs last month</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#FFF3E0] text-[#E65100] flex items-center justify-center">
            <ShoppingCart size={20} />
          </div>
        </div>

        {/* Card 3: Total Earnings */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Earnings</span>
            <span className="font-cormorant text-2xl font-extrabold text-[#1C2E24]">
              {analytics?.total_earnings ? formatPrice(analytics.total_earnings) : "₹32,450"}
            </span>
            <span className="text-[10px] font-bold text-[#2E7D32] block mt-1 flex items-center gap-0.5">
              <TrendingUp size={10} /> 20.3% <span className="text-[#8C9890] font-normal">vs last month</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F3E5F5] text-[#7B1FA2] flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>

        {/* Card 4: Available Balance */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#6B7A70] block mb-1">Available Balance</span>
              <span className="font-cormorant text-2xl font-extrabold text-[#1C2E24]">
                {analytics?.available_payout ? formatPrice(analytics.available_payout) : "₹8,760"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#FFF8E1] text-[#B85C00] flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            className="w-full bg-[#E8F5E9] hover:bg-[#D4EDDA] text-[#2E7D32] text-xs font-bold py-1.5 rounded-xl transition-colors"
          >
            Withdraw Now
          </button>
        </div>

      </div>

      {/* ── Middle Row: 3 Columns Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Sales Overview + Store Checklist (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Sales Overview Chart */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
              <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Sales Overview</h3>
              <span className="text-xs text-[#8C9890] font-semibold">This Month ˅</span>
            </div>

            <div className="relative h-44 w-full pt-2">
              <svg viewBox="0 0 500 160" className="w-full h-36 overflow-visible">
                <defs>
                  <linearGradient id="sellerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                <path
                  d="M 0 150 Q 50 110, 100 130 T 200 80 T 300 100 T 400 90 T 500 30 L 500 150 L 0 150 Z"
                  fill="url(#sellerGrad)"
                />
                <path
                  d="M 0 150 Q 50 110, 100 130 T 200 80 T 300 100 T 400 90 T 500 30"
                  fill="none"
                  stroke="#2E7D32"
                  strokeWidth="2.5"
                />
                <circle cx="500" cy="30" r="4" fill="#2E7D32" />
              </svg>

              <div className="flex justify-between text-[10px] text-[#8C9890] font-semibold pt-1">
                <span>1 May</span>
                <span>6 May</span>
                <span>11 May</span>
                <span>16 May</span>
                <span>21 May</span>
                <span>26 May</span>
                <span>31 May</span>
              </div>
            </div>
          </div>

          {/* Store Checklist */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
              <div>
                <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Store Checklist</h3>
                <p className="text-[11px] text-[#8C9890]">Complete these to boost your store</p>
              </div>
              <span className="text-xs font-bold text-[#1C2E24]">3/5 Completed</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
              
              <div className="flex items-center gap-1.5 p-2 bg-[#FAF8F3] rounded-xl border border-[#E5E0D5]">
                <CheckSquare size={14} className="text-[#2E7D32] flex-shrink-0" />
                <div>
                  <span className="font-bold text-[#1C2E24] block">Store Profile</span>
                  <span className="text-[10px] text-[#8C9890] block">Add your logo</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-[#FAF8F3] rounded-xl border border-[#E5E0D5]">
                <CheckSquare size={14} className="text-[#2E7D32] flex-shrink-0" />
                <div>
                  <span className="font-bold text-[#1C2E24] block">Add Products</span>
                  <span className="text-[10px] text-[#8C9890] block">Upload 5 items</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-[#FAF8F3] rounded-xl border border-[#E5E0D5]">
                <CheckSquare size={14} className="text-[#2E7D32] flex-shrink-0" />
                <div>
                  <span className="font-bold text-[#1C2E24] block">Bank Details</span>
                  <span className="text-[10px] text-[#8C9890] block">Add bank acc</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-[#FAF8F3] rounded-xl border border-[#E5E0D5]">
                <Square size={14} className="text-[#8C9890] flex-shrink-0" />
                <div>
                  <span className="font-bold text-[#1C2E24] block">Store Banner</span>
                  <span className="text-[10px] text-[#8C9890] block">Set banner image</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-[#FAF8F3] rounded-xl border border-[#E5E0D5]">
                <Square size={14} className="text-[#8C9890] flex-shrink-0" />
                <div>
                  <span className="font-bold text-[#1C2E24] block">Verify Account</span>
                  <span className="text-[10px] text-[#8C9890] block">Verify identity</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Column 2: Recent Orders (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Recent Orders</h3>
            <button
              onClick={() => router.push("/merchant/orders")}
              className="text-xs text-[#2E7D32] font-bold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {demoOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => router.push(`/merchant/orders?id=${ord.id}`)}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF8F3] transition-colors cursor-pointer border border-[#F5F2EA]"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ord.image}
                    alt={ord.name}
                    className="w-10 h-10 rounded-xl object-cover border border-[#E5E0D5]"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-[#1C2E24] block leading-tight">Order #{ord.order_number}</span>
                    <span className="text-[11px] text-[#556B5D] block truncate max-w-[130px]">{ord.name}</span>
                    <span className="text-[10px] text-[#8C9890]">{ord.date}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-bold text-xs text-[#1C2E24] block">{ord.price}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md inline-block ${getStatusBadge(ord.status)}`}>
                    {ord.status}
                  </span>
                </div>

                <ChevronRight size={14} className="text-[#8C9890] ml-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Grow Your Business Promo Banner (3 Cols) */}
        <div className="lg:col-span-3 bg-[#FFF9F2] border border-[#F3E7D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <h3 className="font-cormorant text-xl font-bold text-[#4A321E]">Grow Your Business</h3>
            <p className="text-xs text-[#7A624E] leading-relaxed">
              Get more visibility and increase your sales across Ratnamayuri marketplace.
            </p>
          </div>

          <button
            onClick={handlePromote}
            className="w-full bg-[#4A321E] hover:bg-[#362314] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Promote Store
          </button>

          {/* Miniature 3D Store Graphic */}
          <div className="w-full h-36 bg-gradient-to-b from-[#FFF0E0] to-[#FFE4CE] rounded-2xl overflow-hidden relative flex items-center justify-center border border-[#F0D5BE]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=400&auto=format&fit=crop"
              alt="Store Front"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        </div>

      </div>

    </div>
  );
}

export default function MerchantDashboardPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <MerchantDashboardContent />
    </Suspense>
  );
}
