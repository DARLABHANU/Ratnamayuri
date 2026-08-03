"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Mail, ChevronLeft, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api";
import { getApiError } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({
        email: data.email.trim().toLowerCase(),
      });
      toast.success("Password reset OTP sent to your email!");
      
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email.trim().toLowerCase())}&purpose=password_reset`);
    } catch (err) {
      toast.error(getApiError(err) || "Failed to request password reset OTP.");
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
          <ChevronLeft size={16} /> Back to Sign In
        </Link>
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            ACCOUNT RECOVERY
          </span>
          <h2 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#1C2E24]">Forgot Password</h2>
          <p className="text-xs text-[#8C9890] leading-relaxed">
            Enter your email address. We will send you a 6-digit OTP code to reset your password.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
        <div>
          <label className="text-xs font-bold text-[#1C2E24] block mb-1">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890] w-4 h-4" />
            <input
              {...register("email")}
              type="email"
              placeholder="yourname@example.com"
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              autoComplete="email"
              required
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email.message}</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          SEND VERIFICATION CODE
        </button>
      </form>

      {/* Security Badge */}
      <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-3 rounded-2xl flex items-center gap-2.5 w-full">
        <ShieldCheck className="text-[#2E7D32] flex-shrink-0" size={16} />
        <p className="text-[11px] text-[#2E7D32] font-semibold leading-normal">
          Ratnamayuri Security System. Verification codes expire in 10 minutes.
        </p>
      </div>
    </div>
  );
}
