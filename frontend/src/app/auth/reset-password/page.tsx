"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { authApi } from "@/lib/api";
import { getApiError } from "@/lib/utils";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const otp = params.get("otp") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!email || !otp) {
      toast.error("Invalid reset request. Please initiate recovery again.");
      router.push("/auth/forgot-password");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: data.password,
      });

      toast.success("Password reset successfully! Please sign in with your new credentials.");
      router.push("/auth/login");
    } catch (err) {
      toast.error(getApiError(err) || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <span className="section-tag">SECURITY UPDATE</span>
        <h2 className="font-cormorant text-3xl font-light text-brown">Set New Password</h2>
        <p className="font-garamond text-sm text-muted mt-2">
          Your verification was successful. Please enter and confirm your new luxury vault credentials below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
            NEW PASSWORD
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              className="input-field pr-10 bg-white"
              autoComplete="new-password"
              required
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

        {/* Confirm Password */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
            CONFIRM PASSWORD
          </label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter password"
              className="input-field pr-10 bg-white"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brown"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 font-garamond">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading} 
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          RESET PASSWORD & SIGN IN
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
