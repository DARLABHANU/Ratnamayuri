"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CircleDollarSign,
  Wallet,
  Users,
  Star,
  Tag,
  Store,
  Settings,
  HelpCircle,
  Search,
  Bell,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { merchantApi, notificationApi } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/merchant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/merchant/products", label: "Products", icon: Package },
  { href: "/merchant/orders", label: "Orders", icon: ShoppingBag, badge: 8 },
  { href: "/merchant/analytics", label: "Earnings", icon: CircleDollarSign },
  { href: "/merchant/wallet", label: "Withdraw", icon: Wallet },
  { href: "/merchant/customers", label: "Customers", icon: Users },
  { href: "/merchant/reviews", label: "Reviews", icon: Star },
  { href: "/merchant/coupons", label: "Coupons", icon: Tag },
  { href: "/merchant/profile", label: "Store Profile", icon: Store },
  { href: "/merchant/settings", label: "Settings", icon: Settings },
  { href: "/merchant/support", label: "Support", icon: HelpCircle },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, isAuthenticated, role } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role === "merchant") {
      merchantApi.getProfile().then(res => setMerchantProfile(res.data)).catch(() => {});
      fetchNotifications();
      // Optional: Poll every minute for demo purposes
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, role]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D2619] text-emerald-100 p-4 font-garamond justify-between">
      
      <div className="space-y-4 overflow-y-auto pr-1">
        {/* Top Store Logo */}
        <div className="flex items-center gap-3 px-2 py-2 border-b border-emerald-900/50">
          <div className="w-8 h-8 rounded-full bg-[#143323] border border-gold-400/40 flex items-center justify-center text-gold-400">
            ✦
          </div>
          <div>
            <span className="font-cormorant text-lg font-bold text-white tracking-wide block leading-none">Ratnamayuri</span>
            <span className="text-[10px] text-emerald-300 font-semibold tracking-wider uppercase">Seller Panel</span>
          </div>
        </div>

        {/* Nav Items */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/merchant/dashboard" && pathname.startsWith(item.href));

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
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
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
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-emerald-900/50">
        <button
          onClick={() => {
            logout();
            router.push("/auth/login");
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-emerald-300 hover:text-red-400 text-xs font-semibold transition-colors"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F4] text-[#1C2E24] font-garamond flex flex-col lg:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 min-h-screen border-r border-emerald-950 bg-[#0D2619]">
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

      {/* Main Content Area + Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <header className="bg-white border-b border-[#E5E0D5] px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          
          {/* Left: Mobile Menu Toggle + Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-[#1C2E24] p-1">
              <Menu size={22} />
            </button>

            <div className="relative w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-1.5 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
              />
            </div>
          </div>

          {/* Right Controls: Notifications + Seller Avatar + View Store */}
          <div className="flex items-center gap-4">
            
            {/* Bell notification */}
            <div className="relative">
              <div 
                className="cursor-pointer text-[#1C2E24] hover:text-[#0D2619]" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#E5E0D5] overflow-hidden z-50">
                  <div className="p-3 border-b border-[#F0ECE1] flex justify-between items-center">
                    <h4 className="font-bold text-sm text-[#1C2E24]">Notifications</h4>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => handleMarkAsRead('all')} 
                        className="text-[10px] text-[#2E7D32] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#8C9890]">No notifications yet</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id || notif.id} 
                          className={`p-3 border-b border-[#F0ECE1] last:border-0 hover:bg-[#FAF8F3] transition-colors cursor-pointer ${!notif.is_read ? 'bg-[#F4F9F5]' : ''}`}
                          onClick={() => {
                            if (!notif.is_read) handleMarkAsRead(notif._id || notif.id);
                          }}
                        >
                          <p className="text-xs font-bold text-[#1C2E24]">{notif.title}</p>
                          <p className="text-[11px] text-[#6B7A70] mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[9px] text-[#8C9890] mt-1">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Seller profile pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#F0ECE1]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={merchantProfile?.logo_url || (user as any)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"}
                alt="Store Logo"
                className="w-8 h-8 rounded-full object-cover border border-[#E5E0D5]"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#1C2E24] leading-none truncate max-w-[100px]">
                  {merchantProfile?.business_name || user?.full_name?.split(" ")[0] || "Store"}
                </p>
                <p className="text-[10px] text-[#8C9890] flex items-center gap-0.5">
                  Seller <ChevronDown size={10} />
                </p>
              </div>
            </div>

            {/* View Store button */}
            <button
              onClick={() => router.push("/")}
              className="hidden md:inline-flex items-center gap-1.5 bg-[#0D2619] hover:bg-[#19402B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span>View Store</span>
              <ExternalLink size={13} />
            </button>

          </div>

        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-20 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E0D5] lg:hidden z-40 pb-safe">
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { href: "/merchant/dashboard", label: "Dashboard", icon: LayoutDashboard },
              { href: "/merchant/products", label: "Products", icon: Package },
              { href: "/merchant/orders", label: "Orders", icon: ShoppingBag, badge: NAV_ITEMS.find(n => n.href === "/merchant/orders")?.badge },
              { href: "/merchant/analytics", label: "Earnings", icon: CircleDollarSign },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/merchant/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center p-2 relative ${
                    isActive ? "text-[#0D2619]" : "text-[#8C9890] hover:text-[#556B5D]"
                  }`}
                >
                  <div className="relative">
                    <Icon size={20} className={isActive ? "fill-[#0D2619]/10" : ""} />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? "font-bold" : ""}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
