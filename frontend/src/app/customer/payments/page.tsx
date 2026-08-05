"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, ExternalLink, RefreshCw, ChevronLeft } from "lucide-react";
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
      setPayments(data.items);
    } catch {
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="h-96 flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#0D2619]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">

      {/* ── Desktop Header ── */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 pt-6 pb-2">
        <div className="flex justify-between items-end border-b border-[#F0ECE1] pb-3 mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
              PAYMENT LEDGER
            </span>
            <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">Payment History</h1>
            <p className="text-xs text-[#8C9890] mt-0.5">Immutable transaction ledger for placed prepaid orders</p>
          </div>
          <button
            onClick={loadPayments}
            className="inline-flex items-center gap-1.5 bg-white border border-[#E5E0D5] hover:border-[#0D2619] text-[#1C2E24] px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw size={13} /> REFRESH
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {payments.length === 0 ? (
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto my-8">
            <div className="w-16 h-16 bg-[#FAF8F3] rounded-full flex items-center justify-center mx-auto text-[#8C9890]">
              <CreditCard size={28} />
            </div>
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">No Transactions Found</h2>
            <p className="text-xs text-[#8C9890]">You haven't made any transactions on the marketplace yet.</p>
            <button
              onClick={() => router.push("/customer/products")}
              className="inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              START SHOPPING
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {payments.map((p) => {
                const paymentStatus = p.payment_status || "paid";
                const isPaid = paymentStatus === "paid";
                return (
                  <div key={p.id} className="bg-white border border-[#E5E0D5] rounded-2xl p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-garamond text-xs font-bold text-[#1C2E24]">#{p.order_number}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          isPaid ? "bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-[#F2EFE9]">
                      <div>
                        <p className="text-[11px] text-[#8C9890]">Date: {formatDate(p.created_at)}</p>
                        <p className="text-xs text-[#556B5D] uppercase mt-0.5">{p.payment_method || "Online Razorpay / UPI"}</p>
                      </div>
                      <span className="font-cormorant text-lg font-bold text-[#0D2619]">{formatPrice(p.total_amount)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#F2EFE9]">
                      <Link
                        href={`/customer/orders/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2619] hover:underline"
                      >
                        View Order Details <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-[#E5E0D5] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse font-garamond">
                <thead>
                  <tr className="bg-[#FAF8F3] border-b border-[#E5E0D5] text-xs font-bold text-[#1C2E24]">
                    <th className="py-3.5 px-4">Order Ref</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE9] text-xs">
                  {payments.map((p) => {
                    const paymentStatus = p.payment_status || "paid";
                    const isPaid = paymentStatus === "paid";
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF8F3] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#1C2E24]">
                          <Link href={`/customer/orders/${p.id}`} className="hover:text-[#0D2619] flex items-center gap-1">
                            #{p.order_number} <ExternalLink size={11} className="text-[#8C9890]" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-[#7A6E5D]">{formatDate(p.created_at)}</td>
                        <td className="py-3.5 px-4 uppercase text-[#556B5D]">{p.payment_method || "Online Razorpay / UPI"}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase ${
                              isPaid ? "bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]" : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-cormorant font-bold text-base text-[#0D2619]">
                          {formatPrice(p.total_amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
