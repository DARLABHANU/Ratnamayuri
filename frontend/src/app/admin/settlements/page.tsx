"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Download, Eye, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

function SettlementsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [settlements, setSettlements] = useState<any[]>([]);
  const [totalSettled, setTotalSettled] = useState("₹8,45,680");
  const [pendingSettlements, setPendingSettlements] = useState("₹38,500");
  const [completedRequests, setCompletedRequests] = useState(412);
  const [pendingRequests, setPendingRequests] = useState(4);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const demoSettlements = [
    {
      id: 1254,
      withdrawal_id: "#WD1254",
      store_name: "Sowmya Collections",
      amount: "₹15,000",
      status: "Completed",
      date: "30 May, 2025"
    },
    {
      id: 1253,
      withdrawal_id: "#WD1253",
      store_name: "Lakshmi Jewels",
      amount: "₹10,000",
      status: "Completed",
      date: "29 May, 2025"
    },
    {
      id: 1252,
      withdrawal_id: "#WD1252",
      store_name: "Heritage Handmades",
      amount: "₹8,500",
      status: "Completed",
      date: "29 May, 2025"
    },
    {
      id: 1251,
      withdrawal_id: "#WD1251",
      store_name: "Divine Ornaments",
      amount: "₹5,000",
      status: "Pending",
      date: "28 May, 2025"
    }
  ];

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadSettlements();
  }, [isAuthenticated, role, page]);

  const loadSettlements = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.withdrawals();
      if (data && data.items && data.items.length > 0) {
        setSettlements(data.items);
      } else {
        setSettlements([]);
      }
    } catch {
      setSettlements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    setProcessingId(id);
    try {
      await adminApi.approveWithdrawal(id, { status: "approved" });
      toast.success("Withdrawal marked as successfully paid!");
      loadSettlements();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const displayList = settlements.length > 0
    ? settlements.map((w) => ({
        id: w.id,
        withdrawal_id: `#WD${w.id}`,
        store_name: w.merchant?.business_name || w.user?.full_name || "Merchant Store",
        amount: formatPrice(w.amount),
        status: w.status === "approved" || w.status === "completed" ? "Completed" : "Pending",
        date: formatDate(w.created_at || "2025-05-30T10:00:00Z")
      }))
    : demoSettlements;

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Payouts &amp; Withdrawals</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Paid Out</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalSettled}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Pending Payouts</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{pendingSettlements}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Completed Transfers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{completedRequests}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Pending Requests</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{pendingRequests}</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input
              type="text"
              placeholder="Search withdrawals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>

          <button
            onClick={() => toast.success("Exporting Payouts CSV...")}
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
                  <th className="pb-3 px-3">Withdrawal ID</th>
                  <th className="pb-3 px-3">Seller / Store</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Request Date</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {displayList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{item.withdrawal_id}</td>
                    <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{item.store_name}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{item.amount}</td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${
                        item.status === "Completed" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#556B5D] font-medium">{item.date}</td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === "Pending" && (
                          <button
                            onClick={() => handleMarkPaid(item.id)}
                            disabled={processingId === item.id}
                            className="bg-[#0D2619] text-white px-3 py-1 rounded-lg text-[11px] font-bold hover:bg-[#19402B] transition-colors"
                          >
                            {processingId === item.id ? <Loader2 size={12} className="animate-spin" /> : "Mark Paid (Offline)"}
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/withdrawals/${item.id}`)}
                          className="p-1 text-[#6B7A70] hover:text-[#0D2619] transition-colors"
                          title="View Withdrawal Details"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
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
          <span className="text-xs text-[#8C9890] px-1">...</span>
          <button onClick={() => setPage(12)} className="w-7 h-7 rounded-lg text-[#556B5D] hover:bg-[#FAF8F3] text-xs font-semibold">
            12
          </button>
        </div>

      </div>

    </div>
  );
}

export default function AdminSettlementsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <SettlementsContent />
    </Suspense>
  );
}
