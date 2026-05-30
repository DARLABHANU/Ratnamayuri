"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { getApiError } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
  role: z.enum(["customer", "merchant", "admin", "support"] as const),
});
type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "merchant", label: "Merchant" },
  { value: "admin", label: "Admin" },
  { value: "support", label: "Support" },
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "customer" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      const tokenData = res.data;

      if (tokenData.requires_otp) {
        toast.success("OTP sent to your email!");
        router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}&purpose=email_verification`);
        return;
      }

      setAuth({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        role: tokenData.role,
        user_id: tokenData.user_id,
      });

      toast.success("Welcome back!");
      router.push(ROLE_REDIRECTS[tokenData.role as UserRole]);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <span className="section-tag">WELCOME BACK</span>
        <h2 className="font-cormorant text-3xl font-light text-brown">Sign In</h2>
        <p className="font-garamond text-sm text-muted mt-2">
          Access your Ratnamayuri account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selector */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-2">
            LOGIN AS
          </label>
          <div className="grid grid-cols-4 gap-1 border border-gold-200 p-1 bg-white">
            {ROLE_OPTIONS.map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input type="radio" {...register("role")} value={opt.value} className="sr-only" />
                <div className={`text-center py-2 font-cinzel text-xs tracking-wide transition-all
                  ${watch("role") === opt.value
                    ? "bg-deep text-gold-300"
                    : "text-muted hover:text-brown"}`}>
                  {opt.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
            EMAIL ADDRESS
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className="input-field"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 font-garamond">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
            PASSWORD
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              className="input-field pr-10"
              autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="font-cinzel text-xs text-gold-600 hover:text-gold-500 tracking-wide"
          >
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          SIGN IN
        </button>
      </form>

      <div className="mt-6 text-center">
        <div className="divider-gold" />
        <p className="font-garamond text-sm text-muted mt-4">
          New to Ratnamayuri?{" "}
          <Link href="/auth/signup" className="text-gold-600 hover:text-gold-500 underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
