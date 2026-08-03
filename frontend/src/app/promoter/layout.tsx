"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, LogOut, Award, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function PromoterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D2619] text-emerald-100 font-garamond">
      <div className="p-6 border-b border-emerald-800/40">
        <Link href="/" className="block" onClick={() => setMobileOpen(false)}>
          <p className="font-cormorant font-bold text-lg tracking-widest text-white">RATNAMAYURI</p>
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 mt-0.5 uppercase">AFFILIATE PORTAL</p>
        </Link>
      </div>

      <div className="p-4 border-b border-emerald-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#19402B] border border-emerald-700/50 flex items-center justify-center">
            <Award size={16} className="text-emerald-300" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-white truncate">{user?.full_name || "Promoter"}</p>
            <p className="text-[11px] text-emerald-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <Link href="/promoter/dashboard" onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all",
            pathname === "/promoter/dashboard" 
              ? "bg-[#19402B] text-white shadow-2xs" 
              : "text-emerald-200/80 hover:bg-[#19402B]/50 hover:text-white"
          )}>
          <LayoutDashboard size={15} />
          Overview Dashboard
        </Link>
        <Link href="/" onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-200/80 hover:bg-[#19402B]/50 hover:text-white transition-all">
          <ShoppingBag size={15} />
          Back to Storefront
        </Link>
      </nav>

      <div className="p-3 border-t border-emerald-800/40">
        <button onClick={handleLogout} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold w-full text-red-300 hover:bg-red-950/40 transition-all">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F3] font-garamond text-[#1C2E24]">
      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-[#0D2619] border-b border-emerald-800/40">
        <div className="flex flex-col">
          <p className="font-cormorant font-bold text-base tracking-widest text-white">RATNAMAYURI</p>
          <p className="text-[9px] font-semibold tracking-widest text-emerald-400 mt-0.5 uppercase">AFFILIATE PORTAL</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar (Left side, permanent) */}
      <aside className="hidden lg:flex w-60 bg-[#0D2619] flex-col flex-shrink-0 min-h-screen border-r border-emerald-800/40">
        {sidebarContent}
      </aside>

      {/* Mobile Sliding Drawer Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 max-w-xs bg-[#0D2619] shadow-2xl h-full z-10 animate-slide-in">
            <div className="absolute top-4 right-4 z-20">
              <button onClick={() => setMobileOpen(false)} className="text-white p-1">
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 bg-[#FAF8F3] overflow-auto min-h-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
