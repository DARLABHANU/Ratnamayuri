"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Gift, DollarSign, Percent, Loader2, FileText, Download } from "lucide-react";
import toast from "react-hot-toast";
import { promoterApi, authApi } from "@/lib/api";
import { Coupon } from "@/types";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface PromoterAnalytics {
  total_referred_sales: number;
  total_referred_orders: number;
  total_commissions: number;
  pending_commissions: number;
  coupon_count: number;
}

interface CommissionItem {
  id: number;
  order_id: number;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  created_at: string;
}

export default function PromoterDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [analytics, setAnalytics] = useState<PromoterAnalytics | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Payout Settings State
  const [payoutMode, setPayoutMode] = useState<"upi" | "bank">("upi");
  const [payoutUpiId, setPayoutUpiId] = useState("");
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountHolderName, setPayoutAccountHolderName] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutIfscCode, setPayoutIfscCode] = useState("");
  const [isUpdatingPayout, setIsUpdatingPayout] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, couponsRes, commissionsRes] = await Promise.all([
        promoterApi.analytics(),
        promoterApi.coupons(),
        promoterApi.commissions(),
      ]);

      setAnalytics(analyticsRes.data);
      setCoupons(couponsRes.data);
      setCommissions(commissionsRes.data);

      if ((user as any)?.payout_settings) {
        const ps = (user as any).payout_settings as any;
        if (ps.mode) setPayoutMode(ps.mode);
        if (ps.upi_id) setPayoutUpiId(ps.upi_id);
        if (ps.bank_name) setPayoutBankName(ps.bank_name);
        if (ps.account_holder_name) setPayoutAccountHolderName(ps.account_holder_name);
        if (ps.account_number) setPayoutAccountNumber(ps.account_number);
        if (ps.ifsc_code) setPayoutIfscCode(ps.ifsc_code);
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const referralLink = `${origin}/?coupon=${code}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(code);
    toast.success(`Referral link for coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleSavePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPayout(true);

    try {
      const payload = {
        mode: payoutMode,
        upi_id: payoutMode === "upi" ? payoutUpiId : undefined,
        bank_name: payoutMode === "bank" ? payoutBankName : undefined,
        account_holder_name: payoutMode === "bank" ? payoutAccountHolderName : undefined,
        account_number: payoutMode === "bank" ? payoutAccountNumber : undefined,
        ifsc_code: payoutMode === "bank" ? payoutIfscCode : undefined,
      };

      await authApi.updatePayoutSettings(payload);
      toast.success("Payout settings saved successfully!");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsUpdatingPayout(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-[#E8F5E9] text-[#2E7D32]";
      case "approved":
        return "bg-[#E3F2FD] text-[#1565C0]";
      case "pending":
        return "bg-[#FFF3E0] text-[#E65100]";
      case "rejected":
        return "bg-[#FFEBEE] text-[#C62828]";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="animate-spin text-[#0D2619]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Affiliate Overview Dashboard</h1>
          <p className="text-xs text-[#8C9890] mt-0.5">Track your promo sales, referral links, and earnings payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/promoter_affiliate_guide.pdf"
            download="Ratnamayuri_Promoter_Affiliate_Guide.pdf"
            className="inline-flex items-center gap-2 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <FileText size={14} />
            <span>Download PDF Manual</span>
            <Download size={12} />
          </a>
          {user && (
            <div className="bg-[#0D2619] text-white px-4 py-2 rounded-xl text-right shadow-2xs select-all">
              <p className="text-[10px] text-emerald-300 font-bold uppercase">PROMOTER ID</p>
              <p className="font-cormorant text-lg font-bold text-white leading-tight">#{user.id}</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Grid */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 bg-[#E8F5E9] text-[#2E7D32] rounded-2xl flex items-center justify-center">
              <Gift size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7A70] mb-0.5">Total Sales Referred</p>
              <h3 className="font-cormorant text-2xl font-extrabold text-[#1C2E24]">{formatPrice(analytics.total_referred_sales)}</h3>
              <p className="text-[10px] text-[#8C9890] mt-0.5">{analytics.total_referred_orders} referred orders</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 bg-[#E3F2FD] text-[#1565C0] rounded-2xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7A70] mb-0.5">Total Commissions</p>
              <h3 className="font-cormorant text-2xl font-extrabold text-[#1C2E24]">{formatPrice(analytics.total_commissions)}</h3>
              <p className="text-[10px] text-[#8C9890] mt-0.5">Accrued partner earnings</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FFF3E0] text-[#E65100] rounded-2xl flex items-center justify-center">
              <Loader2 size={20} className="animate-spin" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7A70] mb-0.5">Pending Payout</p>
              <h3 className="font-cormorant text-2xl font-extrabold text-[#1C2E24]">{formatPrice(analytics.pending_commissions)}</h3>
              <p className="text-[10px] text-[#8C9890] mt-0.5">Awaiting admin settlement</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 bg-[#F3E5F5] text-[#7B1FA2] rounded-2xl flex items-center justify-center">
              <Percent size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7A70] mb-0.5">Active Referrals</p>
              <h3 className="font-cormorant text-2xl font-extrabold text-[#1C2E24]">{analytics.coupon_count} Promo Links</h3>
              <p className="text-[10px] text-[#2E7D32] font-semibold mt-0.5">Referring active coupons</p>
            </div>
          </div>
        </div>
      )}

      {/* Share Links Box */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Active Promo Codes &amp; Affiliate Links</h2>

        {coupons.length === 0 ? (
          <div className="text-center py-10 text-[#8C9890]">
            <p className="font-cormorant text-xl mb-1 text-[#1C2E24]">No active promo codes assigned to you</p>
            <p className="text-xs">Please contact support or the administrator at <strong className="text-[#0D2619]">admin@ratnamayuri.live</strong> to generate your unique referral codes.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="p-4 border border-[#E5E0D5] bg-[#FAF8F3] rounded-2xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs bg-[#0D2619] text-white px-2.5 py-1 rounded-lg tracking-wider">
                      {c.code}
                    </span>
                    <span className="text-xs text-[#2E7D32] font-bold">
                      Referrer e-Cut: {formatPrice(c.promoter_commission)} / Sale
                    </span>
                  </div>
                  <p className="text-xs text-[#556B5D] mt-3">
                    Customers get <strong className="text-[#2E7D32]">{formatPrice(c.discount_amount)} off</strong> their purchase when checking out with this code.
                  </p>
                  <p className="text-[11px] text-[#8C9890] mt-2 font-mono truncate">
                    Referral Link: {typeof window !== "undefined" ? `${window.location.origin}/?coupon=${c.code}` : `/?coupon=${c.code}`}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(c.code)}
                  className="w-full inline-flex items-center justify-center gap-2 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  {copiedCode === c.code ? <Check size={14} className="text-emerald-500 animate-scale" /> : <Copy size={14} />}
                  {copiedCode === c.code ? "COPIED!" : "COPY REFERRAL LINK"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referrals & Commissions Ledger */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Commissions Referral Ledger</h2>

        {commissions.length === 0 ? (
          <div className="text-center py-12 text-[#8C9890] text-xs">
            No referral sales or commissions logged yet. Once customers purchase items using your promo links, they will be registered here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Commission ID</th>
                  <th className="pb-3 px-3">Referenced Order</th>
                  <th className="pb-3 px-3">Earned Commission</th>
                  <th className="pb-3 px-3">Payout Status</th>
                  <th className="pb-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3 px-3 text-[#8C9890] font-bold">#{c.id}</td>
                    <td className="py-3 px-3 font-bold text-[#1C2E24]">Order #{c.order_id}</td>
                    <td className="py-3 px-3 font-extrabold text-[#2E7D32]">{formatPrice(c.amount)}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block capitalize ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#8C9890]">
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
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="border-b border-[#F0ECE1] pb-3">
          <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">✦ Payout Settings</h3>
          <p className="text-xs text-[#8C9890] mt-0.5">
            Configure your preferred payout details below. Admin will use these credentials to settle your earned commissions.
          </p>
        </div>

        <form onSubmit={handleSavePayoutSettings} className="space-y-5 text-xs">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPayoutMode("upi")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                payoutMode === "upi" ? "bg-[#0D2619] text-white" : "border border-[#E5E0D5] text-[#556B5D] hover:bg-[#FAF8F3]"
              }`}
            >
              UPI Payout
            </button>
            <button
              type="button"
              onClick={() => setPayoutMode("bank")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                payoutMode === "bank" ? "bg-[#0D2619] text-white" : "border border-[#E5E0D5] text-[#556B5D] hover:bg-[#FAF8F3]"
              }`}
            >
              Bank Account
            </button>
          </div>

          {payoutMode === "upi" ? (
            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">UPI ID</label>
              <input
                type="text"
                value={payoutUpiId}
                onChange={(e) => setPayoutUpiId(e.target.value)}
                placeholder="e.g. promotername@okaxis"
                className="w-full max-w-md bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                required={payoutMode === "upi"}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={payoutBankName}
                  onChange={(e) => setPayoutBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required={payoutMode === "bank"}
                />
              </div>
              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={payoutAccountHolderName}
                  onChange={(e) => setPayoutAccountHolderName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required={payoutMode === "bank"}
                />
              </div>
              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Account Number</label>
                <input
                  type="text"
                  value={payoutAccountNumber}
                  onChange={(e) => setPayoutAccountNumber(e.target.value)}
                  placeholder="Bank account number"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required={payoutMode === "bank"}
                />
              </div>
              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={payoutIfscCode}
                  onChange={(e) => setPayoutIfscCode(e.target.value)}
                  placeholder="e.g. SBIN0001234"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required={payoutMode === "bank"}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isUpdatingPayout}
            className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            {isUpdatingPayout ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              "Save Payout Details"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
