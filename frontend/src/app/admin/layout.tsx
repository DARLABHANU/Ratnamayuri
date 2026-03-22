"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Package, ShoppingBag,
  Tag, DollarSign, Headphones, LogOut, Shield,
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
  { href: "/support/dashboard",  label: "Support View", icon: Headphones },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { logout, user } = useAuthStore();

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-deep flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link href="/">
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
            <Link key={href} href={href}
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
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 bg-cream overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
