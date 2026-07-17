"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { Loader2, RefreshCw, AlertCircle, ArrowLeftRight, Check, X, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice, getApiError } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface ReturnRequest {
  id: number;
  order_id: number;
  customer_id: number;
  merchant_id: number;
  reason: string;
  proof_image_url: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  admin_notes: string | null;
  created_at: string;
  customer: {
    full_name: string;
    email: string;
  } | null;
  order: {
    order_number: string;
    total_amount: number;
  } | null;
  merchant: {
    business_name: string;
  } | null;
}

const STATUS_COLORS = {
  pending: "bg-yellow-50 border-yellow-200 text-yellow-800",
  approved: "bg-blue-50 border-blue-200 text-blue-800",
  rejected: "bg-red-50 border-red-200 text-red-800",
  completed: "bg-green-50 border-green-200 text-green-800",
};

export default function AdminReturnRequestsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || (role !== "admin" && role !== "support")) {
      router.push("/auth/login");
      return;
    }
    loadRequests();
  }, [isAuthenticated, role, page]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.returnRequests({ page, page_size: 15 });
      setRequests(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: number, status: "approved" | "rejected") => {
    const verb = status === "approved" ? "Approve" : "Reject";
    const notes = window.prompt(`Enter admin review notes for this ${verb} action (optional):`);
    if (notes === null) return;

    setProcessingId(id);
    try {
      await adminApi.approveReturnRequest(id, { status, admin_notes: notes.trim() || undefined });
      toast.success(`RMA return request successfully ${status}!`);
      loadRequests();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm("Confirm package receipt? This will issue a customer refund, clawback merchant wallet share, and restore inventory stock levels.")) return;

    setProcessingId(id);
    try {
      await adminApi.completeReturnRequest(id);
      toast.success("RMA Return request completed. Refund issued and inventory replenished!");
      loadRequests();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="section-tag">ADMIN CONTROL</span>
          <h1 className="section-title">RMA <em className="italic">Return Requests</em></h1>
          <div className="divider-gold mx-0 mt-3" />
        </div>
        <button onClick={loadRequests} className="btn-ghost flex items-center gap-2 text-xs py-2 px-3">
          <RefreshCw size={14} /> REFRESH
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="card p-12 text-center border-gold-100 max-w-lg mx-auto bg-ivory/30">
          <ArrowLeftRight size={36} className="text-gold-300 mx-auto mb-3" />
          <h3 className="font-cinzel text-xs tracking-wider text-brown font-semibold uppercase">No return request files found</h3>
          <p className="font-garamond text-sm text-muted mt-2">
            Customers have not requested return refunds on any delivered packages yet.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-garamond border-collapse">
              <thead>
                <tr className="bg-ivory border-b border-gold-100 font-cinzel text-[10px] tracking-wider text-brown">
                  <th className="p-4">RMA ID</th>
                  <th className="p-4">ORDER NUMBER</th>
                  <th className="p-4">CUSTOMER</th>
                  <th className="p-4">MERCHANT</th>
                  <th className="p-4">REASON &amp; PROOF</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-gold-100/40 hover:bg-ivory/10 transition-colors">
                    <td className="p-4 font-cinzel text-xs font-semibold text-gold-700">#{r.id}</td>
                    <td className="p-4 font-cinzel text-xs font-semibold text-deep">
                      {r.order ? r.order.order_number : `Order #${r.order_id}`}
                      <p className="text-[10px] font-garamond text-muted font-normal mt-0.5">
                        Amount: {formatPrice(r.order?.total_amount || 0)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-xs text-deep">{r.customer?.full_name || "N/A"}</p>
                      <p className="text-[10px] text-muted font-mono">{r.customer?.email || "No email"}</p>
                    </td>
                    <td className="p-4 text-xs font-semibold text-muted">
                      {r.merchant?.business_name || `Merchant ID #${r.merchant_id}`}
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-xs text-deep italic leading-relaxed font-garamond">"{r.reason}"</p>
                      {r.proof_image_url && (
                        <a
                          href={r.proof_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-gold-700 underline font-cinzel block mt-1 hover:text-gold-900"
                        >
                          View Image Proof ↗
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block border text-[10px] px-2 py-0.5 font-cinzel font-semibold tracking-wider uppercase rounded ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                      {r.admin_notes && (
                        <p className="text-[10px] text-muted italic mt-1 leading-normal">
                          Notes: {r.admin_notes}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {processingId === r.id ? (
                        <Loader2 className="animate-spin text-gold-500 ml-auto" size={16} />
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleAction(r.id, "approved")}
                                className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors"
                                title="Approve Return request"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => handleAction(r.id, "rejected")}
                                className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700 transition-colors"
                                title="Reject Return request"
                              >
                                <X size={12} />
                              </button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <button
                              onClick={() => handleComplete(r.id)}
                              className="bg-green-600 text-white text-[10px] font-cinzel tracking-wider py-1 px-2.5 rounded hover:bg-green-700 transition-colors flex items-center gap-1 font-semibold"
                            >
                              <ShieldAlert size={10} /> COMPLETE &amp; REFUND
                            </button>
                          )}
                          {(r.status === "completed" || r.status === "rejected") && (
                            <span className="text-[10px] text-muted uppercase font-cinzel">Closed</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div className="p-4 border-t border-gold-100 flex items-center justify-between">
              <p className="font-garamond text-xs text-muted">Showing {requests.length} of {total} claims</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost text-xs px-3 py-1 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={requests.length < 15}
                  className="btn-ghost text-xs px-3 py-1 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
