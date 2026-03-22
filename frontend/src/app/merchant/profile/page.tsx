"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Store } from "lucide-react";
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
      <Loader2 className="animate-spin text-gold-500" size={28} />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <span className="section-tag">STORE SETTINGS</span>
        <h1 className="section-title">Merchant <em className="italic">Profile</em></h1>
      </div>

      {profile && !profile.is_approved && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 mb-6">
          <p className="font-cinzel text-xs tracking-wide text-yellow-700">⏳ PENDING APPROVAL</p>
          <p className="font-garamond text-sm text-yellow-600 mt-1">
            Your merchant account is awaiting admin approval before you can list products.
          </p>
        </div>
      )}

      {profile?.is_approved && (
        <div className="bg-green-50 border border-green-200 p-4 mb-6">
          <p className="font-cinzel text-xs tracking-wide text-green-700">✓ APPROVED MERCHANT</p>
          <p className="font-garamond text-sm text-green-600 mt-1">
            Platform commission rate: <strong>{profile.commission_rate}%</strong>
          </p>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gold-100 flex items-center justify-center">
            <Store size={20} className="text-gold-600" />
          </div>
          <div>
            <h2 className="font-cinzel text-sm tracking-widest text-brown">
              {isCreating ? "CREATE YOUR STORE" : "STORE INFORMATION"}
            </h2>
            <p className="font-garamond text-xs text-muted">
              {isCreating ? "Set up your merchant profile to start selling" : "Update your store details"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">BUSINESS NAME *</label>
            <input {...register("business_name")} className="input-field" placeholder="Your store name" />
            {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>}
          </div>

          <div>
            <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">BUSINESS DESCRIPTION</label>
            <textarea {...register("business_description")} rows={3}
              className="input-field resize-none"
              placeholder="Tell customers about your store..." />
          </div>

          <div>
            <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">GSTIN</label>
            <input {...register("gstin")} className="input-field" placeholder="22AAAAA0000A1Z5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">BANK ACCOUNT</label>
              <input {...register("bank_account")} className="input-field" placeholder="Account number" />
            </div>
            <div>
              <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">IFSC CODE</label>
              <input {...register("ifsc_code")} className="input-field" placeholder="SBIN0001234" />
            </div>
          </div>

          <div className="pt-2 border-t border-gold-100">
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              {isCreating ? "CREATE PROFILE" : "SAVE CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
