"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Download, DollarSign, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";

function CommissionsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const demoCommissions = [
    {
      id: 1,
      type: "Platform Margin",
      order_id: "#ORD12568",
      source: "Sowmya Collections",
      sale_amount: "₹699",
      commission_rate: "₹299 Fixed Margin",
      earned_amount: "₹299",
      date: "30 May, 2025"
    },
    {
      id: 2,
      type: "Promoter Fee",
      order_id: "#ORD12567",
      source: "Ravi Kumar (PROMO104)",
      sale_amount: "₹999",
      commission_rate: "₹30 Platform Profit",
      earned_amount: "₹30",
      date: "30 May, 2025"
    },
    {
      id: 3,
      type: "Merchant Commission",
      order_id: "#ORD12566",
      source: "Lakshmi Jewels",
      sale_amount: "₹1,299",
      commission_rate: "10%",
      earned_amount: "₹129.90",
      date: "30 May, 2025"
    },
    {
      id: 4,
      type: "Platform Margin",
      order_id: "#ORD12565",
      source: "Heritage Handmades",
      sale_amount: "₹399",
      commission_rate: "₹299 Fixed Margin",
      earned_amount: "₹299",
      date: "29 May, 2025"
    },
    {
      id: 5,
      type: "Promoter Fee",
      order_id: "#ORD12564",
      source: "Sneha Reddy (SNEHA200)",
      sale_amount: "₹1,499",
      commission_rate: "₹30 Platform Profit",
      earned_amount: "₹30",
      date: "29 May, 2025"
    }
  ];

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, role]);

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Page Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Earnings &amp; Commission</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Summary Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Platform Earnings</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">₹2,45,780</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Seller Commission Margin</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">₹1,85,420</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Promoter Profit Pool</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">₹60,360</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Pending Payout Settlements</span>
            <span className="font-cormorant text-3xl font-[#1C2E24] text-[#B85C00] font-extrabold">₹38,500</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input
              type="text"
              placeholder="Search earnings record..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>

          <button
            onClick={() => toast.success("Exporting Commission Report CSV...")}
            className="inline-flex items-center gap-1.5 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* ── 3. Table ── */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0D2619]" size={32} />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Earning Type</th>
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">Source / Partner</th>
                  <th className="pb-3 px-3">Sale Amount</th>
                  <th className="pb-3 px-3">Rate / Rule</th>
                  <th className="pb-3 px-3">Earned Amount</th>
                  <th className="pb-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {demoCommissions.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-[#1C2E24] bg-[#FAF8F3] border border-[#E5E0D5] px-2.5 py-1 rounded-md text-[11px]">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{item.order_id}</td>
                    <td className="py-3.5 px-3 font-semibold text-[#1C2E24]">{item.source}</td>
                    <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{item.sale_amount}</td>
                    <td className="py-3.5 px-3 text-[#556B5D] font-medium">{item.commission_rate}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#2E7D32]">{item.earned_amount}</td>
                    <td className="py-3.5 px-3 text-[#556B5D] font-medium">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Pagination Dock ── */}
        <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-[#F0ECE1]">
          <button onClick={() => setPage(1)} className="w-7 h-7 rounded-lg bg-[#0D2619] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            1
          </button>
          <button onClick={() => setPage(2)} className="w-7 h-7 rounded-lg text-[#556B5D] hover:bg-[#FAF8F3] text-xs font-semibold">
            2
          </button>
          <button onClick={() => setPage(3)} className="w-7 h-7 rounded-lg text-[#556B5D] hover:bg-[#FAF8F3] text-xs font-semibold">
            3
          </button>
          <span className="text-xs text-[#8C9890] px-1">...</span>
          <button onClick={() => setPage(20)} className="w-7 h-7 rounded-lg text-[#556B5D] hover:bg-[#FAF8F3] text-xs font-semibold">
            20
          </button>
        </div>

      </div>

    </div>
  );
}

export default function AdminCommissionsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <CommissionsContent />
    </Suspense>
  );
}
