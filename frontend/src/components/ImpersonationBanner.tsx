"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { supportApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function ImpersonationBanner() {
  const { user, logout } = useAuthStore();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [targetName, setTargetName] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    const origToken = Cookies.get("impersonator_original_token");
    if (origToken) {
      setIsImpersonating(true);
      if (user) {
        setTargetName(user.full_name);
        setTargetEmail(user.email);
      }
    } else {
      setIsImpersonating(false);
    }
  }, [user]);

  const handleEndSession = async () => {
    setIsEnding(true);
    const auditId = Cookies.get("impersonator_audit_log_id");
    const origToken = Cookies.get("impersonator_original_token");
    const origRole = Cookies.get("impersonator_original_role");

    try {
      if (auditId) {
        await supportApi.endImpersonation(Number(auditId));
      }
    } catch (err) {
      console.error("Failed to cleanly end impersonation on backend:", err);
    }

    // Always restore support agent auth credentials
    if (origToken) {
      Cookies.set("access_token", origToken, { expires: 1, sameSite: "Lax" });
      if (origRole) {
        Cookies.set("user_role", origRole, { expires: 30, sameSite: "Lax" });
      }
      Cookies.remove("impersonator_original_token");
      Cookies.remove("impersonator_original_role");
      Cookies.remove("impersonator_audit_log_id");
      
      toast.success("Impersonation session ended. Returned to support portal.");
      window.location.href = "/support/dashboard";
    } else {
      // Fallback
      logout();
      window.location.href = "/auth/login";
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="bg-amber-600 text-white py-3 px-4 sticky top-0 z-[9999] shadow-md border-b border-amber-700 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-100 animate-pulse flex-shrink-0" />
          <div className="text-xs sm:text-sm font-semibold tracking-wide">
            <span className="font-extrabold uppercase text-[10px] bg-amber-800 px-2 py-0.5 rounded-full mr-2">SUPPORT MODE</span>
            Impersonating user: <span className="underline font-bold">{targetName || "Loading..."}</span> ({targetEmail || "..."})
          </div>
        </div>
        <button
          onClick={handleEndSession}
          disabled={isEnding}
          className="flex items-center gap-2 bg-white text-amber-800 hover:bg-amber-50 text-xs font-bold tracking-widest px-4 py-1.5 transition-colors rounded shadow-sm flex-shrink-0 disabled:opacity-50"
        >
          {isEnding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          END IMPERSONATION
        </button>
      </div>
    </div>
  );
}
