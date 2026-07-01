"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, Sparkles, Mail, Lock, ChevronLeft } from "lucide-react";
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
  
  const [role, setRole] = useState<UserRole>("customer");
  const [step, setStep] = useState<"login" | "verify">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Credentials state for Admin & Merchant
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP Verification state for Admin & Merchant first login
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

  // Handle Google Login Success for Customers
  const handleGoogleLoginSuccess = async (response: any) => {
    const idToken = response.credential;
    if (!idToken) {
      toast.error("Failed to receive Google credential token.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await authApi.googleLogin({
        idToken,
        role: role
      });

      const tokenData = res.data;
      setAuth({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        role: tokenData.role,
        user_id: tokenData.user_id,
      });

      toast.success("Successfully authenticated with Google!");
      router.push(ROLE_REDIRECTS[tokenData.role as UserRole] || "/");
    } catch (err: any) {
      const apiErr = getApiError(err) || "Google authentication failed. Please try again.";
      setErrorMsg(apiErr);
      toast.error(apiErr);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Credentials Login for Admins & Merchants
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
        role
      });

      const tokenData = res.data;

      if (tokenData.requires_otp) {
        toast.success("First-time login: verification code sent to your email.");
        setStep("verify");
      } else {
        setAuth({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          role: tokenData.role,
          user_id: tokenData.user_id,
        });

        toast.success("Successfully signed in!");
        router.push(ROLE_REDIRECTS[tokenData.role as UserRole] || "/");
      }
    } catch (err: any) {
      const apiErr = getApiError(err) || "Invalid credentials. Please verify and try again.";
      setErrorMsg(apiErr);
      toast.error(apiErr);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Verification for email login codes
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

      toast.success("Email verified and account signed in!");
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

  const handleBackToLogin = () => {
    setStep("login");
    setOtpCode(Array(6).fill(""));
    setErrorMsg("");
  };

  // Load Google Identity Services Script dynamically for customer role
  useEffect(() => {
    if (role !== "customer") return;

    const g = typeof window !== "undefined" ? (window as any).google : null;
    const initializeGoogleSignIn = () => {
      const currentGoogle = typeof window !== "undefined" ? (window as any).google : null;
      if (typeof window !== "undefined" && currentGoogle) {
        currentGoogle.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "752302768597-nqun52pubevqjlhp9c6lvrjg2q8qelif.apps.googleusercontent.com",
          callback: handleGoogleLoginSuccess,
        });

        currentGoogle.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left"
          }
        );
      }
    };

    if (g) {
      initializeGoogleSignIn();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
      return () => {
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
          existingScript.remove();
        }
      };
    }
  }, [role]);

  return (
    <div className="animate-fade-up">
      {step === "login" ? (
        <>
          <div className="mb-6 text-center">
            <span className="section-tag flex items-center justify-center gap-1">
              <Sparkles size={10} className="text-gold-500 animate-pulse" />
              WELCOME TO RATNAMAYURI
              <Sparkles size={10} className="text-gold-500 animate-pulse" />
            </span>
            <h2 className="font-cormorant text-3xl font-light text-brown mt-1">Sign In / Register</h2>
            <p className="font-garamond text-sm text-muted mt-2 max-w-sm mx-auto">
              {role === "customer" 
                ? "Experience handcrafted luxury. Sign in or register instantly using Google."
                : `Secure credential portal for authorized ${role} logins.`
              }
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-8">
            <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-2 text-center uppercase font-bold">
              ACCOUNT ROLE
            </label>
            <div className="grid grid-cols-3 gap-1 border border-gold-200 p-1 bg-white max-w-sm mx-auto rounded shadow-sm">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setRole(opt.value);
                    setErrorMsg("");
                  }}
                  className={`text-center py-2 font-cinzel text-xs tracking-wide transition-all rounded
                    ${role === opt.value ? "bg-deep text-gold-300 font-bold" : "text-muted hover:text-brown"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Google Button Container for Customer / Credentials form for Admin & Merchant */}
          {role === "customer" ? (
            <div className="flex flex-col items-center justify-center py-4 mb-6 min-h-[100px]">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 size={32} className="animate-spin text-gold-500" />
                  <p className="font-garamond text-sm text-muted">Authenticating secure session...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div 
                    id="google-signin-button" 
                    className="min-h-[44px] transition-all hover:scale-[1.02] active:scale-[0.98] duration-300"
                  />
                  {errorMsg && (
                    <p className="text-red-500 text-xs font-garamond text-center max-w-xs">{errorMsg}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleCredentialsLogin} className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500 w-4 h-4" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`${role}@ratnamayuri.live`}
                      className="input-field bg-white text-gray-800 pl-10 w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500 w-4 h-4" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field bg-white text-gray-800 pl-10 w-full"
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-red-500 text-xs font-garamond text-center">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4"
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  SIGN IN AS {role.toUpperCase()}
                </button>
              </form>

              {role === "merchant" && (
                <p className="text-center font-garamond text-sm text-muted mt-6">
                  Want to sell with us?{" "}
                  <Link href="/auth/signup" className="text-gold-600 underline font-semibold hover:text-gold-500 transition-colors">
                    Register as Merchant
                  </Link>
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <div className="max-w-sm mx-auto">
          <div className="mb-6">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="flex items-center gap-1 text-gold-600 hover:text-gold-500 font-cinzel text-xs tracking-wider mb-4"
            >
              <ChevronLeft size={16} />
              EDIT LOGIN DETAILS
            </button>
            <span className="section-tag">VERIFICATION REQUIRED</span>
            <h2 className="font-cormorant text-3xl font-light text-brown">Enter Code</h2>
            <p className="font-garamond text-sm text-muted mt-2">
              Please enter the 6-digit verification code sent to your email <strong className="text-brown">{email}</strong>.
            </p>
          </div>

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
        </div>
      )}

      {/* Safety warning */}
      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded mt-8 flex items-start gap-2.5 max-w-sm mx-auto shadow-sm">
        <ShieldCheck className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
        <p className="text-[10px] text-emerald-800 leading-normal font-sans">
          {role === "customer"
            ? "Ratnamayuri uses Google OAuth2 cryptography. Authentication sessions are securely synced with MERN-stack JWT authorization keys."
            : "Authorized system login portal. Attempts to bypass this credential shield will be automatically logged and audited."
          }
        </p>
      </div>
    </div>
  );
}
