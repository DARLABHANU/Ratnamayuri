// Location: frontend/src/app/auth/verify-link/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import axios from "axios";
import { Loader2, CheckCircle2, AlertOctagon, Mail } from "lucide-react";
import toast from "react-hot-toast";

// Express Backend Base API Url
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function VerifyLinkContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "input_email">("verifying");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if the current URL has the Firebase authentication parameters
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // 1. Retrieve email from local storage (set during Link sending)
      let storedEmail = window.localStorage.getItem("emailForSignIn");
      
      if (!storedEmail) {
        // If the link was clicked on a different device or browser, local storage won't have the email.
        // We must prompt the user to input the email they sent the link to.
        setStatus("input_email");
      } else {
        verifyAndAuthenticate(storedEmail);
      }
    } else {
      setStatus("error");
      setErrorMsg("This link is invalid or has already been used. Please request a new magic checkout link.");
    }
  }, []);

  const verifyAndAuthenticate = async (userEmail: string) => {
    setStatus("verifying");
    setIsSubmitting(true);
    try {
      // 2. Sign in with Firebase Client Auth using email & landing URL parameters
      const result = await signInWithEmailLink(auth, userEmail, window.location.href);
      
      // Clear email from storage
      window.localStorage.removeItem("emailForSignIn");

      if (!result.user) {
        throw new Error("Failed to authenticate session with Firebase.");
      }

      // 3. Extract the Firebase JWT ID Token
      const idToken = await result.user.getIdToken();

      // 4. Send Firebase ID Token to Ratnamayuri backend to generate local JWT cookies & session
      const backendResponse = await axios.post(`${API_URL}/auth/firebase`, {
        token: idToken,
        role: "customer"
      });

      const { access_token, refresh_token } = backendResponse.data;

      // Save tokens in document cookies so that frontend API wrappers can fetch them automatically
      const Cookies = (await import("js-cookie")).default;
      Cookies.set("access_token", access_token, { expires: 1 });
      Cookies.set("refresh_token", refresh_token, { expires: 7 });

      setStatus("success");
      toast.success("Identity verified successfully!");

      // 5. Seamlessly redirect back to the checkout receipt or order gateway
      setTimeout(() => {
        router.push("/customer/orders/checkout");
      }, 2000);

    } catch (error: any) {
      console.error("Magic Link verification failure:", error);
      setStatus("error");
      setErrorMsg(
        error.response?.data?.detail || 
        error.message || 
        "Failed to verify your secure link. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    verifyAndAuthenticate(email.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4 bg-ivory/10">
      <div className="card w-full max-w-md p-8 border-gold-300 text-center space-y-6 bg-white shadow-lg">
        
        {status === "verifying" && (
          <div className="space-y-4 animate-pulse">
            <Loader2 className="animate-spin text-gold-600 mx-auto" size={40} />
            <h2 className="font-cinzel text-lg font-bold text-deep tracking-widest">VERIFYING LINK</h2>
            <p className="font-garamond text-sm text-muted">
              Communicating securely with Firebase Identity servers. Please do not close or refresh this page...
            </p>
          </div>
        )}

        {status === "input_email" && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-12 h-12 bg-gold-500/10 text-gold-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail size={22} />
            </div>
            <h2 className="font-cinzel text-lg font-bold text-deep tracking-wider">CONFIRM EMAIL</h2>
            <p className="font-garamond text-xs text-muted leading-relaxed">
              You opened this link in a new tab or device. To maintain secure isolation, please enter the email address where you received the checkout link.
            </p>
            <form onSubmit={handleManualEmailSubmit} className="space-y-3 pt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@example.com"
                className="input-field w-full text-center"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    VERIFYING...
                  </>
                ) : (
                  "VERIFY & CONTINUE"
                )}
              </button>
            </form>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-scale">
            <CheckCircle2 className="text-green-600 mx-auto animate-bounce" size={40} />
            <h2 className="font-cinzel text-lg font-bold text-green-800 tracking-widest">IDENTITY VERIFIED</h2>
            <p className="font-garamond text-sm text-muted">
              Secure checkout session generated. Redirecting you back to complete your Razorpay transaction...
            </p>
            <Loader2 className="animate-spin text-green-600 mx-auto mt-2" size={20} />
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 animate-fade-in">
            <AlertOctagon className="text-red-600 mx-auto" size={40} />
            <h2 className="font-cinzel text-lg font-bold text-red-800 tracking-wider">VERIFICATION FAILED</h2>
            <p className="font-garamond text-sm text-muted leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => router.push("/customer/orders/checkout")}
              className="btn-primary px-6 py-2 text-xs font-semibold font-cinzel mt-4"
            >
              BACK TO CHECKOUT
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyMagicLinkPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    }>
      <VerifyLinkContent />
    </Suspense>
  );
}
