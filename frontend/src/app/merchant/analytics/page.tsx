"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Download, TrendingUp, DollarSign, Wallet, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

function MerchantAnalyticsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
    }
  }, [isAuthenticated, role]);

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Earnings &amp; Analytics</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Sales Revenue</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">₹45,680</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Net Earnings Payout</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">₹32,450</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Available to Withdraw</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">₹8,760</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Orders Delivered</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">128</span>
          </div>
        </div>

        {/* Sales Chart Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Revenue Trend (Last 30 Days)</h3>
            <button
              onClick={() => toast.success("Exporting Earnings Statement...")}
              className="inline-flex items-center gap-1.5 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="relative h-56 w-full pt-4 bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl p-4">
            <svg viewBox="0 0 500 160" className="w-full h-40 overflow-visible">
              <defs>
                <linearGradient id="sellerAnalyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 150 Q 60 100, 120 120 T 240 70 T 360 90 T 500 20 L 500 150 L 0 150 Z"
                fill="url(#sellerAnalyticsGrad)"
              />
              <path
                d="M 0 150 Q 60 100, 120 120 T 240 70 T 360 90 T 500 20"
                fill="none"
                stroke="#2E7D32"
                strokeWidth="3"
              />
              <circle cx="500" cy="20" r="5" fill="#2E7D32" />
            </svg>

            <div className="flex justify-between text-[11px] text-[#8C9890] font-semibold pt-2">
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

      </div>

    </div>
  );
}

export default function MerchantAnalyticsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <MerchantAnalyticsContent />
    </Suspense>
  );
}
