"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Store, Save, CheckCircle2, Clock } from "lucide-react";
import { merchantApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { MerchantProfile } from "@/types";
import { getApiError } from "@/lib/utils";

const schema = z.object({
  business_name: z.string().min(2, "Business name required"),
  business_description: z.string().optional(),
  gstin: z.string().optional(),
  bank_account: z.string().optional(),
  ifsc_code: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function MerchantProfilePage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") { router.push("/auth/login"); return; }
    merchantApi.getProfile()
      .then(r => { setProfile(r.data); reset(r.data); })
      .catch(() => setIsCreating(true))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, role]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      if (isCreating) {
        const res = await merchantApi.createProfile(data);
        setProfile(res.data);
        setIsCreating(false);
        toast.success("Merchant profile created! Pending admin approval.");
      } else {
        const res = await merchantApi.updateProfile(data);
        setProfile(res.data);
        toast.success("Profile updated!");
      }
    } catch (err) { toast.error(getApiError(err)); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return (
    <div className="flex justify-center h-48 items-center">
      <Loader2 className="animate-spin text-[#0D2619]" size={28} />
    </div>
  );

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Store Profile</h1>

      {/* Status Banners */}
      {profile && !profile.is_approved && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock size={18} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-xs text-amber-800">Pending Admin Approval</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Your merchant account is awaiting admin approval before you can list products.</p>
          </div>
        </div>
      )}

      {profile?.is_approved && (
        <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-[#2E7D32] flex-shrink-0" />
          <div>
            <p className="font-bold text-xs text-[#2E7D32]">Approved Merchant</p>
            <p className="text-[11px] text-[#388E3C] mt-0.5">Platform commission rate: <strong>{profile.commission_rate}%</strong></p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-[#F0ECE1] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center">
            <Store size={18} className="text-[#0D2619]" />
          </div>
          <div>
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">
              {isCreating ? "Create Your Store" : "Store Information"}
            </h3>
            <p className="text-[11px] text-[#8C9890]">
              {isCreating ? "Set up your merchant profile to start selling" : "Update your store details and bank information"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs">
          <div>
            <label className="font-bold text-[#1C2E24] block mb-1">Business / Store Name *</label>
            <input {...register("business_name")}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              placeholder="e.g. Sowmya Collections" />
            {errors.business_name && <p className="text-red-500 text-[11px] mt-1">{errors.business_name.message}</p>}
          </div>

          <div>
            <label className="font-bold text-[#1C2E24] block mb-1">Business Description</label>
            <textarea {...register("business_description")} rows={3}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-4 font-garamond text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619] resize-none"
              placeholder="Tell customers about your store, specialities, and craftsmanship..." />
          </div>

          <div>
            <label className="font-bold text-[#1C2E24] block mb-1">GSTIN (Optional)</label>
            <input {...register("gstin")}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              placeholder="22AAAAA0000A1Z5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Bank Account Number</label>
              <input {...register("bank_account")}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                placeholder="Account number" />
            </div>
            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">IFSC Code</label>
              <input {...register("ifsc_code")}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                placeholder="SBIN0001234" />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#F0ECE1]">
            <button type="submit" disabled={isSaving}
              className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} />
              <span>{isCreating ? "Create Profile" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
