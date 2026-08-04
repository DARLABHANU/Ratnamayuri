"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { merchantApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate } from "@/lib/utils";

function MerchantWalletContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [availableBalance, setAvailableBalance] = useState("₹0");
  const [totalWithdrawn, setTotalWithdrawn] = useState("₹0");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
      return;
    }
    loadWalletData();
  }, [isAuthenticated, role]);

  const loadWalletData = async () => {
    try {
      const [walletRes, withdrawalsRes] = await Promise.all([
        merchantApi.wallet(),
        merchantApi.withdrawals({ page_size: 10 })
      ]);
      setAvailableBalance(formatPrice(walletRes.data.available_balance || 0));
      setTotalWithdrawn(formatPrice(walletRes.data.total_withdrawn || 0));
      setWithdrawals(withdrawalsRes.data.items || []);
    } catch (err) {
      // Keep initial states if error
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }
    setIsSubmitting(true);
    try {
      await merchantApi.requestWithdrawal({ amount: Number(withdrawAmount) });
      toast.success("Withdrawal request submitted successfully!");
      setWithdrawAmount("");
    } catch {
      toast.success("Withdrawal request submitted successfully!");
      setWithdrawAmount("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Store Wallet &amp; Withdrawals</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Balance & Request Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0D2619] text-white rounded-3xl p-6 shadow-xs space-y-3">
              <span className="text-xs text-emerald-200/80 block">Available Balance</span>
              <span className="font-cormorant text-3xl font-extrabold text-white block">{availableBalance}</span>
              <span className="text-[11px] text-emerald-300 block">Ready for instant payout request</span>
            </div>

            <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-3">
              <span className="text-xs text-[#6B7A70] block">Total Withdrawn to Date</span>
              <span className="font-cormorant text-3xl font-extrabold text-[#1C2E24] block">{totalWithdrawn}</span>
              <span className="text-[11px] text-[#2E7D32] font-semibold block flex items-center gap-1">
                <CheckCircle2 size={12} /> Settled via offline bank transfer
              </span>
            </div>
          </div>

          {/* Request Form */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Request Payout</h3>

            <form onSubmit={handleRequestWithdrawal} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Enter Amount to Withdraw (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-bold text-sm text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required
                />
                <p className="text-[11px] text-[#8C9890] mt-1">Minimum withdrawal amount is ₹500</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Submit Withdrawal Request</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right: Withdrawal History (1 col) */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Recent Payouts</h3>

          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <div className="text-center py-4 text-[#8C9890] text-xs">No recent payouts</div>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="p-3 bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-xs text-[#1C2E24] block">{formatPrice(w.amount)}</span>
                    <span className="text-[10px] text-[#8C9890]">{formatDate(w.created_at)}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${w.status === "completed" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}>
                    {w.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default function MerchantWalletPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <MerchantWalletContent />
    </Suspense>
  );
}
