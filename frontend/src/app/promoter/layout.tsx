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
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="block" onClick={() => setMobileOpen(false)}>
          <p className="font-cinzel text-sm tracking-[0.3em] text-gold-300">RATNAMAYURI</p>
          <p className="font-garamond text-xs tracking-widest text-gold-600 mt-0.5">AFFILIATE PORTAL</p>
        </Link>
      </div>

      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center">
            <Award size={16} className="text-gold-400" />
          </div>
          <div className="min-w-0">
            <p className="font-cinzel text-xs text-gold-300 truncate">{user?.full_name || "Promoter"}</p>
            <p className="font-garamond text-xs text-gold-600 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <Link href="/promoter/dashboard" onClick={() => setMobileOpen(false)}
          className={cn("sidebar-link rounded-sm", pathname === "/promoter/dashboard" && "active")}>
          <LayoutDashboard size={15} />
          Overview Dashboard
        </Link>
        <Link href="/" onClick={() => setMobileOpen(false)}
          className="sidebar-link rounded-sm">
          <ShoppingBag size={15} />
          Back to Storefront
        </Link>
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <button onClick={handleLogout} className="sidebar-link rounded-sm w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-deep sidebar-bg border-b border-white/10">
        <div className="flex flex-col">
          <p className="font-cinzel text-xs tracking-[0.2em] text-gold-300">RATNAMAYURI</p>
          <p className="font-garamond text-[9px] tracking-widest text-gold-600 mt-0.5">AFFILIATE PORTAL</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gold-300 hover:text-cream p-1">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar (Left side, permanent) */}
      <aside className="hidden lg:flex w-60 bg-deep sidebar-bg flex-col flex-shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sliding Drawer Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          
          {/* Drawer Panel */}
          <aside className="relative flex flex-col w-64 max-w-xs bg-deep sidebar-bg shadow-2xl h-full z-10 animate-slide-in">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="text-gold-300 hover:text-cream p-1">
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 bg-cream dashboard-bg overflow-auto min-h-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
