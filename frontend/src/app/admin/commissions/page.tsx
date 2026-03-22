"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Commission, CommissionStatus } from "@/types";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

const STATUS_COLORS: Record<CommissionStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  paid:     "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminCommissionsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [payingId, setPayingId] = useState<number | null>(null);

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

  const handlePay = async (id: number) => {
    if (!confirm("Mark this commission as paid?")) return;
    setPayingId(id);
    try {
      await adminApi.payCommission(id);
      toast.success("Commission marked as paid!");
      loadCommissions();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setPayingId(null); }
  };

  const pendingTotal = commissions
    .filter(c => c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
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
      <div className="flex gap-2 mb-6">
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
          <table className="w-full">
            <thead className="bg-ivory">
              <tr>
                <th className="table-th">Commission ID</th>
                <th className="table-th">Order</th>
                <th className="table-th">Promoter ID</th>
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
                  <td className="table-td font-garamond text-sm text-muted">User #{c.promoter_id}</td>
                  <td className="table-td font-cinzel text-sm text-green-700">{formatPrice(c.amount)}</td>
                  <td className="table-td">
                    <span className={`badge text-xs capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="table-td font-garamond text-xs text-muted">
                    {c.paid_at ? formatDate(c.paid_at) : formatDate(c.created_at)}
                  </td>
                  <td className="table-td">
                    {c.status === "pending" && (
                      <button onClick={() => handlePay(c.id)} disabled={payingId === c.id}
                        className="flex items-center gap-1 font-cinzel text-xs text-green-700
                          hover:text-green-600 disabled:opacity-50 transition-colors">
                        {payingId === c.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <CheckCircle size={12} />}
                        PAY
                      </button>
                    )}
                    {c.status === "paid" && <span className="font-garamond text-xs text-green-600">✓ Paid</span>}
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center py-10 font-garamond text-muted">No commissions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
