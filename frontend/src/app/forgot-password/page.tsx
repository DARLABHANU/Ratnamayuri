"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Mail, ShieldAlert, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { getApiError } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Password, 3: Success
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success("Password reset code sent to your email!");
      setStep(2);
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the verification code sent to your email.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email,
        otp,
        new_password: newPassword,
      });
      toast.success("Password reset successfully!");
      setStep(3);
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-ivory/10">
      <div className="card max-w-md w-full p-8 border border-gold-200 bg-white/95 shadow-xl animate-fade-up relative overflow-hidden">
        {/* Subtle decorative gold line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-300 via-gold-600 to-gold-300" />

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div className="text-center space-y-2">
              <span className="font-cinzel text-[10px] tracking-widest text-gold-600 block">PASSWORD RECOVERY</span>
              <h1 className="font-cormorant text-3xl text-brown italic">Recover Account</h1>
              <p className="font-garamond text-sm text-muted max-w-xs mx-auto">
                Enter your registered email below, and we will send you a verification code to reset your password.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 py-2.5 font-garamond text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-cinzel text-xs tracking-widest"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" /> SENDING VERIFICATION...
                </>
              ) : (
                "REQUEST RESET CODE"
              )}
            </button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="font-cinzel text-[10px] tracking-widest text-muted hover:text-brown transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={10} /> BACK TO LOGIN
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="text-center space-y-2">
              <span className="font-cinzel text-[10px] tracking-widest text-gold-600 block">SECURITY VERIFICATION</span>
              <h1 className="font-cormorant text-3xl text-brown italic">Set New Password</h1>
              <p className="font-garamond text-xs text-muted max-w-xs mx-auto">
                We sent a 6-digit recovery code to <strong className="text-brown">{email}</strong>. Enter the code and set your new password below.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-1">VERIFICATION CODE</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500" size={16} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-field pl-10 py-2.5 font-mono text-center tracking-widest text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-1">NEW PASSWORD</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field py-2.5 font-garamond text-sm"
                />
              </div>

              <div>
                <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-1">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  required
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field py-2.5 font-garamond text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-cinzel text-xs tracking-widest"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" /> UPDATING PASSWORD...
                </>
              ) : (
                "RESET PASSWORD"
              )}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-cinzel text-[10px] tracking-widest text-muted hover:text-brown transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={10} /> CHANGE EMAIL
              </button>

              <button
                type="button"
                onClick={handleRequestOTP}
                className="font-cinzel text-[10px] tracking-widest text-gold-600 hover:text-gold-800 transition-colors"
              >
                RESEND OTP
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <span className="font-cinzel text-[10px] tracking-widest text-green-600 block">SUCCESSFUL</span>
              <h1 className="font-cormorant text-3xl text-brown italic">Password Updated</h1>
              <p className="font-garamond text-sm text-muted max-w-xs mx-auto">
                Your password has been changed successfully. You can now securely log in to your account with your new credentials.
              </p>
            </div>

            <Link
              href="/auth/login"
              className="btn-primary w-full py-3 block font-cinzel text-xs tracking-widest text-center"
            >
              LOG IN NOW
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
