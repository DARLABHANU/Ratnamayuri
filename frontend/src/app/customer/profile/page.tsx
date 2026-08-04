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

type Tab = "main" | "profile" | "payout" | "password" | "addresses";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, setUser, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>("main");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const addressForm = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });
  const payoutForm = useForm<PayoutForm>({ resolver: zodResolver(payoutSchema) });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    authApi.me().then((r) => {
      setUser(r.data);
      profileForm.reset({ full_name: r.data.full_name, phone: r.data.phone || "" });
      payoutForm.reset({
        payout_bank_name: r.data.payout_bank_name || "",
        payout_account_number: r.data.payout_account_number || "",
        payout_ifsc_code: r.data.payout_ifsc_code || "",
        payout_account_holder_name: r.data.payout_account_holder_name || "",
        payout_upi_id: r.data.payout_upi_id || "",
      });
    });
    loadAddresses();
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const { data } = await addressApi.list();
      setAddresses(data);
    } catch {}
  };

  const onPayoutSubmit = async (data: PayoutForm) => {
    setIsSaving(true);
    try {
      await authApi.updatePayoutSettings(data);
      toast.success("Payout bank & UPI details saved successfully!");
      const r = await authApi.me();
      setUser(r.data);
      setTab("main");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({ full_name: data.full_name, phone: data.phone || undefined });
      toast.success("Profile updated successfully!");
      const r = await authApi.me();
      setUser(r.data);
      setTab("main");
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
      setTab("main");
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

  // User display name
  const userName = user?.full_name ? user.full_name.split(" ")[0] : "there";

  return (
    <div className="min-h-screen bg-white md:bg-[#FAF8F3] text-[#1C2E24] font-garamond">

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MOBILE PROFILE VIEW (Exact match to design screenshot)   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden bg-white min-h-screen">
        {/* Top Dark Green Banner */}
        <div
          className="px-5 pt-8 pb-10 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #092B1B 0%, #0D3A25 50%, #082416 100%)" }}
        >
          {/* Top Settings Icon */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setTab("profile")}
              className="text-white/90 hover:text-white p-1 transition-colors"
              aria-label="Settings"
            >
              <Settings size={22} />
            </button>
          </div>

          {/* User Info Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {/* Circular Avatar */}
              <div className="w-16 h-16 rounded-full border-2 border-white/30 bg-[#14472F] text-white flex items-center justify-center font-cormorant font-bold text-2xl shadow-md flex-shrink-0">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "S"}
              </div>

              {/* Name & Welcome */}
              <div className="space-y-0.5">
                <h1 className="font-cormorant text-2xl font-bold text-white leading-tight flex items-center gap-1.5">
                  Hello, {userName} <span className="text-xl">👋</span>
                </h1>
                <p className="font-garamond text-xs text-emerald-200/80">Welcome to Ratnamayuri</p>
              </div>
            </div>

            {/* Chevron Right Arrow */}
            <button
              onClick={() => setTab("profile")}
              className="text-white/80 hover:text-white p-2 transition-colors"
              aria-label="Account details"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Overlapping White Container Card */}
        <div className="-mt-5 rounded-t-3xl bg-white border-t border-[#E5E0D5]/80 shadow-lg px-4 pt-5 pb-16 min-h-[calc(100vh-140px)] space-y-6">

          {tab === "main" ? (
            <>
              {/* ── 1. My Orders Section ── */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="font-cormorant text-[19px] font-bold text-[#1C2E24]">My Orders</h2>
                  <Link
                    href="/customer/orders"
                    className="font-garamond text-xs font-semibold text-[#556B5D] hover:text-[#1E3A2B] flex items-center gap-0.5 transition-colors"
                  >
                    View All <ChevronRight size={13} />
                  </Link>
                </div>

                {/* 4 Order Status Columns */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: "Pending", icon: <ShoppingBag size={22} />, status: "pending" },
                    { label: "Confirmed", icon: <ShoppingBag size={22} />, status: "confirmed" },
                    { label: "Shipped", icon: <Truck size={22} />, status: "shipped" },
                    { label: "Delivered", icon: <CheckSquare size={22} />, status: "delivered" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={`/customer/orders?status=${item.status}`}
                      className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl hover:bg-[#FAF8F3] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#EBE6DC] flex items-center justify-center text-[#1C2E24] group-hover:border-[#0D2619] group-hover:text-[#0D2619] transition-colors">
                        {item.icon}
                      </div>
                      <span className="font-garamond text-xs font-semibold text-[#364B3E]">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* ── 2. Menu Options List ── */}
              <div className="divide-y divide-[#F2EFE9] border-t border-[#F2EFE9] pt-2">

                {/* My Addresses */}
                <button
                  onClick={() => setTab("addresses")}
                  className="w-full flex items-center justify-between py-3.5 text-left hover:bg-[#FAF8F3] px-1 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F3] border border-[#EBE6DC] flex items-center justify-center text-[#1C2E24]">
                      <MapPin size={17} />
                    </div>
                    <span className="font-garamond text-sm font-bold text-[#1C2E24]">My Addresses</span>
                  </div>
                  <ChevronRight size={18} className="text-[#8C9890] group-hover:text-[#1C2E24] transition-colors" />
                </button>

                {/* Payment Methods */}
                <button
                  onClick={() => setTab("payout")}
                  className="w-full flex items-center justify-between py-3.5 text-left hover:bg-[#FAF8F3] px-1 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F3] border border-[#EBE6DC] flex items-center justify-center text-[#1C2E24]">
                      <CreditCard size={17} />
                    </div>
                    <span className="font-garamond text-sm font-bold text-[#1C2E24]">Payment Methods</span>
                  </div>
                  <ChevronRight size={18} className="text-[#8C9890] group-hover:text-[#1C2E24] transition-colors" />
                </button>

                {/* My Coupons */}
                <div className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-[#FAF8F3] rounded-lg transition-colors group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F3] border border-[#EBE6DC] flex items-center justify-center text-[#1C2E24]">
                      <Tag size={17} />
                    </div>
                    <span className="font-garamond text-sm font-bold text-[#1C2E24]">My Coupons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-garamond text-xs text-[#7A6E5D]">2 Available</span>
                    <ChevronRight size={18} className="text-[#8C9890]" />
                  </div>
                </div>

                {/* Refer & Earn */}
                <Link
                  href="/promoter/dashboard"
                  className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-[#FAF8F3] rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F3] border border-[#EBE6DC] flex items-center justify-center text-[#1C2E24]">
                      <Gift size={17} />
                    </div>
                    <span className="font-garamond text-sm font-bold text-[#1C2E24]">Refer & Earn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-garamond text-xs font-bold text-[#0D2619]">Earn Rewards</span>
                    <ChevronRight size={18} className="text-[#8C9890]" />
                  </div>
                </Link>

                {/* Help & Support */}
                <Link
                  href="/customer/support"
                  className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-[#FAF8F3] rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F3] border border-[#EBE6DC] flex items-center justify-center text-[#1C2E24]">
                      <HelpCircle size={17} />
                    </div>
                    <span className="font-garamond text-sm font-bold text-[#1C2E24]">Help & Support</span>
                  </div>
                  <ChevronRight size={18} className="text-[#8C9890]" />
                </Link>

                {/* About Us */}
                <Link
                  href="/about"
                  className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-[#FAF8F3] rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F3] border border-[#EBE6DC] flex items-center justify-center text-[#1C2E24]">
                      <Info size={17} />
                    </div>
                    <span className="font-garamond text-sm font-bold text-[#1C2E24]">About Us</span>
                  </div>
                  <ChevronRight size={18} className="text-[#8C9890]" />
                </Link>

              </div>

              {/* Sign Out Button */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-50 text-red-600 font-garamond text-xs font-bold py-3 rounded-xl border border-red-200 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          ) : (
            /* Sub-view forms (Profile, Payout, Password, Addresses) on mobile */
            <div className="space-y-4">
              <button
                onClick={() => setTab("main")}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2619] hover:underline mb-2"
              >
                <ChevronLeft size={16} /> Back to Profile Menu
              </button>

              {tab === "profile" && (
                <div className="space-y-4">
                  <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">Personal Information</h2>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-3 font-garamond">
                    <div>
                      <label className="text-xs font-bold text-[#1C2E24] block mb-1">Full Name</label>
                      <input {...profileForm.register("full_name")} className="w-full border border-[#E5E0D5] rounded-xl px-3 py-2 text.xs font-bold bg-[#FAF8F3]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1C2E24] block mb-1">Phone Number</label>
                      <input {...profileForm.register("phone")} type="tel" className="w-full border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs font-bold bg-[#FAF8F3]" placeholder="+91 98765 43210" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#8C9890] block mb-1">Email Address</label>
                      <input value={user?.email || ""} disabled className="w-full border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs font-bold bg-[#FAF8F3] opacity-60 cursor-not-allowed" />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full bg-[#0D2619] text-white py-3 rounded-xl font-bold text-xs">
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </div>
              )}

              {tab === "payout" && (
                <div className="space-y-4">
                  <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">Payout Bank &amp; UPI Credentials</h2>
                  <form onSubmit={payoutForm.handleSubmit(onPayoutSubmit)} className="space-y-3 font-garamond">
                    <div>
                      <label className="text-xs font-bold text-[#1C2E24] block mb-1">Bank Name</label>
                      <input {...payoutForm.register("payout_bank_name")} className="w-full border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs bg-[#FAF8F3]" placeholder="e.g. State Bank of India" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1C2E24] block mb-1">Account Holder Name</label>
                      <input {...payoutForm.register("payout_account_holder_name")} className="w-full border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs bg-[#FAF8F3]" placeholder="Full name on bank account" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1C2E24] block mb-1">Account Number</label>
                      <input {...payoutForm.register("payout_account_number")} className="w-full border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs font-mono bg-[#FAF8F3]" placeholder="Enter account number" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1C2E24] block mb-1">IFSC Code</label>
                      <input {...payoutForm.register("payout_ifsc_code")} className="w-full border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs font-mono uppercase bg-[#FAF8F3]" placeholder="e.g. SBIN0001234" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1C2E24] block mb-1">UPI ID</label>
                      <input {...payoutForm.register("payout_upi_id")} className="w-full border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs font-mono bg-[#FAF8F3]" placeholder="username@upi" />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full bg-[#0D2619] text-white py-3 rounded-xl font-bold text-xs">
                      {isSaving ? "Saving..." : "Save Payout Details"}
                    </button>
                  </form>
                </div>
              )}

              {tab === "addresses" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">Saved Addresses</h2>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-[#0D2619] text-white px-3 py-1.5 rounded-lg"
                    >
                      <Plus size={12} /> Add New
                    </button>
                  </div>

                  {showAddressForm && (
                    <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-3 bg-[#FAF8F3] p-4 rounded-xl border border-[#E5E0D5] font-garamond">
                      <input {...addressForm.register("full_name")} placeholder="Full Name" className="w-full border p-2 text-xs rounded-lg" />
                      <input {...addressForm.register("phone")} placeholder="Phone Number" className="w-full border p-2 text-xs rounded-lg" />
                      <input {...addressForm.register("line1")} placeholder="Address Line 1" className="w-full border p-2 text-xs rounded-lg" />
                      <div className="grid grid-cols-2 gap-2">
                        <input {...addressForm.register("city")} placeholder="City" className="border p-2 text-xs rounded-lg" />
                        <input {...addressForm.register("state")} placeholder="State" className="border p-2 text-xs rounded-lg" />
                      </div>
                      <input {...addressForm.register("pincode")} placeholder="Pincode" className="w-full border p-2 text-xs rounded-lg" />
                      <button type="submit" disabled={isSaving} className="w-full bg-[#0D2619] text-white py-2 rounded-lg font-bold text-xs">
                        Save Address
                      </button>
                    </form>
                  )}

                  <div className="space-y-3 font-garamond">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-3 border border-[#E5E0D5] rounded-xl bg-white flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded uppercase">{addr.label}</span>
                          <p className="font-bold text-xs mt-1">{addr.full_name}</p>
                          <p className="text-xs text-[#7A6E5D]">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-xs text-[#7A6E5D]">{addr.phone}</p>
                        </div>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════ */}
      {/* DESKTOP PROFILE VIEW                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-3xl mx-auto px-4 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">My <em className="italic text-[#0D2619]">Profile</em></h1>
          <div className="w-10 h-0.5 bg-[#0D2619] mt-3" />
        </div>

        {/* User Card */}
        {user && (
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 mb-6 flex items-center gap-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#0D2619] flex items-center justify-center font-cormorant text-2xl font-bold text-white flex-shrink-0">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-cormorant text-xl font-bold text-[#1C2E24]">{user.full_name}</p>
              <p className="font-garamond text-xs text-[#8C9890]">{user.email}</p>
              <p className="font-garamond text-xs text-[#0D2619] font-semibold mt-0.5">
                #{user.account_number} · Member since {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "payout", label: "Payout Bank / UPI", icon: Lock },
            { id: "password", label: "Password", icon: Lock },
            { id: "addresses", label: "Addresses", icon: MapPin },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as Tab)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-garamond text-xs font-semibold transition-all border
                ${tab === id || (tab === "main" && id === "profile")
                  ? "bg-[#0D2619] text-white border-[#0D2619]"
                  : "bg-white text-[#556B5D] border-[#E5E0D5] hover:border-[#0D2619]"}`}
            >
              <Icon size={12} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Desktop Tab Contents */}
        {(tab === "profile" || tab === "main") && (
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">Personal Information</h2>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 font-garamond">
              <div>
                <label className="text-xs font-bold text-[#1C2E24] block mb-1">FULL NAME</label>
                <input {...profileForm.register("full_name")} className="w-full border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs font-bold bg-[#FAF8F3]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#1C2E24] block mb-1">PHONE NUMBER</label>
                <input {...profileForm.register("phone")} type="tel" className="w-full border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs font-bold bg-[#FAF8F3]" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8C9890] block mb-1">EMAIL ADDRESS</label>
                <input value={user?.email || ""} disabled className="w-full border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs font-bold bg-[#FAF8F3] opacity-60 cursor-not-allowed" />
              </div>
              <button type="submit" disabled={isSaving} className="bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-3 rounded-xl font-bold text-xs transition-colors">
                {isSaving ? "Saving..." : "SAVE CHANGES"}
              </button>
            </form>
          </div>
        )}

        {tab === "payout" && (
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">Payout Bank &amp; UPI Credentials</h2>
            <form onSubmit={payoutForm.handleSubmit(onPayoutSubmit)} className="space-y-4 font-garamond">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#1C2E24] block mb-1">BANK NAME</label>
                  <input {...payoutForm.register("payout_bank_name")} className="w-full border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs bg-[#FAF8F3]" placeholder="e.g. State Bank of India" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C2E24] block mb-1">ACCOUNT HOLDER NAME</label>
                  <input {...payoutForm.register("payout_account_holder_name")} className="w-full border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs bg-[#FAF8F3]" placeholder="Full name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C2E24] block mb-1">ACCOUNT NUMBER</label>
                  <input {...payoutForm.register("payout_account_number")} className="w-full border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs font-mono bg-[#FAF8F3]" placeholder="Account number" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C2E24] block mb-1">IFSC CODE</label>
                  <input {...payoutForm.register("payout_ifsc_code")} className="w-full border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs font-mono uppercase bg-[#FAF8F3]" placeholder="e.g. SBIN0001234" />
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-3 rounded-xl font-bold text-xs transition-colors">
                {isSaving ? "Saving..." : "SAVE PAYOUT CREDENTIALS"}
              </button>
            </form>
          </div>
        )}

        {tab === "addresses" && (
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">Saved Addresses</h2>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="bg-[#0D2619] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                <Plus size={14} /> Add Address
              </button>
            </div>
            {addresses.map((addr) => (
              <div key={addr.id} className="p-4 border border-[#E5E0D5] rounded-xl bg-[#FAF8F3] flex justify-between items-start font-garamond">
                <div>
                  <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-0.5 rounded uppercase">{addr.label}</span>
                  <p className="font-bold text-sm mt-1">{addr.full_name}</p>
                  <p className="text-xs text-[#7A6E5D]">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-xs text-[#7A6E5D]">{addr.phone}</p>
                </div>
                <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-600 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
