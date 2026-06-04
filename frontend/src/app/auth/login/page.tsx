"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, Phone, Loader2, ShieldCheck, ChevronLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { getApiError } from "@/lib/utils";

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
  
  // App states
  const [role, setRole] = useState<UserRole>("customer");
  const [channel, setChannel] = useState<"sms" | "email">("email");
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input of OTP on step change
  useEffect(() => {
    if (step === "verify") {
      otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  // Handle OTP digit changes
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

  // Submit OTP Request
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier.trim()) {
      setErrorMsg("Identifier is required");
      return;
    }

    if (channel === "email" && !identifier.includes("@")) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    if (channel === "sms" && !identifier.startsWith("+")) {
      setErrorMsg("Phone number must include country code (e.g., +919876543210)");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.sendOtp({
        identifier: identifier.trim(),
        channel: channel
      });
      toast.success(`Verification code dispatched via ${channel.toUpperCase()}!`);
      setStep("verify");
    } catch (err: any) {
      const apiErr = getApiError(err) || "Failed to transmit OTP. Please verify details.";
      setErrorMsg(apiErr);
      toast.error(apiErr);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP & Sign In
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const codeStr = otpCode.join("");
    
    if (codeStr.length < 6) {
      setErrorMsg("Please enter all 6 digits of the verification code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp({
        identifier: identifier.trim(),
        channel: channel,
        otpCode: codeStr,
        role: role
      });

      const tokenData = res.data;
      setAuth({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        role: tokenData.role,
        user_id: tokenData.user_id,
      });

      toast.success("Successfully authenticated!");
      router.push(ROLE_REDIRECTS[tokenData.role as UserRole] || "/");
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

  // Back to input screen
  const handleBackToRequest = () => {
    setStep("request");
    setOtpCode(Array(6).fill(""));
    setErrorMsg("");
  };

  return (
    <div className="animate-fade-up">
      {step === "request" ? (
        <>
          <div className="mb-6">
            <span className="section-tag">WELCOME TO RATNAMAYURI</span>
            <h2 className="font-cormorant text-3xl font-light text-brown">Sign In / Register</h2>
            <p className="font-garamond text-sm text-muted mt-2">
              Sign in securely using Twilio Verify. Choose your verification channel below.
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-1.5 uppercase font-bold">
              ROLE SELECTOR
            </label>
            <div className="grid grid-cols-3 gap-1 border border-gold-200 p-1 bg-white">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`text-center py-2 font-cinzel text-xs tracking-wide transition-all
                    ${role === opt.value ? "bg-deep text-gold-300 font-bold" : "text-muted hover:text-brown"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel selector */}
          <div className="grid grid-cols-2 border border-gray-200 rounded overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => {
                setChannel("email");
                setIdentifier("");
                setErrorMsg("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-cinzel tracking-wider transition-all
                ${channel === "email" ? "bg-gold-50 text-brown border-b-2 border-gold-500 font-bold" : "bg-white text-muted hover:text-brown"}`}
            >
              <Mail size={13} />
              EMAIL ADDRESS
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel("sms");
                setIdentifier("");
                setErrorMsg("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-cinzel tracking-wider transition-all
                ${channel === "sms" ? "bg-gold-50 text-brown border-b-2 border-gold-500 font-bold" : "bg-white text-muted hover:text-brown"}`}
            >
              <Phone size={13} />
              MOBILE SMS
            </button>
          </div>

          {/* Request OTP form */}
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                {channel === "email" ? "EMAIL ADDRESS" : "MOBILE NUMBER"}
              </label>
              <input
                type={channel === "email" ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={channel === "email" ? "you@example.com" : "+919876543210 (include country code)"}
                className="input-field bg-white text-gray-800"
                required
              />
              {errorMsg && (
                <p className="text-red-500 text-xs mt-1.5 font-garamond">{errorMsg}</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              SEND VERIFICATION CODE
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              type="button"
              onClick={handleBackToRequest}
              className="flex items-center gap-1 text-gold-600 hover:text-gold-500 font-cinzel text-xs tracking-wider mb-4"
            >
              <ChevronLeft size={16} />
              EDIT {channel === "email" ? "EMAIL" : "MOBILE"}
            </button>
            <span className="section-tag">VERIFICATION REQUIRED</span>
            <h2 className="font-cormorant text-3xl font-light text-brown">Enter Code</h2>
            <p className="font-garamond text-sm text-muted mt-2">
              Please enter the 6-digit OTP code dispatched to <strong className="text-brown">{identifier}</strong>.
            </p>
          </div>

          {/* Verification Code form */}
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
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
                  className={`w-12 h-14 text-center text-2xl font-cinzel border-2 bg-white
                    focus:outline-none transition-all rounded-md
                    ${digit ? "border-gold-500 text-brown font-bold" : "border-gold-200 text-muted"}
                    focus:border-gold-500`}
                  required
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs text-center font-garamond">{errorMsg}</p>
            )}

            <button type="submit" disabled={isLoading || otpCode.join("").length < 6} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              VERIFY & SIGN IN
            </button>
          </form>
        </>
      )}

      {/* Safety warning */}
      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded mt-8 flex items-start gap-2.5">
        <ShieldCheck className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
        <p className="text-[10px] text-emerald-800 leading-normal font-sans">
          Ratnamayuri uses Twilio Verify cryptography. Verification checks are securely validated with real-time token synchronization.
        </p>
      </div>
    </div>
  );
}
