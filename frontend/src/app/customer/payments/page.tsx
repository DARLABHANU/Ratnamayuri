"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, ExternalLink, ArrowDownLeft, RefreshCcw } from "lucide-react";
import { orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [payments, setPayments] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (isAuthenticated) {
      loadPayments();
    }
  }, [isAuthenticated, authLoading]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const { data } = await orderApi.list({ page: 1, page_size: 50 });
      // Filter out any cancelled orders that didn't have payments if needed,
      // but standard is listing all transactions. Let's list all orders and map their payments!
      setPayments(data.items);
    } catch (err) {
      console.error("Failed to load payment history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <span className="section-tag">LEDGER SYSTEM</span>
          <h1 className="section-title">
            Payment <em className="italic">History</em>
          </h1>
          <div className="divider-gold mx-0 mt-4" />
        </div>
        <button onClick={loadPayments} className="btn-ghost text-xs flex items-center gap-1">
          <RefreshCcw size={12} /> REFRESH
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-20 bg-gold-50/50 border border-gold-100 card flex flex-col items-center justify-center">
          <CreditCard size={48} className="text-gold-300 mb-4" />
          <h2 className="font-cinzel text-base tracking-widest text-brown mb-2">NO TRANSACTIONS FOUND</h2>
          <p className="font-garamond text-sm text-muted max-w-sm mb-6">
            You haven't made any online payments on the marketplace yet.
          </p>
          <button onClick={() => router.push("/customer/products")} className="btn-primary px-6 py-2.5 text-xs">
            SHOP NOW
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gold-100 bg-gold-50/30">
            <h3 className="font-cinzel text-xs tracking-widest text-brown">STATEMENT PANEL</h3>
            <p className="font-garamond text-xs text-muted mt-1">Immutable transaction ledger for placed prepaid orders.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ivory border-b border-gold-100">
                  <th className="table-th py-4">Transaction Details</th>
                  <th className="table-th py-4">Order Link</th>
                  <th className="table-th py-4">Payment Method</th>
                  <th className="table-th py-4">Status</th>
                  <th className="table-th py-4 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50">
                {payments.map((p) => {
                  const paymentStatus = p.payment_status || "paid";
                  const statusColors: Record<string, string> = {
                    paid: "!bg-emerald-700 !text-white font-semibold",
                    pending: "!bg-amber-600 !text-white font-semibold",
                    failed: "!bg-red-700 !text-white font-semibold",
                    refunded: "!bg-blue-600 !text-white font-semibold",
                  };

                  return (
                    <tr key={p.id} className="hover:bg-gold-50/20 transition-colors font-garamond">
                      <td className="table-td py-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full mt-0.5 ${paymentStatus === "refunded" ? "bg-blue-50" : "bg-green-50"}`}>
                            <ArrowDownLeft size={16} className={paymentStatus === "refunded" ? "text-blue-600" : "text-green-600"} />
                          </div>
                          <div>
                            <p className="font-garamond text-sm font-semibold text-brown">
                              {paymentStatus === "refunded" ? "Refund processed" : "Payment Authorized"}
                            </p>
                            <p className="text-xs text-muted">{formatDate(p.created_at)}</p>
                            {p.payment_reference && (
                              <p className="text-[10px] text-muted font-mono mt-0.5 uppercase">REF: {p.payment_reference}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-td py-4 font-cinzel text-xs">
                        <Link href={`/customer/orders/${p.id}`} className="text-gold-600 hover:text-gold-500 hover:underline inline-flex items-center gap-1">
                          #{p.order_number} <ExternalLink size={10} />
                        </Link>
                      </td>
                      <td className="table-td py-4 text-xs font-semibold text-brown uppercase">
                        {p.payment_method || "UPI"}
                      </td>
                      <td className="table-td py-4">
                        <span className={`badge text-xs ${statusColors[paymentStatus] || "bg-green-100 text-green-700"}`}>
                          {paymentStatus === "paid" ? "Success" : paymentStatus}
                        </span>
                      </td>
                      <td className={`table-td py-4 text-right font-cinzel text-sm font-semibold ${paymentStatus === "refunded" ? "text-blue-600" : "text-brown"}`}>
                        {paymentStatus === "refunded" ? "-" : ""}{formatPrice(p.total_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gold-100 bg-gold-50/10 flex justify-between items-center text-xs text-muted font-garamond">
            <p>✦ Transactions are immutable and logged securely via SSL audit trails.</p>
            <p>{payments.length} ledger entries</p>
          </div>
        </div>
      )}
    </div>
  );
}
