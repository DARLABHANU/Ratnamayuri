"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Mail, ChevronLeft } from "lucide-react";
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
      
      // Redirect to OTP verification page for password reset
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email.trim().toLowerCase())}&purpose=password_reset`);
    } catch (err) {
      toast.error(getApiError(err) || "Failed to request password reset OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-1 font-cinzel text-xs text-gold-600 hover:text-gold-500 tracking-wider mb-4 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Sign In
        </Link>
        <span className="section-tag">ACCOUNT RECOVERY</span>
        <h2 className="font-cormorant text-3xl font-light text-brown">Forgot Password</h2>
        <p className="font-garamond text-sm text-muted mt-2">
          Enter the email address associated with your account. We will send you a secure 6-digit verification code to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <input
              {...register("email")}
              type="email"
              placeholder="yourname@example.com"
              className="input-field bg-white"
              autoComplete="email"
              required
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 font-garamond">{errors.email.message}</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading} 
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          SEND VERIFICATION CODE
        </button>
      </form>
    </div>
  );
}
