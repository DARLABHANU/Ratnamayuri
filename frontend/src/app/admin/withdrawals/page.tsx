"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Clock, ArrowDownToLine, Trash2, X } from "lucide-react";

import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

type WithdrawalStatus = "pending" | "approved" | "paid" | "rejected";

interface WithdrawalRequest {
  id: number;
  merchant_id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  routing_details?: string;
  utr_number?: string;
  payment_method?: string;
  admin_notes?: string;
  status: WithdrawalStatus;
  created_at: string;
  processed_at?: string;
  merchant?: {
    id: number;
    business_name?: string;
    user?: { full_name: string; email: string; payout_upi_id?: string };
  };
}

const STATUS_COLORS: Record<WithdrawalStatus, string> = {
  pending:  "!bg-amber-600 !text-white font-semibold",
  approved: "!bg-blue-600 !text-white font-semibold",
  paid:     "!bg-emerald-800 !text-white font-semibold",
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

  // Modal State for Offline Payment
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("NEFT");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePayWithdrawal = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await adminApi.payWithdrawal(selectedRequest.id, {
        utr_number: utrNumber.trim() || undefined,
        payment_method: paymentMethod,
        admin_notes: adminNotes.trim() || undefined
      });
      toast.success(`Withdrawal #${selectedRequest.id} marked as PAID & SETTLED!`);
      setSelectedRequest(null);
      setUtrNumber("");
      setAdminNotes("");
      loadRequests();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSubmitting(false);
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
              <p className="font-cinzel text-[10px] tracking-widest text-muted">PENDING PAYOUTS</p>
              <p className="font-cormorant text-xl font-medium text-brown">{formatPrice(pendingTotal)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["", "pending", "approved", "paid", "rejected"] as const).map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`font-cinzel text-xs tracking-wide px-4 py-2 capitalize transition-all
              ${filter === s ? "bg-deep text-gold-400 font-bold" : "border border-gold-200 text-muted hover:border-gold-500"}`}>
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
                      <span className={`badge text-xs capitalize ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}`}>
                        {req.status}
                      </span>
                      <span className="font-cinzel text-base font-bold text-green-700">
                        {formatPrice(req.amount)}
                      </span>
                    </div>
                    <p className="font-garamond text-base font-semibold text-brown">
                      {req.merchant?.business_name || req.merchant?.user?.full_name || `Merchant #${req.merchant_id}`}
                    </p>
                    <p className="font-garamond text-xs text-muted">
                      {req.merchant?.user?.email}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {req.bank_name && (
                        <span className="font-garamond text-xs text-muted">
                          🏦 <strong>{req.bank_name}</strong>
                        </span>
                      )}
                      {req.account_number && (
                        <span className="font-garamond text-xs text-muted font-mono">
                          Acct: <strong>{req.account_number}</strong>
                        </span>
                      )}
                      {req.routing_details && (
                        <span className="font-garamond text-xs text-muted font-mono">
                          IFSC: <strong>{req.routing_details}</strong>
                        </span>
                      )}
                    </div>
                    {req.utr_number && (
                      <p className="font-mono text-xs text-emerald-800 font-semibold pt-1">
                        Ref/UTR: {req.utr_number} ({req.payment_method || "Offline"})
                      </p>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.status !== "paid" && (
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="flex items-center gap-1.5 font-cinzel text-xs px-4 py-2 bg-green-700 text-white hover:bg-green-800 font-bold transition-colors"
                      >
                        <CheckCircle size={14} />
                        PAY &amp; MARK PAID
                      </button>
                    )}
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleAction(req.id, "rejected")}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 font-cinzel text-xs px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={12} />
                        REJECT
                      </button>
                    )}
                    {req.status === "paid" && (
                      <span className="font-garamond text-xs text-green-700 font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> Paid &amp; Settled
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteWithdrawal(req.id)}
                      title="Permanently Delete Withdrawal Request"
                      className="text-muted hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Offline Payout Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg overflow-hidden border-gold-400/50 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 bg-deep text-white">
              <div>
                <span className="font-cinzel text-[10px] tracking-widest text-gold-400 block mb-1">OFFLINE PAYOUT</span>
                <h2 className="font-cinzel text-lg">Settle Withdrawal Request #{selectedRequest.id}</h2>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-gold-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center bg-ivory p-4 border border-gold-200 rounded">
                <div>
                  <p className="font-cinzel text-xs text-muted">PAYOUT AMOUNT</p>
                  <p className="font-cormorant text-2xl font-bold text-deep mt-1">{formatPrice(selectedRequest.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="font-cinzel text-xs text-muted">MERCHANT</p>
                  <p className="font-garamond text-base font-semibold text-deep mt-1">
                    {selectedRequest.merchant?.business_name || selectedRequest.merchant?.user?.full_name || `Merchant #${selectedRequest.merchant_id}`}
                  </p>
                </div>
              </div>

              {/* Merchant Bank Details */}
              <div className="bg-gold-50/60 border border-gold-200 p-4 rounded space-y-2">
                <p className="font-cinzel text-xs font-bold text-brown">MERCHANT BANK / UPI CREDENTIALS</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-garamond text-brown">
                  {selectedRequest.bank_name && <div><span className="text-muted block">Bank Name:</span> <strong>{selectedRequest.bank_name}</strong></div>}
                  {selectedRequest.account_number && <div className="col-span-2"><span className="text-muted block">Account Number:</span> <strong className="font-mono text-sm">{selectedRequest.account_number}</strong></div>}
                  {selectedRequest.routing_details && <div><span className="text-muted block">IFSC Code:</span> <strong className="font-mono uppercase">{selectedRequest.routing_details}</strong></div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-cinzel text-[10px] font-bold text-brown block mb-1">PAYMENT MODE *</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field py-2 text-xs font-garamond bg-white">
                    <option value="NEFT">NEFT Bank Transfer</option>
                    <option value="IMPS">IMPS Instant Transfer</option>
                    <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                    <option value="RTGS">RTGS Transfer</option>
                    <option value="Cash/Manual">Cash / Manual Settlement</option>
                  </select>
                </div>
                <div>
                  <label className="font-cinzel text-[10px] font-bold text-brown block mb-1">OFFLINE UTR / REF NUMBER *</label>
                  <input type="text" placeholder="e.g. UTR123456789" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} className="input-field py-2 text-xs font-mono" />
                </div>
              </div>

              <div>
                <label className="font-cinzel text-[10px] font-bold text-brown block mb-1">ADMIN NOTES (OPTIONAL)</label>
                <input type="text" placeholder="e.g. Sent via IMPS to merchant bank account" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="input-field py-2 text-xs font-garamond" />
              </div>
            </div>

            <div className="p-6 bg-ivory border-t border-gold-200 flex justify-end gap-3">
              <button onClick={() => setSelectedRequest(null)} className="btn-ghost text-xs px-4 py-2" disabled={isSubmitting}>CANCEL</button>
              <button onClick={handlePayWithdrawal} className="btn-primary text-xs px-6 py-2 flex items-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : "MARK PAID & SETTLED"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
