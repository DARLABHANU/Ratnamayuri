"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, ChevronLeft, RefreshCw } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getApiError } from "@/lib/utils";

function VerifyOtpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const phone = params.get("phone") || "";
  const purpose = params.get("purpose") || "email_verify"; // "email_verify" | "password_reset"

  const { setAuth } = useAuthStore();

  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP code");
      return;
    }

    setIsLoading(true);
    try {
      if (purpose === "password_reset") {
        // Redirect to reset password page with email and verified OTP
        toast.success("OTP verified successfully!");
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(code)}`);
      } else {
        // Normal account / email OTP verification
        const res = await authApi.verifyOtp({
          identifier: email || phone,
          channel: "email",
          otpCode: code
        });
        
        if (res.data?.access_token) {
          setAuth({
            access_token: res.data.access_token,
            refresh_token: res.data.refresh_token,
            role: res.data.role || "customer",
            user_id: res.data.user_id
          });
        }
        
        toast.success("Verification successful!");
        router.push(res.data?.role === "merchant" ? "/merchant/dashboard" : res.data?.role === "admin" ? "/admin/dashboard" : "/");
      }
    } catch (err) {
      toast.error(getApiError(err) || "Invalid OTP code. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      await authApi.sendOtp({
        identifier: email || phone,
        channel: "email"
      });
      toast.success("A new 6-digit verification code has been sent!");
      setTimer(60);
    } catch (err) {
      toast.error(getApiError(err) || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-6 text-[#1C2E24] font-garamond">
      <div>
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-1 text-xs text-[#0D2619] hover:underline font-bold mb-4 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Sign In
        </Link>
        <div className="w-10 h-10 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center mb-3">
          <ShieldCheck size={20} className="text-[#0D2619]" />
        </div>
        <h2 className="font-cormorant text-3xl font-bold text-[#1C2E24]">
          {purpose === "password_reset" ? "Reset Password OTP" : "Verify Your Account"}
        </h2>
        <p className="text-xs text-[#8C9890] mt-1 leading-relaxed">
          We have sent a 6-digit security code to <strong className="text-[#1C2E24]">{email || phone || "your email"}</strong>. Enter it below to proceed.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="text-xs font-bold text-[#1C2E24] block mb-2">6-DIGIT VERIFICATION CODE</label>
          <div className="flex gap-2 justify-between" onPaste={handlePaste}>
            {otpCode.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-12 text-center text-lg font-bold bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl text-[#1C2E24] focus:outline-none focus:border-[#0D2619] focus:bg-white transition-all shadow-xs"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          <span>Verify Code</span>
        </button>

        <div className="text-center pt-2">
          {timer > 0 ? (
            <p className="text-xs text-[#8C9890]">
              Resend code in <strong className="text-[#0D2619]">{timer}s</strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D2619] hover:underline"
            >
              {isResending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              <span>Resend Verification Code</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
