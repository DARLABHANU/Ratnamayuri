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

const ROLE_REDIRECTS: Record<UserRole, string> = {
  customer: "/",
  merchant: "/merchant/dashboard",
  admin: "/admin/dashboard",
  support: "/support/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  
  const [step, setStep] = useState<"login" | "verify">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Credentials state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP Verification state for first login
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

  // Handle Google Login Success
  const handleGoogleLoginSuccess = async (response: any) => {
    const idToken = response.credential;
    if (!idToken) {
      toast.error("Failed to receive Google credential token.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await authApi.googleLogin({ idToken });
      const tokenData = res.data;
      
      setAuth({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        role: tokenData.role,
        user_id: tokenData.user_id,
      });

      toast.success("Successfully authenticated with Google!");
      window.location.href = ROLE_REDIRECTS[tokenData.role as UserRole] || "/";
    } catch (err: any) {
      const apiErr = getApiError(err) || "Google authentication failed. Please try again.";
      setErrorMsg(apiErr);
      toast.error(apiErr);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Credentials Login
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
        password
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

        const redirectPath = ROLE_REDIRECTS[tokenData.role as UserRole] || "/";
        toast.success("Successfully signed in!");
        window.location.href = redirectPath;
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
      window.location.href = ROLE_REDIRECTS[tokenData.role as UserRole] || "/";
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

  // Load Google Identity Services Script dynamically
  useEffect(() => {
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
            width: 280,
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
  }, []);

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond w-full">
      {step === "login" ? (
        <>
          <div className="mb-5 text-center">
            <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-flex items-center gap-1">
              <Sparkles size={10} className="text-[#2E7D32] animate-pulse" />
              AUTHENTICATION PORTAL
            </span>
            <h2 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#1C2E24] mt-2">Sign In</h2>
            <p className="text-xs text-[#8C9890] mt-1 leading-relaxed">
              Access your account or dashboard using your credentials.
            </p>
          </div>

          <form onSubmit={handleCredentialsLogin} className="space-y-4 w-full">
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
                  placeholder="name@example.com"
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
              <div className="flex justify-end mt-1.5">
                <Link href="/auth/forgot-password" className="text-xs font-bold text-[#0D2619] hover:underline">
                  Forgot Password?
                </Link>
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
              SIGN IN
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-3 items-center w-full">
            <div className="flex-grow border-t border-[#F0ECE1]"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-[#8C9890] tracking-wider">OR</span>
            <div className="flex-grow border-t border-[#F0ECE1]"></div>
          </div>

          {/* Google Sign-in */}
          <div className="flex flex-col items-center justify-center py-1 mb-2 min-h-[50px]">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-[#0D2619]" />
                <p className="text-xs text-[#8C9890]">Securing session...</p>
              </div>
            ) : (
              <div id="google-signin-button" className="transition-all hover:scale-[1.02] active:scale-[0.98] duration-300 max-w-full overflow-hidden" />
            )}
          </div>

          {/* Customer Signup Redirect */}
          <p className="text-center text-xs text-[#8C9890]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-[#0D2619] font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </>
      ) : (
        <div className="w-full">
          <div className="mb-5">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="flex items-center gap-1 text-[#0D2619] font-bold text-xs mb-3 hover:underline"
            >
              <ChevronLeft size={16} />
              Edit Login Details
            </button>
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Enter Code</h2>
            <p className="text-xs text-[#8C9890] mt-1">
              Please enter the 6-digit verification code sent to <strong className="text-[#1C2E24]">{email}</strong>.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5 w-full">
            <div className="flex gap-1.5 sm:gap-2 justify-between" onPaste={handleOtpPaste}>
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
                  className="w-10 sm:w-11 h-11 sm:h-12 text-center text-base sm:text-lg font-bold bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl text-[#1C2E24] focus:outline-none focus:border-[#0D2619] focus:bg-white transition-all shadow-xs"
                  required
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs text-center font-semibold">{errorMsg}</p>
            )}

            <button type="submit" disabled={isLoading || otpCode.join("").length < 6} className="w-full inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50">
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              VERIFY &amp; SIGN IN
            </button>
          </form>
        </div>
      )}

      {/* Security Badge */}
      <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-3 rounded-2xl flex items-center gap-2.5 w-full">
        <ShieldCheck className="text-[#2E7D32] flex-shrink-0" size={16} />
        <p className="text-[11px] text-[#2E7D32] font-semibold leading-normal">
          Ratnamayuri Security System. Encrypted SSL sessions.
        </p>
      </div>
    </div>
  );
}
