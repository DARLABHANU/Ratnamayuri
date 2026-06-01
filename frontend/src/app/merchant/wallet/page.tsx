"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, ArrowDownToLine, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { merchantApi, authApi } from "@/lib/api";
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

  // Payout Profile Settings State
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutIfscCode, setPayoutIfscCode] = useState("");
  const [payoutAccountHolderName, setPayoutAccountHolderName] = useState("");
  const [payoutUpiId, setPayoutUpiId] = useState("");
  const [payoutMode, setPayoutMode] = useState<"upi" | "bank">("bank");
  const [isUpdatingPayout, setIsUpdatingPayout] = useState(false);

  const handleSavePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPayout(true);
    try {
      const payload = payoutMode === "upi" ? {
        payout_upi_id: payoutUpiId.trim(),
        payout_bank_name: "",
        payout_account_number: "",
        payout_ifsc_code: "",
        payout_account_holder_name: ""
      } : {
        payout_upi_id: "",
        payout_bank_name: payoutBankName.trim(),
        payout_account_number: payoutAccountNumber.trim(),
        payout_ifsc_code: payoutIfscCode.trim(),
        payout_account_holder_name: payoutAccountHolderName.trim()
      };

      await authApi.updatePayoutSettings(payload);
      toast.success("Payout details saved in your profile!");
      
      // Dynamically pre-fill current form fields
      if (payoutMode === "bank") {
        setBankName(payoutBankName.trim());
        setAccountNumber(payoutAccountNumber.trim());
        setRoutingDetails(payoutIfscCode.trim());
      } else {
        setBankName("UPI Payout");
        setAccountNumber(payoutUpiId.trim());
        setRoutingDetails("");
      }
    } catch (err) {
      toast.error("Failed to save payout profile.");
    } finally {
      setIsUpdatingPayout(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") { router.push("/auth/login"); return; }
    loadWallet();
  }, [isAuthenticated, role]);

  const loadWallet = async () => {
    setIsLoading(true);
    try {
      const [resWallet, resUser] = await Promise.all([
        merchantApi.wallet(),
        authApi.me()
      ]);
      setWallet(resWallet.data);

      const u = resUser.data;
      // Pre-fill payout settings profile form
      setPayoutBankName(u.payout_bank_name || "");
      setPayoutAccountNumber(u.payout_account_number || "");
      setPayoutIfscCode(u.payout_ifsc_code || "");
      setPayoutAccountHolderName(u.payout_account_holder_name || "");
      setPayoutUpiId(u.payout_upi_id || "");
      if (u.payout_upi_id && !u.payout_bank_name) {
        setPayoutMode("upi");
      }

      // Pre-fill active withdrawal form fields
      if (u.payout_bank_name) {
        setBankName(u.payout_bank_name);
        setAccountNumber(u.payout_account_number);
        setRoutingDetails(u.payout_ifsc_code || "");
      } else if (u.payout_upi_id) {
        setBankName("UPI Payout");
        setAccountNumber(u.payout_upi_id);
        setRoutingDetails("");
      }
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

      {/* Payout & Withdrawal Panel (2-column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: Payout Profile Settings */}
        <div className="card p-6">
          <h2 className="font-cinzel text-xs tracking-widest text-brown mb-2">✦ PAYOUT PROFILE SETTINGS</h2>
          <p className="font-garamond text-xs text-muted mb-4">
            Configure your permanent bank account or UPI details. These will pre-fill your withdrawal requests automatically.
          </p>
          <div className="divider-gold mx-0 mb-6" />

          <form onSubmit={handleSavePayoutSettings} className="space-y-5">
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setPayoutMode("upi")}
                className={`font-cinzel text-xs px-4 py-2 transition-all ${payoutMode === "upi" ? "bg-deep text-gold-400" : "border border-gold-200 text-muted"}`}
              >
                UPI ID
              </button>
              <button
                type="button"
                onClick={() => setPayoutMode("bank")}
                className={`font-cinzel text-xs px-4 py-2 transition-all ${payoutMode === "bank" ? "bg-deep text-gold-400" : "border border-gold-200 text-muted"}`}
              >
                BANK ACCOUNT
              </button>
            </div>

            {payoutMode === "upi" ? (
              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">UPI ID</label>
                <input
                  type="text"
                  value={payoutUpiId}
                  onChange={(e) => setPayoutUpiId(e.target.value)}
                  placeholder="e.g. merchantname@okicici"
                  className="input-field w-full"
                  required={payoutMode === "upi"}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">ACCOUNT HOLDER NAME</label>
                  <input
                    type="text"
                    value={payoutAccountHolderName}
                    onChange={(e) => setPayoutAccountHolderName(e.target.value)}
                    placeholder="e.g. Pearl Saree Store Pvt Ltd"
                    className="input-field w-full"
                    required={payoutMode === "bank"}
                  />
                </div>
                <div>
                  <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">BANK NAME</label>
                  <input
                    type="text"
                    value={payoutBankName}
                    onChange={(e) => setPayoutBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="input-field w-full"
                    required={payoutMode === "bank"}
                  />
                </div>
                <div>
                  <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">IFSC CODE</label>
                  <input
                    type="text"
                    value={payoutIfscCode}
                    onChange={(e) => setPayoutIfscCode(e.target.value)}
                    placeholder="e.g. HDFC0000123"
                    className="input-field w-full"
                    required={payoutMode === "bank"}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">ACCOUNT NUMBER</label>
                  <input
                    type="text"
                    value={payoutAccountNumber}
                    onChange={(e) => setPayoutAccountNumber(e.target.value)}
                    placeholder="Bank account number"
                    className="input-field w-full"
                    required={payoutMode === "bank"}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPayout}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-xs disabled:opacity-60"
            >
              {isUpdatingPayout ? (
                <><Loader2 size={12} className="animate-spin" /> SAVING...</>
              ) : (
                "SAVE PAYOUT PROFILE"
              )}
            </button>
          </form>
        </div>

        {/* Column 2: Withdrawal Request Form */}
        <div className="card p-6">
          <h2 className="font-cinzel text-xs tracking-widest text-brown mb-2">✦ REQUEST WITHDRAWAL</h2>
          <p className="font-garamond text-xs text-muted mb-4">
            Initiate a payout request to your chosen bank account or UPI ID. Your saved details are pre-filled below.
          </p>
          <div className="divider-gold mx-0 mb-6" />

          {(wallet?.available_balance || 0) <= 0 ? (
            <div className="text-center py-12">
              <Wallet size={36} className="text-gold-200 mx-auto mb-3" />
              <p className="font-cormorant text-xl text-brown mb-1">No funds available yet</p>
              <p className="font-garamond text-sm text-muted">
                Available balance will appear once the 7-day escrow passes for delivered orders.
              </p>
            </div>
          ) : (
            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">
                  WITHDRAWAL AMOUNT (MAX: {formatPrice(wallet?.available_balance || 0)})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`e.g. 5000`}
                  className="input-field w-full"
                  min="1"
                  max={wallet?.available_balance}
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">BANK NAME / UPI MODE</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India or 'UPI Payout'"
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">ACCOUNT NUMBER / UPI ID</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter bank account or UPI ID"
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
                className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-xs disabled:opacity-60"
              >
                {isSubmitting
                  ? <><Loader2 size={12} className="animate-spin" /> SUBMITTING...</>
                  : <><ArrowDownToLine size={12} /> REQUEST WITHDRAWAL</>
                }
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
