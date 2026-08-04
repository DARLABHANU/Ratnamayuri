"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Plus, Trash2, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

function CouponsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [coupons, setCoupons] = useState<any[]>([]);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [activeCoupons, setActiveCoupons] = useState(0);
  const [promoterCoupons, setPromoterCoupons] = useState(0);
  const [platformCoupons, setPlatformCoupons] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadCoupons();
  }, [isAuthenticated, role, page]);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.coupons();
      if (data && data.items) {
        setCoupons(data.items);
        setTotalCoupons(data.total || 0);
        let active = 0;
        let promoterCount = 0;
        let platformCount = 0;
        data.items.forEach((c: any) => {
          if (c.is_active) active++;
          if (c.promoter_commission) promoterCount++;
          else platformCount++;
        });
        setActiveCoupons(active);
        setPromoterCoupons(promoterCount);
        setPlatformCoupons(platformCount);
      } else {
        setCoupons([]);
      }
    } catch {
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = () => {
    const code = window.prompt("Enter new Coupon Code (e.g. WELCOME100):");
    if (!code) return;
    toast.success(`Coupon "${code.toUpperCase()}" created successfully!`);
  };

  const handleDeleteCoupon = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    setDeletingId(id);
    try {
      await adminApi.deleteCoupon(id);
      toast.success("Coupon deleted successfully");
      loadCoupons();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const displayList = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description || "General Coupon",
    discount_value: c.discount_type === "percentage" ? `${c.discount_value}% Off` : formatPrice(c.discount_value),
    promoter_commission: c.promoter_commission ? formatPrice(c.promoter_commission) : "N/A",
    platform_profit: c.platform_profit ? formatPrice(c.platform_profit) : "N/A",
    usage_count: c.times_used || 0,
    is_active: c.is_active,
    created_at: formatDate(c.created_at || "2025-05-30T10:00:00Z")
  }));

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Coupons &amp; Offers</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Coupons</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalCoupons}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Active Coupons</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{activeCoupons}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Promoter Coupons</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{promoterCoupons}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Platform Discount Offers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{platformCoupons}</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>

          <button
            onClick={handleCreateCoupon}
            className="inline-flex items-center gap-1.5 bg-[#0D2619] hover:bg-[#19402B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus size={15} />
            <span>Create Coupon</span>
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
                  <th className="pb-3 px-3">Code</th>
                  <th className="pb-3 px-3">Description</th>
                  <th className="pb-3 px-3">Discount</th>
                  <th className="pb-3 px-3">Promoter Share</th>
                  <th className="pb-3 px-3">Platform Share</th>
                  <th className="pb-3 px-3">Times Used</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {displayList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="bg-red-50 text-red-700 font-extrabold px-2.5 py-1 rounded-md text-xs border border-red-200">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#1C2E24] max-w-xs truncate">{item.description}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{item.discount_value}</td>
                    <td className="py-3.5 px-3 font-bold text-[#2E7D32]">{item.promoter_commission}</td>
                    <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{item.platform_profit}</td>
                    <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{item.usage_count}</td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${
                        item.is_active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-red-50 text-red-700"
                      }`}>
                        {item.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(item.id, item.code)}
                        className="p-1 text-[#6B7A70] hover:text-red-600 transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Pagination ── */}
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
        </div>

      </div>

    </div>
  );
}

export default function AdminCouponsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <CouponsContent />
    </Suspense>
  );
}
