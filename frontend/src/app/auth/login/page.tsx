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
      router.push(ROLE_REDIRECTS[tokenData.role as UserRole] || "/");
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
  }, []);

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
            <h2 className="font-cormorant text-3xl font-light text-brown mt-1">Sign In</h2>
            <p className="font-garamond text-sm text-muted mt-2 max-w-sm mx-auto">
              Access your personal account or dashboard. Sign in using your email or Google account.
            </p>
          </div>

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
                  placeholder="name@example.com"
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
              SIGN IN
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-5 items-center max-w-sm mx-auto">
            <div className="flex-grow border-t border-gold-200"></div>
            <span className="flex-shrink mx-4 text-xs font-cinzel text-muted tracking-wider">OR</span>
            <div className="flex-grow border-t border-gold-200"></div>
          </div>

          {/* Google Sign-in */}
          <div className="flex flex-col items-center justify-center py-2 mb-6 min-h-[60px]">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={24} className="animate-spin text-gold-500" />
                <p className="font-garamond text-xs text-muted">Securing session...</p>
              </div>
            ) : (
              <div id="google-signin-button" className="transition-all hover:scale-[1.02] active:scale-[0.98] duration-300" />
            )}
          </div>

          {/* Customer Signup Redirect */}
          <p className="text-center font-garamond text-sm text-muted mt-4">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-gold-600 underline font-semibold hover:text-gold-500 transition-colors">
              Sign Up
            </Link>
          </p>
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
          Ratnamayuri uses cryptographic security. Authentication sessions are securely synced with JWT authorization keys.
        </p>
      </div>
    </div>
  );
}
