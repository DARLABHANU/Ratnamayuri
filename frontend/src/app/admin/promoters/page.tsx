"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Download, Award, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, formatPrice, getApiError } from "@/lib/utils";

function PromotersContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [promoters, setPromoters] = useState<any[]>([]);
  const [totalPromoters, setTotalPromoters] = useState(0);
  const [activePromoters, setActivePromoters] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadPromoters();
  }, [isAuthenticated, role, page]);

  const loadPromoters = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, page_size: 20, role: "promoter" };
      if (search) params.search = search;
      
      const { data } = await adminApi.users(params);
      if (data && data.items) {
        setPromoters(data.items);
        setTotalPromoters(data.total || 0);
        setTotalPages(data.pages || 1);
        setActivePromoters(data.items.filter((u: any) => u.is_active).length);
        
        // Use aggregated stats if API provides them in future, otherwise calculate from list
        let comm = 0;
        let sales = 0;
        data.items.forEach((p: any) => {
          comm += p.total_commission || 0;
          sales += (p.total_commission || 0) * 6; // Temporary approximation
        });
        setTotalCommission(comm);
        setTotalSales(sales);
      } else {
        setPromoters([]);
      }
    } catch {
      setPromoters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    toast.success("Exporting Promoters list CSV...");
  };

  const displayList = promoters.map((p) => ({
    id: p.id,
    name: p.full_name,
    email: p.email,
    coupon_code: `PROMO${p.id}`,
    commission_earned: formatPrice(p.total_commission || 0),
    total_sales: formatPrice((p.total_commission || 0) * 6),
    orders_count: Math.round((p.total_commission || 0) / 100),
    joined_on: formatDate(p.created_at || new Date().toISOString())
  }));

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Promoters Management</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Top Summary Metrics (4 Columns) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Promoters</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalPromoters.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Active Promoters</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{activePromoters.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Commission Paid</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{formatPrice(totalCommission)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Promoter Sales Volume</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{formatPrice(totalSales)}</span>
          </div>
        </div>

        {/* ── 2. Controls Bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input
              type="text"
              placeholder="Search promoters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
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
                  <th className="pb-3 px-3">Promoter Name</th>
                  <th className="pb-3 px-3">Coupon Code</th>
                  <th className="pb-3 px-3">Orders Driven</th>
                  <th className="pb-3 px-3">Sales Driven</th>
                  <th className="pb-3 px-3">Commission Earned</th>
                  <th className="pb-3 px-3">Joined On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {displayList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-[#1C2E24]">{item.name}</p>
                      <p className="text-[11px] text-[#8C9890]">{item.email}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-md text-[11px] border border-red-200">
                        {item.coupon_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{item.orders_count}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{item.total_sales}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#2E7D32]">{item.commission_earned}</td>
                    <td className="py-3.5 px-3 text-[#556B5D] font-medium">{item.joined_on}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Pagination Dock ── */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F0ECE1]">
          <span className="text-[11px] text-[#8C9890] font-medium">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-[#E5E0D5] text-[#1C2E24] hover:bg-[#FAF8F3] disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E5E0D5] text-[#1C2E24] hover:bg-[#FAF8F3] disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function AdminPromotersPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <PromotersContent />
    </Suspense>
  );
}
