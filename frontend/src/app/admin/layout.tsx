"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Megaphone,
  Package,
  ShoppingBag,
  CircleDollarSign,
  Wallet,
  Tag,
  BarChart3,
  HelpCircle,
  Settings,
  Wrench,
  Globe,
  ChevronDown,
  LogOut,
  Headphones,
  Menu,
  X
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  hasDropdown?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users, hasDropdown: true },
  { href: "/admin/users?role=merchant", label: "Sellers", icon: Store },
  { href: "/admin/users?role=promoter", label: "Promoters", icon: Megaphone },
  { href: "/admin/products", label: "Products", icon: Package, hasDropdown: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/commissions", label: "Earnings & Commission", icon: CircleDollarSign },
  { href: "/admin/settlements", label: "Payouts & Withdrawals", icon: Wallet },
  { href: "/admin/coupons", label: "Coupons & Offers", icon: Tag },
  { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/admin/return-requests", label: "Disputes & Support", icon: HelpCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/marketing", label: "Marketing Tools", icon: Wrench },
  { href: "/admin/website-settings", label: "Website Settings", icon: Globe }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D2619] text-emerald-100 p-3 font-garamond justify-between">
      <div className="space-y-1 overflow-y-auto pr-1">
        
        {/* Nav Items */}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

          if (isActive) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white text-[#0D2619] font-bold text-xs shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-[#0D2619]" />
                  <span>{item.label}</span>
                </div>
                {item.hasDropdown && <ChevronDown size={14} className="opacity-70" />}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-emerald-100/80 hover:bg-white/10 hover:text-white text-xs font-medium transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-emerald-300/80" />
                <span>{item.label}</span>
              </div>
              {item.hasDropdown && <ChevronDown size={14} className="opacity-50" />}
            </Link>
          );
        })}

      </div>

      {/* Bottom Help Box */}
      <div className="pt-4 border-t border-emerald-900/50 space-y-3">
        <div className="bg-[#143323] border border-emerald-800/40 rounded-xl p-3.5 space-y-2">
          <div>
            <h4 className="text-xs font-bold text-white">Need Help?</h4>
            <p className="text-[11px] text-emerald-200/70">We are here to help you.</p>
          </div>
          <button
            onClick={() => router.push("/support/dashboard")}
            className="w-full bg-[#0D2619] hover:bg-[#19402B] text-emerald-200 border border-emerald-700/40 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <span>Contact Support</span>
            <Headphones size={13} />
          </button>
        </div>

        {/* User Account / Logout */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-200 font-bold text-xs flex items-center justify-center">
              {user?.full_name?.[0] || "A"}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-none">{user?.full_name?.split(" ")[0] || "Admin"}</p>
              <p className="text-[10px] text-emerald-300">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/auth/login");
            }}
            className="text-emerald-400 hover:text-red-400 p-1"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F4] text-[#1C2E24] font-garamond flex flex-col lg:flex-row">
      
      {/* Mobile Top Header Bar */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-[#0D2619] text-white border-b border-emerald-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200 font-bold text-xs">
            R
          </div>
          <span className="font-cormorant text-lg font-bold text-white">Ratnamayuri Admin</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-emerald-200 p-1">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 min-h-screen border-r border-emerald-950 bg-[#0D2619]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="w-64 bg-[#0D2619] h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
