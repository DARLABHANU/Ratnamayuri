"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Phone, Mail, ShieldAlert } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { getApiError } from "@/lib/utils";
import { auth as firebaseAuth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
  role: z.enum(["customer", "merchant", "admin", "support"] as const),
});
type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "merchant", label: "Merchant" },
  { value: "admin", label: "Admin" },
  { value: "support", label: "Support" },
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
  const [authMethod, setAuthMethod] = useState<"password" | "phone">("password");
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [verificationCode, setVerificationCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "customer" },
  });

  const selectedRole = watch("role") || "customer";

  // Clean up recaptcha widget on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

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

  // Firebase Phone Verification
  const setupRecaptcha = () => {
    try {
      if (!window || recaptchaVerifierRef.current) return;
      
      const container = document.getElementById("recaptcha-container");
      if (!container) return;

      recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved, ready to sign in
        },
        "expired-callback": () => {
          toast.error("reCAPTCHA expired. Please request OTP again.");
        }
      });
    } catch (err) {
      console.error("Recaptcha setup error:", err);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number (e.g. +91 9876543210)");
      return;
    }

    setIsLoading(true);
    setupRecaptcha();

    try {
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) {
        throw new Error("Recaptcha AppVerifier failed to construct. Check Firebase keys.");
      }

      const confirmation = await signInWithPhoneNumber(firebaseAuth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success("Verification SMS sent to your mobile phone!");
    } catch (err) {
      toast.error("SMS limit exceeded or invalid phone number config.");
      console.error("Firebase SMS trigger failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("No confirmation result available.");
      }

      const result = await confirmationResult.confirm(verificationCode);
      const idToken = await result.user.getIdToken();

      // Submit Firebase ID Token to backend for verification and auto-registration
      const res = await authApi.firebaseLogin({
        token: idToken,
        role: selectedRole
      });

      const tokenData = res.data;

      setAuth({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        role: tokenData.role,
        user_id: tokenData.user_id,
      });

      toast.success("Verified successfully! Welcome back.");
      router.push(ROLE_REDIRECTS[tokenData.role as UserRole]);
    } catch (err) {
      toast.error("Invalid OTP code. Please try again.");
      console.error("OTP validation failed:", err);
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
          Access your Ratnamayuri account using standard passwords or secure SMS OTP.
        </p>
      </div>

      {/* Invisible Recaptcha Anchor */}
      <div id="recaptcha-container" className="invisible"></div>

      {/* Role selector */}
      <div className="mb-4">
        <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-1.5 uppercase font-bold">
          LOGIN AS
        </label>
        <div className="grid grid-cols-4 gap-1 border border-gold-200 p-1 bg-white">
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
          onClick={() => setAuthMethod("phone")}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-cinzel tracking-wider transition-all
            ${authMethod === "phone" ? "bg-gold-50 text-brown border-b-2 border-gold-500 font-bold" : "bg-white text-muted hover:text-brown"}`}
        >
          <Phone size={13} />
          MOBILE SMS OTP
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

      {/* Method B: Firebase SMS OTP form */}
      {authMethod === "phone" && (
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendPhoneOtp} className="space-y-4">
              <div>
                <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                  MOBILE NUMBER
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-field flex-1 bg-white font-mono"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Include country code (e.g. +91 for India)</p>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                SEND SMS CODE
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
              <div>
                <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                  6-DIGIT VERIFICATION CODE
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000 000"
                  className="input-field text-center font-mono tracking-[8px] text-lg bg-white"
                />
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Code sent to {phoneNumber}</span>
                <button type="button" onClick={() => setOtpSent(false)} className="text-gold-600 font-bold hover:underline">
                  Change number
                </button>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                VERIFY & SIGN IN
              </button>
            </form>
          )}
        </div>
      )}

      {/* Safety warning */}
      <div className="bg-orange-50 border border-orange-100 p-3 rounded mt-6 flex items-start gap-2.5">
        <ShieldAlert className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
        <p className="text-[10px] text-orange-800 leading-normal">
          Make sure your Firebase project Console is configured with active SMS quotes for Phone OTP and your client-side environment secrets are properly updated.
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
