"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, formatPrice, getApiError } from "@/lib/utils";

function SellersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, role } = useAuthStore();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [totalSellers, setTotalSellers] = useState(0);
  const [activeSellers, setActiveSellers] = useState(0);
  const [inactiveSellers, setInactiveSellers] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadSellers();
  }, [isAuthenticated, role, page, filter]);

  const loadSellers = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.merchants({ page, page_size: 20 });
      if (data && data.items) {
        setMerchants(data.items);
        setTotalSellers(data.total);
        setTotalPages(data.pages || 1);
        
        let active = 0;
        let inactive = 0;
        let pending = 0;
        
        data.items.forEach((m: any) => {
          if (!m.is_approved) {
            pending++;
          }
          if (m.user?.is_active) {
            active++;
          } else {
            inactive++;
          }
        });
        
        setActiveSellers(active);
        setInactiveSellers(inactive);
        setPendingApproval(pending);
      } else {
        setMerchants([]);
      }
    } catch {
      setMerchants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    toast.success("Exporting Sellers list CSV...");
  };

  const displayList = merchants
    .filter(m => 
      (m.business_name || "").toLowerCase().includes(search.toLowerCase()) || 
      (m.user?.full_name || "").toLowerCase().includes(search.toLowerCase())
    )
    .map((m) => ({
      id: m.id,
      seller_name: m.user?.full_name || `Seller #${m.id}`,
      store_name: m.business_name || "Jewellery Store",
      sales: formatPrice(m.total_sales || 0),
      joined_on: formatDate(m.created_at || new Date().toISOString())
    }));

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Sellers Management</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Top Summary Metrics (4 Columns) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Sellers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalSellers.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Active Sellers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{activeSellers.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Inactive Sellers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{inactiveSellers.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Pending Approval</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{pendingApproval.toLocaleString()}</span>
          </div>
        </div>

        {/* ── 2. Filter & Export Controls Bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input
              type="text"
              placeholder="Search sellers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>

          {/* Filter Dropdown + Export */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative border border-[#E5E0D5] rounded-xl px-3 py-2 bg-[#FAF8F3]">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs font-semibold text-[#1C2E24] bg-transparent appearance-none pr-6 focus:outline-none cursor-pointer"
              >
                <option value="all">All Sellers</option>
                <option value="active">Active Sellers</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>

        </div>

        {/* ── 3. Sellers Table ── */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0D2619]" size={32} />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Seller Name</th>
                  <th className="pb-3 px-3">Store Name</th>
                  <th className="pb-3 px-3">Sales</th>
                  <th className="pb-3 px-3">Joined On</th>
                  <th className="pb-3 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {displayList.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[#8C9890]">No sellers found.</td></tr>
                ) : (
                  displayList.map((seller) => (
                    <tr key={seller.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{seller.seller_name}</td>
                      <td className="py-3.5 px-3 font-semibold text-[#1C2E24]">{seller.store_name}</td>
                      <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{seller.sales}</td>
                      <td className="py-3.5 px-3 text-[#556B5D] font-medium">{seller.joined_on}</td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/sellers/${seller.id}`)}
                          className="bg-[#0D2619] hover:bg-[#19402B] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

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

export default function AdminSellersPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <SellersContent />
    </Suspense>
  );
}
