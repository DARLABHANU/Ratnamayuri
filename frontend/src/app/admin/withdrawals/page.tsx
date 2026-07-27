"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Clock, ArrowDownToLine, Trash2 } from "lucide-react";

import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

type WithdrawalStatus = "pending" | "approved" | "rejected";

interface WithdrawalRequest {
  id: number;
  merchant_id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  routing_details?: string;
  status: WithdrawalStatus;
  created_at: string;
  processed_at?: string;
  merchant?: {
    id: number;
    business_name?: string;
    user?: { full_name: string; email: string };
  };
}

const STATUS_COLORS: Record<WithdrawalStatus, string> = {
  pending:  "!bg-amber-600 !text-white font-semibold",
  approved: "!bg-emerald-700 !text-white font-semibold",
  rejected: "!bg-red-700 !text-white font-semibold",
};

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const handleDeleteWithdrawal = async (id: number) => {
    if (!confirm(`Are you sure you want to permanently delete Withdrawal Request #${id} from the database?`)) return;
    setProcessingId(id);
    try {
      await adminApi.deleteWithdrawal(id);
      toast.success("Withdrawal request permanently deleted from database");
      loadRequests();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadRequests();
  }, [isAuthenticated, role, filter, page]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.withdrawals({ page, page_size: 20, status: filter || undefined });
      setRequests(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error("Failed to load withdrawal requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: number, status: "approved" | "rejected") => {
    const verb = status === "approved" ? "Approve" : "Reject";
    if (!confirm(`${verb} this withdrawal request?`)) return;

    setProcessingId(id);
    try {
      await adminApi.approveWithdrawal(id, { status });
      toast.success(`Withdrawal request ${status}!`);
      loadRequests();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const pendingTotal = requests
    .filter(r => r.status === "pending")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="section-tag">FINANCE</span>
          <h1 className="section-title">Withdrawal <em className="italic">Requests</em></h1>
        </div>
        {pendingTotal > 0 && (
          <div className="card p-4 flex items-center gap-3 border-yellow-300 bg-yellow-50/20">
            <Clock size={16} className="text-yellow-600" />
            <div>
              <p className="font-cinzel text-[10px] tracking-widest text-muted">PENDING APPROVALS</p>
              <p className="font-cormorant text-xl font-medium text-brown">{formatPrice(pendingTotal)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["", "pending", "approved", "rejected"] as const).map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`font-cinzel text-xs tracking-wide px-4 py-2 capitalize transition-all
              ${filter === s ? "bg-deep text-gold-400" : "border border-gold-200 text-muted hover:border-gold-500"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-gold-500" size={28} />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="card p-12 text-center">
              <ArrowDownToLine size={36} className="text-gold-200 mx-auto mb-3" />
              <p className="font-cormorant text-xl text-brown">No withdrawal requests found</p>
              <p className="font-garamond text-sm text-muted mt-1">
                {filter ? `No ${filter} requests` : "Merchant withdrawal requests will appear here"}
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="card overflow-hidden">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Merchant + Request Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-cinzel text-xs text-muted">#{req.id}</span>
                      <span className={`badge text-xs capitalize ${STATUS_COLORS[req.status]}`}>
                        {req.status}
                      </span>
                      <span className="font-cinzel text-sm font-bold text-brown">
                        {formatPrice(req.amount)}
                      </span>
                    </div>
                    <p className="font-garamond text-sm text-brown">
                      {req.merchant?.business_name || req.merchant?.user?.full_name || `Merchant #${req.merchant_id}`}
                    </p>
                    <p className="font-garamond text-xs text-muted">
                      {req.merchant?.user?.email}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      <span className="font-garamond text-xs text-muted">
                        🏦 {req.bank_name}
                      </span>
                      <span className="font-garamond text-xs text-muted font-mono">
                        Acct: {req.account_number}
                      </span>
                      {req.routing_details && (
                        <span className="font-garamond text-xs text-muted font-mono">
                          IFSC: {req.routing_details}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="font-garamond text-xs text-muted">
                        Requested: {formatDate(req.created_at)}
                      </span>
                      {req.processed_at && (
                        <span className="font-garamond text-xs text-muted">
                          Processed: {formatDate(req.processed_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAction(req.id, "approved")}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1.5 font-cinzel text-xs px-4 py-2
                            bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {processingId === req.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <CheckCircle size={12} />}
                          APPROVE
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "rejected")}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1.5 font-cinzel text-xs px-4 py-2
                            border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          REJECT
                        </button>
                      </>
                    )}
                    {req.status === "approved" && (
                      <div className="flex items-center gap-1.5 font-cinzel text-xs text-green-600">
                        <CheckCircle size={14} /> Approved & Paid
                      </div>
                    )}
                    {req.status === "rejected" && (
                      <div className="flex items-center gap-1.5 font-cinzel text-xs text-red-500">
                        <XCircle size={14} /> Rejected
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteWithdrawal(req.id)}
                      title="Permanently Delete Withdrawal Request"
                      className="text-muted hover:text-red-600 transition-colors p-1.5 border border-gold-200 rounded hover:bg-red-50 ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center pt-2">
            <p className="font-garamond text-xs text-muted">{total} total requests</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={requests.length < 20}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
