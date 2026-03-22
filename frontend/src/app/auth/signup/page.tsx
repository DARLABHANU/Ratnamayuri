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
import { getApiError } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/\d/, "Must contain a number"),
  confirm_password: z.string(),
  role: z.enum(["customer", "merchant"] as const),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "customer" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { confirm_password, ...payload } = data;
      await authApi.signup(payload);
      toast.success("Account created! Check your email for OTP.");
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}&purpose=email_verification`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <span className="section-tag">JOIN US</span>
        <h2 className="font-cormorant text-3xl font-light text-brown">Create Account</h2>
        <p className="font-garamond text-sm text-muted mt-2">
          Begin your Ratnamayuri journey
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Account type */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-2">
            I AM A
          </label>
          <div className="grid grid-cols-2 gap-1 border border-gold-200 p-1 bg-white">
            {(["customer", "merchant"] as const).map((role) => (
              <label key={role} className="cursor-pointer">
                <input type="radio" {...register("role")} value={role} className="sr-only" />
                <div className={`text-center py-2 font-cinzel text-xs tracking-wide transition-all
                  ${watch("role") === role ? "bg-deep text-gold-300" : "text-muted hover:text-brown"}`}>
                  {role === "customer" ? "Customer" : "Merchant / Seller"}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Full name */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">FULL NAME</label>
          <input {...register("full_name")} placeholder="Priya Sharma" className="input-field" />
          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">EMAIL ADDRESS</label>
          <input {...register("email")} type="email" placeholder="you@example.com" className="input-field" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
            PHONE <span className="text-muted font-garamond normal-case tracking-normal">(optional)</span>
          </label>
          <input {...register("phone")} type="tel" placeholder="+91 98765 43210" className="input-field" />
        </div>

        {/* Password */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PASSWORD</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className="input-field pr-10"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brown">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">CONFIRM PASSWORD</label>
          <input
            {...register("confirm_password")}
            type={showPassword ? "text" : "password"}
            placeholder="Repeat password"
            className="input-field"
          />
          {errors.confirm_password && (
            <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          CREATE ACCOUNT
        </button>

        <p className="font-garamond text-xs text-muted text-center">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-gold-600 hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-gold-600 hover:underline">Privacy Policy</Link>
        </p>
      </form>

      <div className="mt-6 text-center">
        <div className="divider-gold" />
        <p className="font-garamond text-sm text-muted mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-gold-600 hover:text-gold-500 underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
