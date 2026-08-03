"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, Sparkles, User, Mail, Lock, Phone, ChevronLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getApiError } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<"register" | "verify">("register");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Register Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // OTP Verification state
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "verify") {
      otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpCode(pasted.split(""));
      otpInputRefs.current[5]?.focus();
    }
  };

  // Submit Registration Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || !email.trim() || !password || !phone.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }

    // Phone Validation: 10-digit Indian phone starting with 6,7,8,9
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).");
      return;
    }

    // Password Complexity Validation: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMsg("Password must contain at least 1 uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setErrorMsg("Password must contain at least 1 lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMsg("Password must contain at least 1 numeric digit.");
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setErrorMsg("Password must contain at least 1 special character (!@#$%^&*).");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.signup({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: "customer",
      });

      toast.success("Account created! Verification code sent to email.");
      setStep("verify");
    } catch (err: any) {
      const apiErr = getApiError(err) || "Registration failed. Email might already be in use.";
      setErrorMsg(apiErr);
      toast.error(apiErr);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const codeStr = otpCode.join("");

    if (codeStr.length < 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyEmailOtp({
        email: email.trim().toLowerCase(),
        otp: codeStr,
      });

      const tokenData = res.data;
      setAuth({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        role: tokenData.role,
        user_id: tokenData.user_id,
      });

      toast.success("Email verified and account activated!");
      router.push("/");
    } catch (err: any) {
      const apiErr = getApiError(err) || "Invalid OTP code. Please try again.";
      setErrorMsg(apiErr);
      toast.error(apiErr);
      setOtpCode(Array(6).fill(""));
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRegister = () => {
    setStep("register");
    setOtpCode(Array(6).fill(""));
    setErrorMsg("");
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond w-full">
      {step === "register" ? (
        <>
          <div className="mb-6 text-center">
            <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-flex items-center gap-1">
              <Sparkles size={10} className="text-[#2E7D32] animate-pulse" />
              CREATE ACCOUNT
            </span>
            <h2 className="font-cormorant text-3xl font-bold text-[#1C2E24] mt-2">Join Ratnamayuri</h2>
            <p className="text-xs text-[#8C9890] mt-1 leading-relaxed">
              Sign up to discover luxury handlooms, fine sarees, and authentic bridal collections.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#1C2E24] block mb-1">
                FULL NAME
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890] w-4 h-4" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C2E24] block mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890] w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C2E24] block mb-1">
                PHONE NUMBER
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890] w-4 h-4" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C2E24] block mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890] w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs font-semibold text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 mt-2"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              CREATE ACCOUNT
            </button>
          </form>

          <p className="text-center text-xs text-[#8C9890] mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#0D2619] font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              type="button"
              onClick={handleBackToRegister}
              className="flex items-center gap-1 text-[#0D2619] font-bold text-xs mb-4 hover:underline"
            >
              <ChevronLeft size={16} />
              Edit Register Details
            </button>
            <h2 className="font-cormorant text-3xl font-bold text-[#1C2E24]">Enter Code</h2>
            <p className="text-xs text-[#8C9890] mt-1">
              We sent a 6-digit verification code to <strong className="text-[#1C2E24]">{email}</strong>.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpInputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl text-[#1C2E24] focus:outline-none focus:border-[#0D2619] focus:bg-white transition-all shadow-xs"
                  required
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs text-center font-semibold">{errorMsg}</p>
            )}

            <button type="submit" disabled={isLoading || otpCode.join("").length < 6} className="w-full inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50">
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              VERIFY & ACTIVATE ACCOUNT
            </button>
          </form>
        </>
      )}

      {/* Safety warning */}
      <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-3 rounded-2xl flex items-center gap-2.5 shadow-xs">
        <ShieldCheck className="text-[#2E7D32] flex-shrink-0" size={16} />
        <p className="text-[11px] text-[#2E7D32] font-semibold leading-normal">
          Ratnamayuri uses automated secure verification checks to validate and activate your login session.
        </p>
      </div>
    </div>
  );
}
