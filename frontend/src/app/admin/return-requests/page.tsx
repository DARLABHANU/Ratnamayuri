"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, CheckCircle, XCircle, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

function ReturnRequestsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [requests, setRequests] = useState<any[]>([]);
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [approvedReturns, setApprovedReturns] = useState(0);
  const [rejectedDisputes, setRejectedDisputes] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadReturns();
  }, [isAuthenticated, role, page]);

  const loadReturns = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.returnRequests({ page, page_size: 20 });
      if (data && data.items) {
        setRequests(data.items);
        setTotalDisputes(data.total);
        setTotalPages(data.pages || 1);
        
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        
        data.items.forEach((r: any) => {
          if (r.status === "pending") pending++;
          else if (r.status === "approved") approved++;
          else if (r.status === "rejected") rejected++;
        });
        
        setPendingReview(pending);
        setApprovedReturns(approved);
        setRejectedDisputes(rejected);
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveReturn = async (id: number) => {
    setActionId(id);
    try {
      await (adminApi as any).updateReturnRequest(id, { status: "approved" });
      toast.success("Return request approved!");
      loadReturns();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionId(null);
    }
  };

  const displayList = requests
    .filter(r => 
      String(r.order_id).includes(search) || 
      (r.user?.full_name || "").toLowerCase().includes(search.toLowerCase()) || 
      (r.product?.merchant?.business_name || "").toLowerCase().includes(search.toLowerCase())
    )
    .map((r) => ({
      id: r.id,
      order_number: `#ORD${r.order_id}`,
      customer_name: r.user?.full_name || "Customer",
      store_name: r.product?.merchant?.business_name || "Store",
      reason: r.reason || "Dispute request",
      amount: formatPrice(r.refund_amount || 0),
      status: r.status === "approved" ? "Approved" : r.status === "rejected" ? "Rejected" : "Pending",
      date: formatDate(r.created_at || new Date().toISOString())
    }));

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Disputes &amp; Return Support</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Disputes</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalDisputes}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Pending Review</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{pendingReview}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Approved Returns</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{approvedReturns}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Rejected Claims</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#1C2E24]">{rejectedDisputes}</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input
              type="text"
              placeholder="Search disputes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>
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
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Store Name</th>
                  <th className="pb-3 px-3">Reason for Dispute</th>
                  <th className="pb-3 px-3">Refund Amount</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {displayList.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-[#8C9890]">No return requests found.</td></tr>
                ) : (
                  displayList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{item.order_number}</td>
                      <td className="py-3.5 px-3 font-semibold text-[#1C2E24]">{item.customer_name}</td>
                      <td className="py-3.5 px-3 text-[#556B5D] font-bold">{item.store_name}</td>
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] text-[#556B5D] bg-[#F5F2EA] px-2 py-1 rounded line-clamp-1 max-w-[200px]" title={item.reason}>
                          {item.reason}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{item.amount}</td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${
                          item.status === "Approved" ? "bg-[#E8F5E9] text-[#2E7D32]" : 
                          item.status === "Rejected" ? "bg-red-50 text-red-700" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {item.status === "Approved" ? <CheckCircle size={10} /> : item.status === "Rejected" ? <XCircle size={10} /> : <HelpCircle size={10} />}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleApproveReturn(item.id)}
                                disabled={actionId === item.id}
                                className="bg-[#0D2619] hover:bg-[#19402B] text-white px-2 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
                              >
                                {actionId === item.id ? <Loader2 size={12} className="animate-spin" /> : "Approve"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Pagination ── */}
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

export default function AdminReturnRequestsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <ReturnRequestsContent />
    </Suspense>
  );
}
