"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, User, Lock, MapPin, Plus, Trash2 } from "lucide-react";
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
}).refine(d => d.new_password === d.confirm_password, {
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

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type AddressForm = z.infer<typeof addressSchema>;

type Tab = "profile" | "password" | "addresses";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>("profile");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const addressForm = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    authApi.me().then(r => {
      setUser(r.data);
      profileForm.reset({ full_name: r.data.full_name, phone: r.data.phone || "" });
    });
    loadAddresses();
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const { data } = await addressApi.list();
      setAddresses(data);
    } catch {}
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      await authApi.me(); // just refresh
      toast.success("Profile updated!");
    } catch (err) { toast.error(getApiError(err)); }
    finally { setIsSaving(false); }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsSaving(true);
    try {
      await authApi.changePassword({ current_password: data.current_password, new_password: data.new_password });
      toast.success("Password changed!");
      passwordForm.reset();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setIsSaving(false); }
  };

  const onAddressSubmit = async (data: AddressForm) => {
    setIsSaving(true);
    try {
      await addressApi.create(data);
      toast.success("Address saved!");
      setShowAddressForm(false);
      addressForm.reset();
      loadAddresses();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setIsSaving(false); }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Delete this address?")) return;
    try {
      await addressApi.delete(id);
      toast.success("Address deleted");
      loadAddresses();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const TABS: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "addresses", label: "Addresses", icon: MapPin },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-8">
        <span className="section-tag">ACCOUNT</span>
        <h1 className="section-title">My <em className="italic">Profile</em></h1>
        <div className="divider-gold mx-0 mt-4" />
      </div>

      {/* User info card */}
      {user && (
        <div className="card p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-200 to-gold-500
            flex items-center justify-center font-cinzel text-xl text-deep flex-shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div className="text-center sm:text-left">
            <p className="font-cormorant text-xl text-brown">{user.full_name}</p>
            <p className="font-garamond text-sm text-muted">{user.email}</p>
            <p className="font-cinzel text-xs text-gold-600 mt-0.5">
              #{user.account_number} · Member since {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border border-gold-200 p-1 bg-white mb-6 rounded-md">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-cinzel text-xs tracking-wide transition-all rounded-sm
              ${tab === id ? "bg-deep text-gold-300" : "text-muted hover:text-brown"}`}>
            <Icon size={12} />
            <span className="hidden xs:inline sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="card p-6 animate-fade-up">
          <h2 className="font-cinzel text-xs tracking-widest text-muted mb-5">PERSONAL INFORMATION</h2>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">FULL NAME</label>
              <input {...profileForm.register("full_name")} className="input-field" />
              {profileForm.formState.errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PHONE NUMBER</label>
              <input {...profileForm.register("phone")} type="tel" className="input-field" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">EMAIL ADDRESS</label>
              <input value={user?.email || ""} disabled className="input-field opacity-60 cursor-not-allowed" />
              <p className="font-garamond text-xs text-muted mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              SAVE CHANGES
            </button>
          </form>
        </div>
      )}

      {/* Password tab */}
      {tab === "password" && (
        <div className="card p-6 animate-fade-up">
          <h2 className="font-cinzel text-xs tracking-widest text-muted mb-5">CHANGE PASSWORD</h2>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {["current_password", "new_password", "confirm_password"].map((field) => (
              <div key={field}>
                <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                  {field.replace(/_/g, " ").toUpperCase()}
                </label>
                <input
                  {...passwordForm.register(field as any)}
                  type="password"
                  className="input-field"
                  placeholder={field === "current_password" ? "Current password" : "New password"}
                />
                {(passwordForm.formState.errors as any)[field] && (
                  <p className="text-red-500 text-xs mt-1">
                    {(passwordForm.formState.errors as any)[field]?.message}
                  </p>
                )}
              </div>
            ))}
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              CHANGE PASSWORD
            </button>
          </form>
        </div>
      )}

      {/* Addresses tab */}
      {tab === "addresses" && (
        <div className="animate-fade-up">
          <div className="space-y-3 mb-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="card p-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-deep text-gold-400 font-cinzel text-xs px-2 py-0.5">{addr.label}</span>
                    {addr.is_default && <span className="font-cinzel text-xs text-gold-600">DEFAULT</span>}
                  </div>
                  <p className="font-garamond text-sm font-medium text-brown">{addr.full_name}</p>
                  <p className="font-garamond text-sm text-muted">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                  <p className="font-garamond text-sm text-muted">📞 {addr.phone}</p>
                </div>
                <button onClick={() => handleDeleteAddress(addr.id)}
                  className="text-muted hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {addresses.length === 0 && !showAddressForm && (
              <div className="card p-10 text-center">
                <MapPin size={32} className="text-gold-300 mx-auto mb-3" />
                <p className="font-garamond text-muted">No saved addresses</p>
              </div>
            )}
          </div>

          <button onClick={() => setShowAddressForm(!showAddressForm)}
            className="flex items-center gap-2 font-cinzel text-xs tracking-wide text-gold-600 hover:text-gold-500 transition-colors mb-4">
            <Plus size={12} /> ADD NEW ADDRESS
          </button>

          {showAddressForm && (
            <div className="card p-6 animate-fade-up">
              <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">FULL NAME</label>
                    <input {...addressForm.register("full_name")} className="input-field" />
                  </div>
                  <div>
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PHONE</label>
                    <input {...addressForm.register("phone")} className="input-field" />
                    {addressForm.formState.errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">LABEL</label>
                    <select {...addressForm.register("label")} className="input-field">
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">ADDRESS LINE 1</label>
                    <input {...addressForm.register("line1")} className="input-field" placeholder="House/Flat, Street" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">ADDRESS LINE 2</label>
                    <input {...addressForm.register("line2")} className="input-field" placeholder="Area, Landmark (optional)" />
                  </div>
                  <div>
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">CITY</label>
                    <input {...addressForm.register("city")} className="input-field" />
                  </div>
                  <div>
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">STATE</label>
                    <input {...addressForm.register("state")} className="input-field" />
                  </div>
                  <div>
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PINCODE</label>
                    <input {...addressForm.register("pincode")} maxLength={6} className="input-field" />
                    {addressForm.formState.errors.pincode && (
                      <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.pincode.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input {...addressForm.register("is_default")} type="checkbox" id="is_default" className="accent-gold-500 w-4 h-4" />
                    <label htmlFor="is_default" className="font-cinzel text-xs tracking-wide text-brown cursor-pointer">
                      Set as default
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                    {isSaving && <Loader2 size={12} className="animate-spin" />}
                    SAVE ADDRESS
                  </button>
                  <button type="button" onClick={() => setShowAddressForm(false)} className="btn-ghost">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
