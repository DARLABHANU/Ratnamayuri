"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, KeyRound, ChevronLeft } from "lucide-react";
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
    <div className="space-y-6 text-[#1C2E24] font-garamond w-full">
      <div>
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2619] hover:underline mb-4 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Sign In
        </Link>
        <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase block w-fit mb-2">
          SECURITY UPDATE
        </span>
        <h2 className="font-cormorant text-3xl font-bold text-[#1C2E24]">Set New Password</h2>
        <p className="text-xs text-[#8C9890] mt-1 leading-relaxed">
          Your verification was successful. Please enter and confirm your new account password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="text-xs font-bold text-[#1C2E24] block mb-1">
            NEW PASSWORD
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl pr-10 pl-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C9890] hover:text-[#1C2E24]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-bold text-[#1C2E24] block mb-1">
            CONFIRM NEW PASSWORD
          </label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat password"
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl pr-10 pl-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C9890] hover:text-[#1C2E24]"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 font-semibold">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 mt-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          RESET & SAVE PASSWORD
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
