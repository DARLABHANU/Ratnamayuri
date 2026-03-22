"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, BarChart2, User, LogOut, Store } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/merchant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/merchant/products", label: "Products", icon: Package },
  { href: "/merchant/orders", label: "Orders", icon: ShoppingBag },
  { href: "/merchant/analytics", label: "Analytics", icon: BarChart2 },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => { logout(); router.push("/auth/login"); };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-deep flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="block">
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
            <Link key={href} href={href}
              className={cn("sidebar-link rounded-sm", pathname === href && "active")}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link href="/merchant/profile" className={cn("sidebar-link rounded-sm", pathname === "/merchant/profile" && "active")}>
            <User size={15} /> Profile
          </Link>
          <button onClick={handleLogout} className="sidebar-link rounded-sm w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-cream overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
