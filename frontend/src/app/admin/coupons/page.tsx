"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, X, Tag, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Coupon } from "@/types";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

const couponSchema = z.object({
  code:                 z.string().min(3).max(20).toUpperCase(),
  description:          z.string().optional(),
  discount_amount:      z.coerce.number().positive().default(200),
  promoter_commission:  z.coerce.number().min(0).default(100),
  platform_profit:      z.coerce.number().min(0).default(100),
  promoter_id:          z.string().optional().or(z.literal("")),
  min_order_amount:     z.coerce.number().min(0).default(0),
  max_uses:             z.coerce.number().optional(),
  valid_until:          z.string().optional(),
});
type CouponForm = z.infer<typeof couponSchema>;

export default function AdminCouponsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: { discount_amount: 200, promoter_commission: 100, platform_profit: 100, min_order_amount: 0 },
  });

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") { router.push("/auth/login"); return; }
    loadCoupons();
  }, [isAuthenticated, role]);

  const loadCoupons = async () => {
    setIsLoading(true);
    try { const { data } = await adminApi.coupons(); setCoupons(data); }
    finally { setIsLoading(false); }
  };

  const onSubmit = async (data: CouponForm) => {
    setIsSaving(true);
    try {
      await adminApi.createCoupon({ ...data, code: data.code.toUpperCase() });
      toast.success("Coupon created!");
      setShowForm(false);
      reset();
      loadCoupons();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setIsSaving(false); }
  };

  const handleDeactivate = async (coupon: Coupon) => {
    if (!confirm(`Deactivate coupon "${coupon.code}"?`)) return;
    try {
      await adminApi.deleteCoupon(coupon.id);
      toast.success("Coupon deactivated");
      loadCoupons();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const discountAmount = watch("discount_amount") || 0;
  const promoterCommission = watch("promoter_commission") || 0;
  const platformProfit = watch("platform_profit") || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="section-tag">PROMOTIONS</span>
          <h1 className="section-title">Coupon <em className="italic">Management</em></h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> CREATE COUPON
        </button>
      </div>

      {/* Coupon form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg my-8 animate-fade-up">
            <div className="flex items-center justify-between p-6 border-b border-gold-100">
              <h2 className="font-cinzel text-sm tracking-widest text-brown">CREATE COUPON</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-muted" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">COUPON CODE *</label>
                <input {...register("code")} placeholder="e.g. WELCOME15" className="input-field uppercase" />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
              </div>

              <div>
                <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">DESCRIPTION</label>
                <input {...register("description")} placeholder="Brief description" className="input-field" />
              </div>

              {/* Financial breakdown */}
              <div className="bg-gold-50 border border-gold-200 p-4 space-y-3">
                <p className="font-cinzel text-xs tracking-widest text-muted">FINANCIAL BREAKDOWN</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-cinzel text-xs text-muted block mb-1">DISCOUNT (₹)</label>
                    <input {...register("discount_amount")} type="number" className="input-field py-2" />
                    {errors.discount_amount && <p className="text-red-500 text-xs">{errors.discount_amount.message}</p>}
                  </div>
                  <div>
                    <label className="font-cinzel text-xs text-muted block mb-1">PROMOTER (₹)</label>
                    <input {...register("promoter_commission")} type="number" className="input-field py-2" />
                  </div>
                  <div>
                    <label className="font-cinzel text-xs text-muted block mb-1">PLATFORM (₹)</label>
                    <input {...register("platform_profit")} type="number" className="input-field py-2" />
                  </div>
                </div>
                <div className="flex gap-4 pt-2 border-t border-gold-200">
                  <p className="font-garamond text-xs text-muted">
                    Customer saves: <span className="text-brown font-medium">{formatPrice(discountAmount)}</span>
                  </p>
                  <p className="font-garamond text-xs text-muted">
                    Promoter earns: <span className="text-green-600 font-medium">{formatPrice(promoterCommission)}</span>
                  </p>
                  <p className="font-garamond text-xs text-muted">
                    Platform: <span className="text-blue-600 font-medium">{formatPrice(platformProfit)}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PROMOTER CUSTOMER ID</label>
                  <input {...register("promoter_id")} type="text" placeholder="e.g. #RM1421133920" className="input-field" />
                </div>
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">MIN ORDER (₹)</label>
                  <input {...register("min_order_amount")} type="number" className="input-field" />
                </div>
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">MAX USES</label>
                  <input {...register("max_uses")} type="number" placeholder="Unlimited" className="input-field" />
                </div>
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">VALID UNTIL</label>
                  <input {...register("valid_until")} type="datetime-local" className="input-field" />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gold-100">
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                  {isSaving && <Loader2 size={12} className="animate-spin" />}
                  CREATE COUPON
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-ivory">
              <tr>
                <th className="table-th">Code</th>
                <th className="table-th">Discount</th>
                <th className="table-th">Promoter Cut</th>
                <th className="table-th">Uses</th>
                <th className="table-th">Valid Until</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-gold-500" />
                      <span className="font-cinzel text-xs tracking-wide text-brown">{coupon.code}</span>
                      <button onClick={() => copyCode(coupon.code)} className="text-muted hover:text-brown">
                        <Copy size={11} />
                      </button>
                    </div>
                    {coupon.description && <p className="font-garamond text-xs text-muted mt-0.5 ml-5">{coupon.description}</p>}
                  </td>
                  <td className="table-td font-cinzel text-xs text-green-700">{formatPrice(coupon.discount_amount)}</td>
                  <td className="table-td font-cinzel text-xs text-blue-700">{formatPrice(coupon.promoter_commission)}</td>
                  <td className="table-td font-garamond text-sm text-muted">
                    {coupon.used_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                  </td>
                  <td className="table-td font-garamond text-xs text-muted">
                    {coupon.valid_until ? formatDate(coupon.valid_until) : "No expiry"}
                  </td>
                  <td className="table-td">
                    <span className={`badge text-xs ${coupon.is_active ? "!bg-emerald-700 !text-white font-semibold" : "!bg-slate-600 !text-white font-semibold"}`}>
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-td">
                    {coupon.is_active && (
                      <button onClick={() => handleDeactivate(coupon)}
                        className="text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center py-10 font-garamond text-muted">No coupons yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
