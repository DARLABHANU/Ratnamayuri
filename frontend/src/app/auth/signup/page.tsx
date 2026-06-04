"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Re-route to the unified passwordless sign-in & register form
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 size={24} className="animate-spin text-gold-600 mb-4" />
      <p className="font-cinzel text-xs tracking-widest text-muted uppercase">
        Redirecting to Unified Secure Authentication...
      </p>
    </div>
  );
}
