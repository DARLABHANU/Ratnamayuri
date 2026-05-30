"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, ArrowDownToLine, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { merchantApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

interface WalletData {
  available_balance: number;
  pending_balance: number;
  withdrawn_balance: number;
}

interface WithdrawalRequest {
  id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  routing_details?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  processed_at?: string;
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function MerchantWalletPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdrawal form state
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingDetails, setRoutingDetails] = useState("");

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") { router.push("/auth/login"); return; }
    loadWallet();
  }, [isAuthenticated, role]);

  const loadWallet = async () => {
    setIsLoading(true);
    try {
      const { data } = await merchantApi.wallet();
      setWallet(data);
    } catch (err) {
      toast.error("Failed to load wallet data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { toast.error("Enter a valid withdrawal amount"); return; }
    if (!bankName.trim()) { toast.error("Bank name is required"); return; }
    if (!accountNumber.trim()) { toast.error("Account number is required"); return; }
    if (wallet && amountNum > wallet.available_balance) {
      toast.error(`Amount exceeds available balance of ${formatPrice(wallet.available_balance)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await merchantApi.requestWithdrawal({
        amount: amountNum,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        routing_details: routingDetails.trim() || undefined,
      });
      toast.success("Withdrawal request submitted! Admin will review within 2 business days.");
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setRoutingDetails("");
      loadWallet();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[500px]">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <span className="section-tag">EARNINGS</span>
        <h1 className="section-title">My <em className="italic">Wallet</em></h1>
        <div className="divider-gold mx-0 mt-3" />
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="card p-6 border-green-200 bg-green-50/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <div>
              <p className="font-cinzel text-[10px] tracking-widest text-muted">AVAILABLE TO WITHDRAW</p>
            </div>
          </div>
          <p className="font-cormorant text-3xl font-bold text-brown">
            {formatPrice(wallet?.available_balance || 0)}
          </p>
          <p className="font-garamond text-xs text-muted mt-1">Ready for bank transfer</p>
        </div>

        {/* Escrow Hold */}
        <div className="card p-6 border-yellow-200 bg-yellow-50/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <Clock size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="font-cinzel text-[10px] tracking-widest text-muted">IN ESCROW (7-DAY HOLD)</p>
            </div>
          </div>
          <p className="font-cormorant text-3xl font-bold text-brown">
            {formatPrice(wallet?.pending_balance || 0)}
          </p>
          <p className="font-garamond text-xs text-muted mt-1">Releases automatically after observation window</p>
        </div>

        {/* Withdrawn */}
        <div className="card p-6 border-blue-200 bg-blue-50/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <ArrowDownToLine size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-cinzel text-[10px] tracking-widest text-muted">TOTAL WITHDRAWN</p>
            </div>
          </div>
          <p className="font-cormorant text-3xl font-bold text-brown">
            {formatPrice(wallet?.withdrawn_balance || 0)}
          </p>
          <p className="font-garamond text-xs text-muted mt-1">Lifetime payouts processed</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card p-4 border-gold-200 bg-gold-50/10 flex items-start gap-3">
        <AlertTriangle size={16} className="text-gold-600 flex-shrink-0 mt-0.5" />
        <p className="font-garamond text-sm text-muted leading-relaxed">
          <strong className="text-brown">Escrow Policy:</strong> Funds from delivered orders enter a <strong>7-day observation window</strong> before becoming available. This protects buyers from return disputes. Once released by the platform scheduler, your balance moves to "Available to Withdraw" automatically.
        </p>
      </div>

      {/* Withdrawal Request Form */}
      <div className="card p-6">
        <h2 className="font-cinzel text-xs tracking-widest text-brown mb-2">REQUEST BANK WITHDRAWAL</h2>
        <div className="divider-gold mx-0 mb-6" />

        {(wallet?.available_balance || 0) <= 0 ? (
          <div className="text-center py-10">
            <Wallet size={36} className="text-gold-200 mx-auto mb-3" />
            <p className="font-cormorant text-xl text-brown mb-1">No funds available yet</p>
            <p className="font-garamond text-sm text-muted">
              Your available balance will appear here once the 7-day escrow window passes for delivered orders.
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdrawal} className="space-y-5 max-w-lg">
            <div>
              <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">
                WITHDRAWAL AMOUNT (MAX: {formatPrice(wallet?.available_balance || 0)})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter amount up to ${formatPrice(wallet?.available_balance || 0)}`}
                className="input-field w-full"
                min="1"
                max={wallet?.available_balance}
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">BANK NAME</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India"
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">
                ACCOUNT NUMBER / UPI ID
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter bank account number or UPI ID"
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">
                IFSC / ROUTING DETAILS <span className="text-muted font-garamond">(optional)</span>
              </label>
              <input
                type="text"
                value={routingDetails}
                onChange={(e) => setRoutingDetails(e.target.value)}
                placeholder="e.g. SBIN0001234"
                className="input-field w-full"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> SUBMITTING...</>
                : <><ArrowDownToLine size={14} /> REQUEST WITHDRAWAL</>
              }
            </button>

            <p className="font-garamond text-xs text-muted">
              🔒 Withdrawal requests are reviewed by the admin team and typically processed within 2 business days.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
