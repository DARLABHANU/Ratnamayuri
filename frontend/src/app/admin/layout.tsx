"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Package, ShoppingBag,
  Tag, DollarSign, Headphones, LogOut, Shield, ArrowDownToLine, Menu, X, Wallet, ArrowLeftRight
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin/users",        label: "Users",        icon: Users },
  { href: "/admin/products",     label: "Products",     icon: Package },
  { href: "/admin/orders",       label: "Orders",       icon: ShoppingBag },
  { href: "/admin/coupons",      label: "Coupons",      icon: Tag },
  { href: "/admin/commissions",  label: "Commissions",  icon: DollarSign },
  { href: "/admin/withdrawals",  label: "Withdrawals",  icon: ArrowDownToLine },
  { href: "/admin/settlements",  label: "Settlements",  icon: Wallet },
  { href: "/admin/return-requests", label: "Return Requests", icon: ArrowLeftRight },
  { href: "/support/dashboard",  label: "Support View", icon: Headphones },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { logout, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <p className="font-cinzel text-sm tracking-[0.3em] text-gold-300">RATNAMAYURI</p>
          <p className="font-garamond text-xs tracking-widest text-gold-600 mt-0.5">ADMIN PORTAL</p>
        </Link>
      </div>

      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center">
          <Shield size={16} className="text-gold-400" />
        </div>
        <div className="min-w-0">
          <p className="font-cinzel text-xs text-gold-300 truncate">{user?.full_name ?? "Admin"}</p>
          <p className="font-garamond text-xs text-gold-600 capitalize">{user?.role}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={cn("sidebar-link rounded-sm", pathname.startsWith(href) && "active")}>
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button onClick={() => { logout(); router.push("/auth/login"); }}
          className="sidebar-link rounded-sm w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
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
          <p className="font-garamond text-[9px] tracking-widest text-gold-600 mt-0.5">ADMIN PORTAL</p>
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
