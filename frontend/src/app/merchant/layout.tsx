"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, BarChart2, User, LogOut, Store, Wallet, Menu, X, BookOpen } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/merchant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/merchant/products", label: "Products", icon: Package },
  { href: "/merchant/orders", label: "Orders", icon: ShoppingBag },
  { href: "/merchant/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/merchant/wallet", label: "Wallet", icon: Wallet },
  { href: "/merchant/instructions", label: "User Manual", icon: BookOpen },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); router.push("/auth/login"); };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="block" onClick={() => setMobileOpen(false)}>
          <p className="font-cinzel text-sm tracking-[0.3em] text-gold-300">RATNAMAYURI</p>
          <p className="font-garamond text-xs tracking-widest text-gold-600 mt-0.5">MERCHANT PORTAL</p>
        </Link>
      </div>

      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center">
            <Store size={16} className="text-gold-400" />
          </div>
          <div className="min-w-0">
            <p className="font-cinzel text-xs text-gold-300 truncate">{user?.full_name || "Merchant"}</p>
            <p className="font-garamond text-xs text-gold-600 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={cn("sidebar-link rounded-sm", pathname === href && "active")}>
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link href="/merchant/profile" onClick={() => setMobileOpen(false)}
          className={cn("sidebar-link rounded-sm", pathname === "/merchant/profile" && "active")}>
          <User size={15} /> Profile
        </Link>
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
          <p className="font-garamond text-[9px] tracking-widest text-gold-600 mt-0.5">MERCHANT PORTAL</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gold-300 hover:text-cream p-1">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-deep sidebar-bg flex-col flex-shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
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
