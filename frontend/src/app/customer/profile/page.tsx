"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Loader2, User, Lock, MapPin, Plus, Trash2, Settings, ChevronRight,
  ShoppingBag, Truck, CheckSquare, CreditCard, Tag, Gift, HelpCircle,
  Info, LogOut, Clock, ChevronLeft
} from "lucide-react";
import { authApi, addressApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Address } from "@/types";
import { getApiError, formatDate } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, "Min 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const addressSchema = z.object({
  label: z.string().default("Home"),
  full_name: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6, "6-digit pincode"),
  country: z.string().default("India"),
  is_default: z.boolean().default(false),
});

const payoutSchema = z.object({
  payout_bank_name: z.string().optional(),
  payout_account_number: z.string().optional(),
  payout_ifsc_code: z.string().optional(),
  payout_account_holder_name: z.string().optional(),
  payout_upi_id: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type AddressForm = z.infer<typeof addressSchema>;
type PayoutForm = z.infer<typeof payoutSchema>;

type Tab = "profile" | "payout" | "password" | "addresses";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<Tab>("profile");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "Home", country: "India", is_default: false },
  });

  const payoutForm = useForm<PayoutForm>({
    resolver: zodResolver(payoutSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    Promise.all([
      authApi.me().then((r) => {
        setUser(r.data);
        profileForm.reset({
          full_name: r.data.full_name,
          phone: r.data.phone || "",
        });
        payoutForm.reset({
          payout_bank_name: r.data.payout_bank_name || "",
          payout_account_number: r.data.payout_account_number || "",
          payout_ifsc_code: r.data.payout_ifsc_code || "",
          payout_account_holder_name: r.data.payout_account_holder_name || "",
          payout_upi_id: r.data.payout_upi_id || "",
        });
      }),
      loadAddresses(),
    ]).finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const res = await addressApi.list();
      setAddresses(res.data.items || []);
    } catch {
      setAddresses([]);
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile(data);
      setUser(res.data);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsSaving(true);
    try {
      await authApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Password changed!");
      passwordForm.reset();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onPayoutSubmit = async (data: PayoutForm) => {
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({ full_name: user?.full_name || "", ...data });
      setUser(res.data);
      toast.success("Payout credentials updated successfully!");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onAddressSubmit = async (data: AddressForm) => {
    setIsSaving(true);
    try {
      await addressApi.create(data);
      toast.success("Address saved!");
      setShowAddressForm(false);
      addressForm.reset();
      loadAddresses();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Delete this address?")) return;
    try {
      await addressApi.delete(id);
      toast.success("Address deleted");
      loadAddresses();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0D2619]" size={36} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[#1C2E24] font-garamond py-4">
      {/* Header */}
      <div className="border-b border-[#F0ECE1] pb-4">
        <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
          ACCOUNT SETTINGS
        </span>
        <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">
          My Profile &amp; Preferences
        </h1>
        <p className="text-xs text-[#8C9890] mt-0.5">Manage your personal information, address book, and security settings</p>
      </div>

      {/* User Card */}
      {user && (
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0D2619] text-white font-cormorant font-bold text-2xl flex items-center justify-center border-2 border-gold-400/40">
              {user.full_name?.charAt(0).toUpperCase() || "C"}
            </div>
            <div>
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">{user.full_name}</h2>
              <p className="text-xs text-[#8C9890]">{user.email}</p>
              <p className="text-[11px] text-[#0D2619] font-semibold mt-0.5">
                Account #{user.account_number} · Joined {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "profile", label: "Profile Info", icon: User },
          { id: "payout", label: "Payout Bank & UPI", icon: CreditCard },
          { id: "password", label: "Security Password", icon: Lock },
          { id: "addresses", label: "Saved Addresses", icon: MapPin },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-garamond text-xs font-bold transition-all border ${
              tab === id
                ? "bg-[#0D2619] text-white border-[#0D2619] shadow-xs"
                : "bg-white text-[#556B5D] border-[#E5E0D5] hover:border-[#0D2619]"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs">
        {tab === "profile" && (
          <div className="space-y-4">
            <h3 className="font-cormorant text-lg font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-2">Personal Information</h3>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 font-garamond max-w-md">
              <div>
                <label className="text-xs font-bold text-[#1C2E24] block mb-1">Full Name *</label>
                <input {...profileForm.register("full_name")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#1C2E24] block mb-1">Phone Number</label>
                <input {...profileForm.register("phone")} type="tel" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8C9890] block mb-1">Email Address</label>
                <input value={user?.email || ""} disabled className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24] opacity-60 cursor-not-allowed" />
              </div>
              <button type="submit" disabled={isSaving} className="bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {tab === "payout" && (
          <div className="space-y-4">
            <h3 className="font-cormorant text-lg font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-2">Payout Bank &amp; UPI Credentials</h3>
            <form onSubmit={payoutForm.handleSubmit(onPayoutSubmit)} className="space-y-4 font-garamond max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#1C2E24] block mb-1">Bank Name</label>
                  <input {...payoutForm.register("payout_bank_name")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-[#FAF8F3]" placeholder="e.g. State Bank of India" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C2E24] block mb-1">Account Holder Name</label>
                  <input {...payoutForm.register("payout_account_holder_name")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-[#FAF8F3]" placeholder="Full name on bank account" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C2E24] block mb-1">Account Number</label>
                  <input {...payoutForm.register("payout_account_number")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-mono bg-[#FAF8F3]" placeholder="Enter account number" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C2E24] block mb-1">IFSC Code</label>
                  <input {...payoutForm.register("payout_ifsc_code")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase bg-[#FAF8F3]" placeholder="e.g. SBIN0001234" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#1C2E24] block mb-1">UPI ID (VPA)</label>
                <input {...payoutForm.register("payout_upi_id")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-mono bg-[#FAF8F3]" placeholder="e.g. name@upi" />
              </div>
              <button type="submit" disabled={isSaving} className="bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs">
                {isSaving ? "Saving..." : "Save Payout Credentials"}
              </button>
            </form>
          </div>
        )}

        {tab === "password" && (
          <div className="space-y-4">
            <h3 className="font-cormorant text-lg font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-2">Change Security Password</h3>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 font-garamond max-w-md">
              <div>
                <label className="text-xs font-bold text-[#1C2E24] block mb-1">Current Password *</label>
                <input {...passwordForm.register("current_password")} type="password" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#1C2E24] block mb-1">New Password *</label>
                <input {...passwordForm.register("new_password")} type="password" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#1C2E24] block mb-1">Confirm New Password *</label>
                <input {...passwordForm.register("confirm_password")} type="password" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24]" />
              </div>
              <button type="submit" disabled={isSaving} className="bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs">
                {isSaving ? "Saving..." : "Update Password"}
              </button>
            </form>
          </div>
        )}

        {tab === "addresses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-2">
              <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Saved Shipping Addresses</h3>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="inline-flex items-center gap-1 bg-[#0D2619] hover:bg-[#19402B] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus size={14} /> Add New
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-3 bg-[#FAF8F3] p-4 rounded-2xl border border-[#E5E0D5] font-garamond max-w-lg">
                <div>
                  <label className="text-xs font-bold block mb-1">Address Label</label>
                  <input {...addressForm.register("label")} placeholder="Home / Work" className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Receiver Name</label>
                  <input {...addressForm.register("full_name")} className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Phone Number</label>
                  <input {...addressForm.register("phone")} className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Street Address Line 1</label>
                  <input {...addressForm.register("line1")} className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold block mb-1">City</label>
                    <input {...addressForm.register("city")} className="w-full border rounded-xl px-3 py-2 text-xs" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">State</label>
                    <input {...addressForm.register("state")} className="w-full border rounded-xl px-3 py-2 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Pincode</label>
                  <input {...addressForm.register("pincode")} className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>
                <button type="submit" disabled={isSaving} className="bg-[#0D2619] text-white px-5 py-2.5 rounded-xl font-bold text-xs">
                  {isSaving ? "Saving..." : "Save Address"}
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-4 border border-[#E5E0D5] rounded-2xl bg-[#FAF8F3] flex justify-between items-start font-garamond">
                  <div>
                    <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded uppercase">{addr.label}</span>
                    <p className="font-bold text-xs mt-1">{addr.full_name}</p>
                    <p className="text-xs text-[#7A6E5D]">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-xs text-[#7A6E5D]">{addr.phone}</p>
                  </div>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-600 p-1 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
