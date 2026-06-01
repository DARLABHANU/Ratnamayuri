"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Mail, Sparkles, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { getApiError } from "@/lib/utils";
import { auth as firebaseAuth } from "@/lib/firebase";
import { sendSignInLinkToEmail } from "firebase/auth";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
  role: z.enum(["customer", "merchant", "admin"] as const),
});
type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "merchant", label: "Merchant" },
  { value: "admin", label: "Admin" },
];

const ROLE_REDIRECTS: Record<UserRole, string> = {
  customer: "/",
  merchant: "/merchant/dashboard",
  admin: "/admin/dashboard",
  support: "/support/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth Method States
  const [authMethod, setAuthMethod] = useState<"password" | "magic_link">("password");
  const [magicEmail, setMagicEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "customer" },
  });

  const selectedRole = watch("role") || "customer";

  // Clear input fields when switching roles
  useEffect(() => {
    setValue("email", "");
    setValue("password", "");
    setMagicEmail("");
    setMagicLinkSent(false);
  }, [selectedRole, setValue]);

  // Standard Email/Password onSubmit
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      const tokenData = res.data;

      if (tokenData.requires_otp) {
        toast.success("OTP sent to your email!");
        router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}&purpose=email_verification`);
        return;
      }

      setAuth({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        role: tokenData.role,
        user_id: tokenData.user_id,
      });

      toast.success("Welcome back!");
      router.push(ROLE_REDIRECTS[tokenData.role as UserRole]);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Send Email Magic Link
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail || !magicEmail.trim() || !magicEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/verify-link`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(firebaseAuth, magicEmail.trim(), actionCodeSettings);
      
      // Save email locally to verify on redirect (prevents having to re-enter)
      window.localStorage.setItem("emailForSignIn", magicEmail.trim());
      
      setMagicLinkSent(true);
      toast.success("Secure checkout link dispatched to your inbox!");
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger Magic Link email.");
      console.error("Firebase Magic Link trigger failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <span className="section-tag">WELCOME BACK</span>
        <h2 className="font-cormorant text-3xl font-light text-brown">Sign In</h2>
        <p className="font-garamond text-sm text-muted mt-2">
          Access your Ratnamayuri account using standard passwords or our 100% free, secure passwordless Email Magic Link.
        </p>
      </div>

      {/* Role selector */}
      <div className="mb-4">
        <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-1.5 uppercase font-bold">
          LOGIN AS
        </label>
        <div className="grid grid-cols-3 gap-1 border border-gold-200 p-1 bg-white">
          {ROLE_OPTIONS.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input type="radio" {...register("role")} value={opt.value} className="sr-only" />
              <div className={`text-center py-2 font-cinzel text-xs tracking-wide transition-all
                ${selectedRole === opt.value
                  ? "bg-deep text-gold-300"
                  : "text-muted hover:text-brown"}`}>
                {opt.label}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Login method selectors */}
      <div className="grid grid-cols-2 border border-gray-200 rounded overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setAuthMethod("password")}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-cinzel tracking-wider transition-all
            ${authMethod === "password" ? "bg-gold-50 text-brown border-b-2 border-gold-500 font-bold" : "bg-white text-muted hover:text-brown"}`}
        >
          <Mail size={13} />
          EMAIL & PASSWORD
        </button>
        <button
          type="button"
          onClick={() => setAuthMethod("magic_link")}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-cinzel tracking-wider transition-all
            ${authMethod === "magic_link" ? "bg-gold-50 text-brown border-b-2 border-gold-500 font-bold" : "bg-white text-muted hover:text-brown"}`}
        >
          <Sparkles size={13} />
          PASSWORDLESS LINK
        </button>
      </div>

      {/* Method A: Standard password form */}
      {authMethod === "password" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
              EMAIL ADDRESS
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="input-field bg-white"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 font-garamond">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                className="input-field pr-10 bg-white"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brown"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 font-garamond">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="font-cinzel text-xs text-gold-600 hover:text-gold-500 tracking-wide"
            >
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            SIGN IN
          </button>
        </form>
      )}

      {/* Method B: Passwordless Magic Link form */}
      {authMethod === "magic_link" && (
        <div className="space-y-4">
          {!magicLinkSent ? (
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="input-field bg-white"
                  required
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                SEND SECURE SIGN-IN LINK
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3 font-garamond animate-fade-in card bg-ivory/30 border-gold-200">
              <p className="text-green-700 font-semibold text-base">📩 Link Dispatched!</p>
              <p className="text-xs text-muted px-4 leading-relaxed">
                We sent a secure magic authentication link to <strong className="text-brown">{magicEmail}</strong>. 
                Please open your email inbox and click the link to sign in automatically and continue.
              </p>
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-[11px] text-gold-600 hover:text-gold-700 underline tracking-wider font-cinzel mt-2"
              >
                USE A DIFFERENT EMAIL
              </button>
            </div>
          )}
        </div>
      )}

      {/* Safety warning */}
      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded mt-6 flex items-start gap-2.5">
        <ShieldCheck className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
        <p className="text-[10px] text-emerald-800 leading-normal">
          Ratnamayuri Spark Auth leverages secure passwordless verification. Emails are transmitted securely, protecting user accounts with zero SMS/Phone budget overhead.
        </p>
      </div>

      <div className="mt-6 text-center">
        <div className="divider-gold" />
        <p className="font-garamond text-sm text-muted mt-4">
          New to Ratnamayuri?{" "}
          <Link href="/auth/signup" className="text-gold-600 hover:text-gold-500 underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
