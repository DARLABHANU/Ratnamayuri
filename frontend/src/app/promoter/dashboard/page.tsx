"use client";

import { useEffect, useState } from "react";
import { Loader2, Copy, DollarSign, Gift, Percent, Check, FileText, Download } from "lucide-react";
import toast from "react-hot-toast";
import { promoterApi, authApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface PromoterAnalytics {
  total_referred_sales: number;
  total_referred_orders: number;
  pending_commissions: number;
  paid_commissions: number;
  total_commissions: number;
  coupon_count: number;
}

interface PromoterCoupon {
  id: number;
  code: string;
  discount_amount: number;
  promoter_commission: number;
  used_count: number;
  is_active: boolean;
}

interface PromoterCommission {
  id: number;
  order_id: number;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
}

export default function PromoterDashboard() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<PromoterAnalytics | null>(null);
  const [coupons, setCoupons] = useState<PromoterCoupon[]>([]);
  const [commissions, setCommissions] = useState<PromoterCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Payout Settings State
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutIfscCode, setPayoutIfscCode] = useState("");
  const [payoutAccountHolderName, setPayoutAccountHolderName] = useState("");
  const [payoutUpiId, setPayoutUpiId] = useState("");
  const [payoutMode, setPayoutMode] = useState<"upi" | "bank">("upi");
  const [isUpdatingPayout, setIsUpdatingPayout] = useState(false);

  const handleSavePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (payoutMode === "upi") {
      if (!payoutUpiId.trim() || !/^[a-zA-Z0-9.\-_]{2-256}@[a-zA-Z]{2-64}$/.test(payoutUpiId.trim())) {
        toast.error("Please enter a valid UPI ID (e.g. name@okaxis or name@ybl).");
        return;
      }
    } else {
      if (!payoutBankName.trim()) { toast.error("Bank name is required."); return; }
      if (!payoutAccountHolderName.trim()) { toast.error("Account holder name is required."); return; }
      if (!/^\d{9,18}$/.test(payoutAccountNumber.trim())) {
        toast.error("Please enter a valid 9 to 18-digit Bank Account Number.");
        return;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(payoutIfscCode.trim().toUpperCase())) {
        toast.error("Please enter a valid 11-character IFSC Code (e.g. SBIN0001234).");
        return;
      }
    }

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
        payout_ifsc_code: payoutIfscCode.trim().toUpperCase(),
        payout_account_holder_name: payoutAccountHolderName.trim()
      };

      await authApi.updatePayoutSettings(payload);
      toast.success("Payout credentials updated successfully!");
    } catch (err) {
      toast.error("Failed to save payout settings.");
    } finally {
      setIsUpdatingPayout(false);
    }
  };

  useEffect(() => {
    loadPromoterData();
  }, []);

  const loadPromoterData = async () => {
    setIsLoading(true);
    try {
      const [resAnal, resCoups, resComms, resUser] = await Promise.all([
        promoterApi.analytics(),
        promoterApi.coupons(),
        promoterApi.commissions(),
        authApi.me()
      ]);
      setAnalytics(resAnal.data);
      setCoupons(resCoups.data);
      setCommissions(resComms.data);

      const u = resUser.data;
      setPayoutBankName(u.payout_bank_name || "");
      setPayoutAccountNumber(u.payout_account_number || "");
      setPayoutIfscCode(u.payout_ifsc_code || "");
      setPayoutAccountHolderName(u.payout_account_holder_name || "");
      setPayoutUpiId(u.payout_upi_id || "");
      if (u.payout_bank_name || u.payout_account_number) {
        setPayoutMode("bank");
      }
    } catch (err) {
      toast.error("Failed to load promoter details. Please ask admin to assign you an affiliate coupon.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    const affiliateUrl = `${window.location.origin}/?coupon=${code}`;
    navigator.clipboard.writeText(affiliateUrl);
    setCopiedCode(code);
    toast.success("Affiliate link copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '!bg-emerald-700 !text-white font-semibold';
      case 'approved': return '!bg-blue-600 !text-white font-semibold';
      case 'rejected': return '!bg-red-700 !text-white font-semibold';
      default: return '!bg-amber-600 !text-white font-semibold';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="section-tag">AFFILIATE PORTAL</span>
          <h1 className="section-title">Overview <em className="italic">Dashboard</em></h1>
          <div className="divider-gold mx-0 mt-3" />
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/promoter_affiliate_guide.pdf"
            download="Ratnamayuri_Promoter_Affiliate_Guide.pdf"
            className="btn-outline border-gold-400 hover:bg-gold-50 text-brown font-cinzel text-xs font-bold px-4 py-2.5 rounded flex items-center gap-2 transition-all shadow-xs"
          >
            <FileText size={14} className="text-gold-600" />
            <span>DOWNLOAD PDF MANUAL</span>
            <Download size={12} className="text-gold-500" />
          </a>
          {user && (
            <div className="bg-deep border border-gold-500/20 px-5 py-2.5 text-right shadow-sm select-all rounded">
              <p className="font-cinzel text-[9px] tracking-widest text-gold-300 leading-none">YOUR PROMOTER ID</p>
              <p className="font-cinzel text-base font-bold mt-1 text-gold-400 tracking-widest leading-none">#{user.id}</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Grid */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gold-500/10 rounded-full flex items-center justify-center text-gold-600">
              <Gift size={20} />
            </div>
            <div>
              <p className="font-cinzel text-[10px] text-muted tracking-widest leading-none">TOTAL SALES REFERRED</p>
              <h3 className="font-cormorant text-2xl font-bold text-brown mt-2">{formatPrice(analytics.total_referred_sales)}</h3>
              <p className="font-garamond text-xs text-muted mt-0.5">{analytics.total_referred_orders} referred orders</p>
            </div>
          </div>

          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-700">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="font-cinzel text-[10px] text-muted tracking-widest leading-none">TOTAL COMMISSIONS</p>
              <h3 className="font-cormorant text-2xl font-bold text-brown mt-2">{formatPrice(analytics.total_commissions)}</h3>
              <p className="font-garamond text-xs text-muted mt-0.5">Accrued partner earnings</p>
            </div>
          </div>

          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-700">
              <Loader2 size={20} className="animate-spin text-yellow-600" />
            </div>
            <div>
              <p className="font-cinzel text-[10px] text-muted tracking-widest leading-none">PENDING PAYOUT</p>
              <h3 className="font-cormorant text-2xl font-bold text-brown mt-2">{formatPrice(analytics.pending_commissions)}</h3>
              <p className="font-garamond text-xs text-muted mt-0.5">Awaiting admin settlement</p>
            </div>
          </div>

          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-700">
              <Percent size={20} />
            </div>
            <div>
              <p className="font-cinzel text-[10px] text-muted tracking-widest leading-none">ACTIVE REFERRALS</p>
              <h3 className="font-cormorant text-2xl font-bold text-brown mt-2">{analytics.coupon_count} Promo Links</h3>
              <p className="font-garamond text-xs text-muted mt-0.5 font-medium text-gold-600">Referring active coupons</p>
            </div>
          </div>
        </div>
      )}

      {/* Share Links Box */}
      <div className="card p-6">
        <h2 className="font-cinzel text-xs tracking-widest text-brown mb-4">YOUR ACTIVE PROMO CODES & AFFILIATE LINKS</h2>
        <div className="divider-gold mx-0 mb-6" />

        {coupons.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <p className="font-cormorant text-xl mb-1">No active promo codes assigned to you</p>
            <p className="font-garamond text-sm">Please contact support or the administrator at <strong className="text-brown">admin@ratnamayuri.live</strong> to generate your unique referral codes.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="p-4 border border-gold-200 bg-ivory/30 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-cinzel text-sm font-bold text-deep tracking-wider px-2 py-0.5 bg-gold-400">
                      {c.code}
                    </span>
                    <span className="font-garamond text-xs text-green-700 font-semibold">
                      Referrer e-Cut: {formatPrice(c.promoter_commission)} / Sale
                    </span>
                  </div>
                  <p className="font-garamond text-sm text-brown mt-3">
                    Customers get <strong className="text-green-700">{formatPrice(c.discount_amount)} off</strong> their purchase when checking out with this code.
                  </p>
                  <p className="font-garamond text-xs text-muted mt-2 font-mono">
                    Referral Link: {typeof window !== "undefined" ? `${window.location.origin}/?coupon=${c.code}` : `/?coupon=${c.code}`}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(c.code)}
                  className="btn-outline flex items-center justify-center gap-2 w-full py-2 text-xs"
                >
                  {copiedCode === c.code ? <Check size={12} className="text-green-600 animate-scale" /> : <Copy size={12} />}
                  {copiedCode === c.code ? "COPIED!" : "COPY REFERRAL LINK"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referrals & Commissions Ledger */}
      <div className="card p-6">
        <h2 className="font-cinzel text-xs tracking-widest text-brown mb-4">COMMISSIONS REFERRAL LEDGER</h2>
        <div className="divider-gold mx-0 mb-6" />

        {commissions.length === 0 ? (
          <div className="text-center py-12 text-muted font-garamond">
            No referral sales or commissions logged yet. Once customers purchase items using your promo links, they will be registered here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-ivory border-b border-gold-200">
                <tr>
                  <th className="table-th py-3">Commission ID</th>
                  <th className="table-th py-3">Referenced Order</th>
                  <th className="table-th py-3">Earned Commission</th>
                  <th className="table-th py-3">Payout Status</th>
                  <th className="table-th py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-100">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory/20 transition-colors">
                    <td className="table-td py-3 text-muted font-cinzel text-xs font-semibold">#{c.id}</td>
                    <td className="table-td py-3 font-cinzel text-xs text-brown font-semibold">Order #{c.order_id}</td>
                    <td className="table-td py-3 font-cinzel text-sm text-green-700 font-semibold">{formatPrice(c.amount)}</td>
                    <td className="table-td py-3">
                      <span className={`badge text-xs capitalize ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="table-td py-3 font-garamond text-xs text-muted">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Settings Form */}
      <div className="card p-6 border-gold-300">
        <h3 className="font-cinzel text-xs tracking-widest text-brown mb-2">✦ PAYOUT SETTINGS</h3>
        <p className="font-garamond text-xs text-muted mb-4">
          Configure your preferred payout details below. Admin will use these credentials to settle your earned commissions.
        </p>
        <div className="divider-gold mx-0 mb-6" />

        <form onSubmit={handleSavePayoutSettings} className="space-y-5">
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setPayoutMode("upi")}
              className={`font-cinzel text-xs px-4 py-2 transition-all ${payoutMode === "upi" ? "bg-deep text-gold-400" : "border border-gold-200 text-muted"}`}
            >
              UPI PAYOUT
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
                placeholder="e.g. promotername@okaxis"
                className="input-field w-full max-w-md"
                required={payoutMode === "upi"}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">BANK NAME</label>
                <input
                  type="text"
                  value={payoutBankName}
                  onChange={(e) => setPayoutBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="input-field w-full"
                  required={payoutMode === "bank"}
                />
              </div>
              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">ACCOUNT HOLDER NAME</label>
                <input
                  type="text"
                  value={payoutAccountHolderName}
                  onChange={(e) => setPayoutAccountHolderName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="input-field w-full"
                  required={payoutMode === "bank"}
                />
              </div>
              <div>
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
              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2">IFSC CODE</label>
                <input
                  type="text"
                  value={payoutIfscCode}
                  onChange={(e) => setPayoutIfscCode(e.target.value)}
                  placeholder="e.g. SBIN0001234"
                  className="input-field w-full"
                  required={payoutMode === "bank"}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isUpdatingPayout}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {isUpdatingPayout ? (
              <><Loader2 size={12} className="animate-spin" /> SAVING...</>
            ) : (
              "SAVE PAYOUT DETAILS"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
