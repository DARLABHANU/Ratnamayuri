"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, DollarSign, X, Trash2 } from "lucide-react";

import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Commission, CommissionStatus } from "@/types";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

const STATUS_COLORS: Record<CommissionStatus, string> = {
  pending:  "!bg-amber-600 !text-white font-semibold",
  approved: "!bg-blue-600 !text-white font-semibold",
  paid:     "!bg-emerald-700 !text-white font-semibold",
  rejected: "!bg-red-700 !text-white font-semibold",
};

export default function AdminCommissionsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [payingId, setPayingId] = useState<number | null>(null);

  const handleDeleteCommission = async (id: number) => {
    if (!confirm(`Are you sure you want to permanently delete Commission record #${id} from the database?`)) return;
    setPayingId(id);
    try {
      await adminApi.deleteCommission(id);
      toast.success("Commission record permanently deleted from database");
      loadCommissions();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setPayingId(null);
    }
  };

  // Payout Modal State
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [transactionNotes, setTransactionNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") { router.push("/auth/login"); return; }
    loadCommissions();
  }, [isAuthenticated, role, filter]);

  const loadCommissions = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.commissions({ status: filter || undefined });
      setCommissions(data);
    } finally { setIsLoading(false); }
  };

  const handlePay = async () => {
    if (!selectedCommission) return;
    setIsSubmitting(true);
    try {
      await adminApi.payCommission(selectedCommission.id, { notes: transactionNotes });
      toast.success("Commission marked as paid and reference saved!");
      setSelectedCommission(null);
      loadCommissions();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingTotal = commissions
    .filter(c => c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="section-tag">PAYOUTS</span>
          <h1 className="section-title">Commission <em className="italic">Management</em></h1>
        </div>
        {pendingTotal > 0 && (
          <div className="card p-4 flex items-center gap-3 border-gold-400">
            <DollarSign size={16} className="text-gold-600" />
            <div>
              <p className="font-cinzel text-xs tracking-widest text-muted">PENDING PAYOUT</p>
              <p className="font-cormorant text-xl font-medium text-brown">{formatPrice(pendingTotal)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["","pending","approved","paid","rejected"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`font-cinzel text-xs tracking-wide px-4 py-2 capitalize transition-all
              ${filter === s ? "bg-deep text-gold-400" : "border border-gold-200 text-muted hover:border-gold-500"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-ivory">
              <tr>
                <th className="table-th">Commission ID</th>
                <th className="table-th">Order</th>
                <th className="table-th">Promoter</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="table-td font-cinzel text-xs text-muted">#{c.id}</td>
                  <td className="table-td font-cinzel text-xs text-gold-700">Order #{c.order_id}</td>
                  <td className="table-td font-garamond text-sm text-deep">
                    <div className="font-semibold">{c.promoter?.full_name || `User #${c.promoter_id}`}</div>
                    <div className="text-xs text-muted">{c.promoter?.email || "No email"}</div>
                  </td>
                  <td className="table-td font-cinzel text-sm text-green-700">{formatPrice(c.amount)}</td>
                  <td className="table-td">
                    <span className={`badge text-xs capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="table-td font-garamond text-xs text-muted">
                    {c.paid_at ? formatDate(c.paid_at) : formatDate(c.created_at)}
                  </td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-2">
                      {["pending", "approved"].includes(c.status) && (
                        <button onClick={() => setSelectedCommission(c)}
                          className="flex items-center gap-1 font-cinzel text-xs text-green-700 font-semibold border border-green-200 bg-green-50 px-2.5 py-1.5 rounded-sm hover:bg-green-100 hover:text-green-800 transition-colors">
                          <CheckCircle size={12} />
                          PAY
                        </button>
                      )}
                      {c.status === "paid" && (
                        <div className="space-y-0.5">
                          <span className="font-garamond text-xs text-green-600 font-semibold block">✓ Paid</span>
                          {c.notes && (
                            <span className="block text-[10px] text-muted font-mono max-w-[150px] truncate" title={c.notes}>
                              Ref: {c.notes}
                            </span>
                          )}
                        </div>
                      )}
                      <button onClick={() => handleDeleteCommission(c.id)}
                        title="Permanently Delete Commission Record"
                        className="text-muted hover:text-red-600 transition-colors p-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center py-10 font-garamond text-muted">No commissions found</td></tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Details Modal */}
      {selectedCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg overflow-hidden border-gold-400/50 shadow-2xl animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 bg-deep border-b border-gold-900/20 text-white">
              <div>
                <span className="font-cinzel text-[10px] tracking-[0.2em] text-gold-400 block mb-1">SETTLE PAYMENT</span>
                <h2 className="font-cinzel text-lg tracking-wide">Settle Commission #{selectedCommission.id}</h2>
              </div>
              <button onClick={() => setSelectedCommission(null)} className="text-gold-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Commission Summary */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-ivory p-4 border border-gold-200">
                <div>
                  <p className="font-cinzel text-xs text-muted">COMMISSION AMOUNT</p>
                  <p className="font-cormorant text-2xl font-semibold text-deep mt-1">{formatPrice(selectedCommission.amount)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-cinzel text-xs text-muted">ORDER REFERENCE</p>
                  <p className="font-garamond text-base text-deep mt-1">Order #{selectedCommission.order_id}</p>
                </div>
              </div>

              {/* Promoter Profile */}
              <div>
                <h3 className="font-cinzel text-xs tracking-wider text-brown mb-2 border-b border-gold-100 pb-1">PROMOTER INFO</h3>
                <div className="space-y-1">
                  <p className="font-garamond text-base text-deep">
                    <span className="font-semibold">Name:</span> {selectedCommission.promoter?.full_name || "N/A"}
                  </p>
                  <p className="font-garamond text-sm text-muted">
                    <span className="font-semibold">Email:</span> {selectedCommission.promoter?.email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Payout Details */}
              <div>
                <h3 className="font-cinzel text-xs tracking-wider text-brown mb-2 border-b border-gold-100 pb-1">PAYOUT CREDENTIALS</h3>
                
                {!selectedCommission.promoter?.payout_bank_name && !selectedCommission.promoter?.payout_upi_id ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-xs font-garamond rounded space-y-1">
                    <p className="font-semibold text-sm">⚠️ No Payout Details Registered</p>
                    <p>This promoter has not added any Bank Account or UPI ID details yet. Please verify payment details manually or contact the promoter before completing payout.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bank Account Section */}
                    {selectedCommission.promoter?.payout_bank_name && (
                      <div className="bg-ivory/50 border border-gold-200/50 p-4 rounded">
                        <p className="font-cinzel text-[10px] tracking-wider text-gold-700 mb-2 font-semibold">BANK TRANSFER DETAILS</p>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm font-garamond text-deep">
                          <div>
                            <span className="text-xs text-muted block">Bank Name</span>
                            <span className="font-medium">{selectedCommission.promoter.payout_bank_name}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted block">Account Holder</span>
                            <span className="font-medium">{selectedCommission.promoter.payout_account_holder_name || "N/A"}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs text-muted block">Account Number</span>
                            <span className="font-mono text-sm tracking-wider font-semibold">{selectedCommission.promoter.payout_account_number}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted block">IFSC Code</span>
                            <span className="font-mono text-sm tracking-wider uppercase font-semibold text-gold-800">{selectedCommission.promoter.payout_ifsc_code}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI ID Section */}
                    {selectedCommission.promoter?.payout_upi_id && (
                      <div className="bg-ivory/50 border border-gold-200/50 p-4 rounded">
                        <p className="font-cinzel text-[10px] tracking-wider text-gold-700 mb-2 font-semibold">UPI ID</p>
                        <div className="font-garamond text-deep">
                          <span className="text-xs text-muted block">UPI Address</span>
                          <span className="font-mono text-sm tracking-wider font-semibold text-gold-800">{selectedCommission.promoter.payout_upi_id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Transaction Reference / Notes */}
              <div>
                <label className="font-cinzel text-xs tracking-wider text-brown block mb-2">
                  TRANSACTION REF / NOTES
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref: 1234567890, Bank Transfer Ref: N1234"
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  className="w-full font-garamond px-4 py-2 border border-gold-300 focus:outline-none focus:border-gold-600 bg-white"
                />
                <span className="font-garamond text-[11px] text-muted mt-1 block leading-relaxed">
                  Add transaction IDs, notes, or reference numbers to track this payout in the database.
                </span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-ivory border-t border-gold-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedCommission(null)}
                className="font-cinzel text-xs tracking-wide px-4 py-2 border border-gold-300 hover:border-gold-600 text-muted transition-all"
                disabled={isSubmitting}
              >
                CANCEL
              </button>
              <button
                onClick={handlePay}
                className="font-cinzel text-xs tracking-wide px-6 py-2 bg-deep text-gold-400 hover:bg-deep-hover hover:text-gold-300 transition-all flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    SETTLING...
                  </>
                ) : (
                  "SETTLE PAYOUT"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

