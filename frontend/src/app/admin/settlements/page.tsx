"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ShieldAlert, Loader2, ArrowRightLeft, CheckCircle, Trash2, X } from "lucide-react";
import { getApiError } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface MerchantBankDetails {
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  account_holder_name?: string | null;
  upi_id?: string | null;
}

interface SettlementItem {
  id: number;
  order_id: number;
  order_number: string;
  merchant_id: number;
  business_name: string;
  amount: number; // Seller price
  platform_commission: number;
  status: "pending" | "escrow_hold" | "released" | "paid" | "disputed" | "refunded";
  utr_number?: string | null;
  payment_method?: string | null;
  admin_notes?: string | null;
  release_date: string;
  created_at: string;
  merchant_bank_details?: MerchantBankDetails;
}

interface WalletItem {
  id: number;
  merchant_id: number;
  business_name: string;
  pending_balance: number;
  available_balance: number;
  withdrawn_balance: number;
}

const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Offline Pay",
  escrow_hold: "Escrow Hold",
  released: "Released",
  paid: "Paid & Settled",
  disputed: "Disputed",
  refunded: "Refunded",
};

const SETTLEMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 font-semibold",
  escrow_hold: "bg-yellow-100 text-yellow-700 font-semibold",
  released: "bg-blue-100 text-blue-800 font-semibold",
  paid: "bg-emerald-800 text-white font-semibold",
  disputed: "bg-red-100 text-red-700 font-semibold",
  refunded: "bg-gray-100 text-gray-700 font-semibold",
};

export default function AdminSettlementsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [totalSettlements, setTotalSettlements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Settlement Payout Modal state
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementItem | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("NEFT");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteSettlement = async (id: number) => {
    if (!confirm(`Are you sure you want to permanently delete Settlement record #${id} from the database?`)) return;
    try {
      await adminApi.deleteSettlement(id);
      toast.success("Settlement record permanently deleted from database");
      loadData();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") {
      router.push("/auth/login");
      return;
    }
    loadData();
  }, [isAuthenticated, role, statusFilter, page]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [walletsRes, settlementsRes] = await Promise.all([
        adminApi.wallets(),
        adminApi.settlements({
          page,
          page_size: 15,
          status: statusFilter || undefined,
        }),
      ]);
      setWallets(walletsRes.data);
      setSettlements(settlementsRes.data.items);
      setTotalSettlements(settlementsRes.data.total);
      setTotalPages(settlementsRes.data.pages || 1);
    } catch (err) {
      toast.error("Failed to load settlements information.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaySettlement = async () => {
    if (!selectedSettlement) return;
    setIsSubmitting(true);
    try {
      await adminApi.paySettlement(selectedSettlement.id, {
        utr_number: utrNumber.trim() || undefined,
        payment_method: paymentMethod,
        admin_notes: adminNotes.trim() || undefined
      });
      toast.success(`Settlement #${selectedSettlement.id} marked as PAID & SETTLED!`);
      setSelectedSettlement(null);
      setUtrNumber("");
      setAdminNotes("");
      loadData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <span className="section-tag">LEDGER OVERVIEW</span>
        <h1 className="section-title">Merchant Settlements &amp; <em className="italic">Wallets</em></h1>
        <div className="divider-gold mx-0 mt-3" />
      </div>

      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="animate-spin text-gold-500" size={32} />
        </div>
      ) : (
        <>
          {/* Wallets Summary Dashboard Card Grid */}
          <div>
            <h2 className="font-cinzel text-xs tracking-widest text-brown mb-4 flex items-center gap-2">
              <Wallet size={14} className="text-gold-500" /> MERCHANT BALANCES
            </h2>
            {wallets.length === 0 ? (
              <div className="card p-6 text-center text-muted font-garamond">
                No active merchant wallets found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="card p-5 space-y-4">
                    <div>
                      <p className="font-cinzel text-xs text-gold-600 font-bold uppercase truncate">{wallet.business_name}</p>
                      <p className="font-garamond text-xs text-muted">Wallet ID: #{wallet.id}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gold-100">
                      <div>
                        <p className="font-cinzel text-[9px] tracking-wider text-muted">PENDING</p>
                        <p className="font-garamond text-sm font-semibold text-amber-600 mt-0.5">
                          {formatPrice(wallet.pending_balance)}
                        </p>
                      </div>
                      <div>
                        <p className="font-cinzel text-[9px] tracking-wider text-muted">AVAILABLE</p>
                        <p className="font-garamond text-sm font-semibold text-green-600 mt-0.5">
                          {formatPrice(wallet.available_balance)}
                        </p>
                      </div>
                      <div>
                        <p className="font-cinzel text-[9px] tracking-wider text-muted">SETTLED</p>
                        <p className="font-garamond text-sm font-semibold text-brown mt-0.5">
                          {formatPrice(wallet.withdrawn_balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlements Ledger List */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="font-cinzel text-xs tracking-widest text-brown flex items-center gap-2">
                <ArrowRightLeft size={14} className="text-gold-500" /> SELLER SETTLEMENTS LEDGER
              </h2>
              <div className="flex gap-2">
                {["", "pending", "paid", "escrow_hold"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                    className={`font-cinzel text-[10px] tracking-wider px-3 py-1.5 rounded transition-all
                      ${statusFilter === status
                        ? "bg-deep text-gold-400 font-semibold"
                        : "border border-gold-200 text-muted hover:border-gold-500 hover:text-brown"}`}
                  >
                    {status === "" ? "ALL STATUSES" : SETTLEMENT_STATUS_LABELS[status]?.toUpperCase() || status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="card overflow-hidden">
              {settlements.length === 0 ? (
                <div className="p-16 text-center">
                  <ShieldAlert size={36} className="text-gold-300 mx-auto mb-3" />
                  <p className="font-garamond text-muted">No settlements logged on this filter</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-ivory">
                      <tr>
                        <th className="table-th">ID</th>
                        <th className="table-th">Order</th>
                        <th className="table-th">Merchant Store</th>
                        <th className="table-th text-right">Seller Payout</th>
                        <th className="table-th text-right">Platform Fee</th>
                        <th className="table-th">Status</th>
                        <th className="table-th">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((item) => (
                        <tr key={item.id} className="hover:bg-ivory/30 transition-colors">
                          <td className="table-td font-cinzel text-xs">#{item.id}</td>
                          <td className="table-td font-cinzel text-xs text-gold-700">
                            {item.order_number}
                          </td>
                          <td className="table-td font-garamond text-sm text-brown">
                            <div className="font-semibold">{item.business_name}</div>
                            {item.merchant_bank_details?.upi_id && (
                              <div className="text-[11px] font-mono text-gold-700">UPI: {item.merchant_bank_details.upi_id}</div>
                            )}
                          </td>
                          <td className="table-td font-cinzel text-sm text-right text-green-700 font-bold">
                            {formatPrice(item.amount)}
                          </td>
                          <td className="table-td font-cinzel text-xs text-right text-gold-700">
                            {formatPrice(item.platform_commission)}
                          </td>
                          <td className="table-td">
                            <span className={`badge py-0.5 px-2 text-[10px] ${SETTLEMENT_STATUS_COLORS[item.status] || "bg-gray-100 text-gray-700"}`}>
                              {SETTLEMENT_STATUS_LABELS[item.status] || item.status}
                            </span>
                            {item.utr_number && (
                              <span className="block text-[10px] font-mono text-muted mt-0.5">Ref: {item.utr_number}</span>
                            )}
                          </td>
                          <td className="table-td text-right">
                            <div className="flex items-center justify-end gap-2">
                              {item.status !== "paid" && (
                                <button
                                  onClick={() => setSelectedSettlement(item)}
                                  className="flex items-center gap-1 font-cinzel text-xs text-green-800 font-bold border border-green-300 bg-green-50 px-2.5 py-1 rounded hover:bg-green-800 hover:text-white transition-colors"
                                >
                                  <CheckCircle size={12} />
                                  PAY &amp; SETTLE
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSettlement(item.id)}
                                title="Permanently Delete Settlement Record"
                                className="text-muted hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gold-100 flex items-center justify-between">
                  <p className="font-garamond text-xs text-muted">
                    Showing {settlements.length} of {totalSettlements} settlements
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-ghost text-xs px-3 py-1 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn-ghost text-xs px-3 py-1 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Offline Payout Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg overflow-hidden border-gold-400/50 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 bg-deep text-white">
              <div>
                <span className="font-cinzel text-[10px] tracking-widest text-gold-400 block mb-1">OFFLINE SETTLEMENT</span>
                <h2 className="font-cinzel text-lg">Settle Merchant Payout #{selectedSettlement.id}</h2>
              </div>
              <button onClick={() => setSelectedSettlement(null)} className="text-gold-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center bg-ivory p-4 border border-gold-200 rounded">
                <div>
                  <p className="font-cinzel text-xs text-muted">SELLER BASE PAYOUT</p>
                  <p className="font-cormorant text-2xl font-bold text-deep mt-1">{formatPrice(selectedSettlement.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="font-cinzel text-xs text-muted">STORE NAME</p>
                  <p className="font-garamond text-base font-semibold text-deep mt-1">{selectedSettlement.business_name}</p>
                </div>
              </div>

              {/* Merchant Bank & UPI Details */}
              <div className="bg-gold-50/60 border border-gold-200 p-4 rounded space-y-2">
                <p className="font-cinzel text-xs font-bold text-brown">MERCHANT PAYOUT BANK / UPI CREDENTIALS</p>
                {selectedSettlement.merchant_bank_details?.account_number ? (
                  <div className="grid grid-cols-2 gap-2 text-xs font-garamond text-brown">
                    <div><span className="text-muted block">Bank Name:</span> <strong>{selectedSettlement.merchant_bank_details.bank_name || "N/A"}</strong></div>
                    <div><span className="text-muted block">Account Holder:</span> <strong>{selectedSettlement.merchant_bank_details.account_holder_name || "N/A"}</strong></div>
                    <div className="col-span-2"><span className="text-muted block">Account Number:</span> <strong className="font-mono text-sm">{selectedSettlement.merchant_bank_details.account_number}</strong></div>
                    <div><span className="text-muted block">IFSC Code:</span> <strong className="font-mono uppercase">{selectedSettlement.merchant_bank_details.ifsc_code}</strong></div>
                    {selectedSettlement.merchant_bank_details.upi_id && (
                      <div><span className="text-muted block">UPI ID:</span> <strong className="font-mono text-emerald-800">{selectedSettlement.merchant_bank_details.upi_id}</strong></div>
                    )}
                  </div>
                ) : selectedSettlement.merchant_bank_details?.upi_id ? (
                  <div className="text-xs font-garamond text-brown">
                    <span className="text-muted block">UPI ID:</span> <strong className="font-mono text-sm text-emerald-800">{selectedSettlement.merchant_bank_details.upi_id}</strong>
                  </div>
                ) : (
                  <p className="text-xs font-garamond text-amber-800 italic">
                    ⚠️ Seller has not saved payout bank details yet. Send payout to seller's registered contact number or bank account.
                  </p>
                )}
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
                <input type="text" placeholder="e.g. Paid seller base price ₹500 via IMPS" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="input-field py-2 text-xs font-garamond" />
              </div>
            </div>

            <div className="p-6 bg-ivory border-t border-gold-200 flex justify-end gap-3">
              <button onClick={() => setSelectedSettlement(null)} className="btn-ghost text-xs px-4 py-2" disabled={isSubmitting}>CANCEL</button>
              <button onClick={handlePaySettlement} className="btn-primary text-xs px-6 py-2 flex items-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : "MARK PAID & SETTLED"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
