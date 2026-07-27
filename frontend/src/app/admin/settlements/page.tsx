"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ShieldAlert, Loader2, ArrowRightLeft, DollarSign, Trash2 } from "lucide-react";
import { getApiError } from "@/lib/utils";

import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface SettlementItem {
  id: number;
  order_id: number;
  order_number: string;
  merchant_id: number;
  business_name: string;
  amount: number;
  platform_commission: number;
  status: "escrow_hold" | "released" | "disputed" | "refunded";
  release_date: string;
  created_at: string;
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
  escrow_hold: "Escrow Hold",
  released: "Released",
  disputed: "Disputed",
  refunded: "Refunded",
};

const SETTLEMENT_STATUS_COLORS: Record<string, string> = {
  escrow_hold: "bg-yellow-100 text-yellow-700",
  released: "bg-green-100 text-green-700",
  disputed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
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
          page_size: 10,
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
                        <p className="font-cinzel text-[9px] tracking-wider text-muted">WITHDRAWN</p>
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
                <ArrowRightLeft size={14} className="text-gold-500" /> ESCROW SETTLEMENTS LEDGER
              </h2>
              {/* Filter */}
              <div className="flex gap-2">
                {["", "escrow_hold", "released", "refunded"].map((status) => (
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
                    {status === "" ? "ALL STATUSES" : SETTLEMENT_STATUS_LABELS[status].toUpperCase()}
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
                        <th className="table-th">Merchant</th>
                        <th className="table-th text-right">Merchant share</th>
                        <th className="table-th text-right">Platform Fee</th>
                        <th className="table-th">Status</th>
                        <th className="table-th">Release Date</th>
                        <th className="table-th text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((item) => (
                        <tr key={item.id} className="hover:bg-ivory/30 transition-colors">
                          <td className="table-td font-cinzel text-xs">#{item.id}</td>
                          <td className="table-td font-cinzel text-xs text-gold-700">
                            {item.order_number}
                          </td>
                          <td className="table-td font-garamond text-sm font-medium text-brown">
                            {item.business_name}
                          </td>
                          <td className="table-td font-cinzel text-xs text-right text-green-700">
                            {formatPrice(item.amount)}
                          </td>
                          <td className="table-td font-cinzel text-xs text-right text-gold-700">
                            {formatPrice(item.platform_commission)}
                          </td>
                          <td className="table-td">
                            <span className={`badge py-0.5 px-2 text-[10px] ${SETTLEMENT_STATUS_COLORS[item.status]}`}>
                              {SETTLEMENT_STATUS_LABELS[item.status]}
                            </span>
                          </td>
                          <td className="table-td font-garamond text-xs text-muted">
                            {formatDate(item.release_date)}
                          </td>
                          <td className="table-td text-right">
                            <button
                              onClick={() => handleDeleteSettlement(item.id)}
                              title="Permanently Delete Settlement Record"
                              className="text-muted hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 size={14} />
                            </button>
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
    </div>
  );
}
