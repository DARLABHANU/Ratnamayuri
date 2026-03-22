"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { getApiError } from "@/lib/utils";

const ROLE_REDIRECTS: Record<UserRole, string> = {
  customer: "/customer/dashboard",
  merchant: "/merchant/dashboard",
  admin: "/admin/dashboard",
  support: "/support/dashboard",
};

function OTPForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const purpose = (params.get("purpose") || "email_verification") as string;
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter all 6 digits"); return; }

    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, otp: code, purpose });
      const tokenData = res.data;

      if (tokenData.access_token) {
        setAuth({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          role: tokenData.role,
          user_id: tokenData.user_id,
        });
        toast.success("Email verified! Welcome to Ratnamayuri.");
        router.push(ROLE_REDIRECTS[tokenData.role as UserRole] || "/customer/dashboard");
      } else if (purpose === "password_reset") {
        toast.success("OTP verified!");
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${code}`);
      }
    } catch (err) {
      toast.error(getApiError(err));
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.resendOtp({ email, purpose });
      toast.success("OTP resent! Check your inbox.");
      setResendCooldown(60);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="animate-fade-up text-center">
      <div className="w-16 h-16 bg-deep rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="text-gold-400" size={28} />
      </div>

      <span className="section-tag">VERIFICATION</span>
      <h2 className="font-cormorant text-3xl font-light text-brown mb-2">
        Check Your Email
      </h2>
      <p className="font-garamond text-sm text-muted mb-2">
        We sent a 6-digit code to
      </p>
      <p className="font-cinzel text-sm text-brown tracking-wide mb-8">{email}</p>

      <form onSubmit={handleSubmit}>
        {/* OTP inputs */}
        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-2xl font-cinzel border-2 bg-white
                focus:outline-none transition-colors
                ${digit ? "border-gold-500 text-brown" : "border-gold-200 text-muted"}
                focus:border-gold-500`}
            />
          ))}
        </div>

        <button type="submit" disabled={isLoading || otp.join("").length < 6}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          VERIFY OTP
        </button>
      </form>

      <button onClick={handleResend} disabled={resendCooldown > 0}
        className="flex items-center gap-2 mx-auto font-cinzel text-xs tracking-wide
          text-gold-600 hover:text-gold-500 disabled:text-muted disabled:cursor-not-allowed transition-colors">
        <RefreshCw size={12} className={resendCooldown > 0 ? "animate-spin" : ""} />
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
      </button>

      <div className="divider-gold mt-6" />
      <p className="font-garamond text-xs text-muted mt-4">
        Didn't receive the email? Check spam folder or{" "}
        <button onClick={handleResend} className="text-gold-600 hover:underline">try again</button>
      </p>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted font-garamond">Loading...</div>}>
      <OTPForm />
    </Suspense>
  );
}
