"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, UserCheck, Loader2, ShieldAlert, Eye,
  FileText, LogOut, Phone, Mail, Hash, Menu, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { supportApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User, Order, AuditLog } from "@/types";
import { formatDate, formatDateTime, getApiError } from "@/lib/utils";

type Tab = "lookup" | "audit";

export default function SupportDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [tab, setTab] = useState<Tab>("lookup");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lookup state
  const [searchType, setSearchType] = useState<"account_number" | "email" | "name">("email");
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected user state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Impersonation state
  const [impersonateReason, setImpersonateReason] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [activeSession, setActiveSession] = useState<{ token: string; auditLogId: number; user: User } | null>(null);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, role]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setIsSearching(true);
    setResults([]);
    setSelectedUser(null);
    try {
      const payload: Record<string, string> = {};
      payload[searchType] = searchValue.trim();
      const { data } = await supportApi.lookup(payload);
      setResults(data);
      if (data.length === 0) toast("No users found", { icon: "ℹ️" });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setIsLoadingUser(true);
    try {
      const { data } = await supportApi.userOrders(user.id);
      setUserOrders(data.items);
    } catch {
      setUserOrders([]);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleImpersonate = async () => {
    if (!selectedUser || !impersonateReason.trim()) {
      toast.error("Please provide a reason for impersonation");
      return;
    }
    setIsImpersonating(true);
    try {
      const { data } = await supportApi.impersonate({
        target_user_id: selectedUser.id,
        reason: impersonateReason,
      });
      setActiveSession({ token: data.impersonation_token, auditLogId: data.audit_log_id, user: selectedUser });
      toast.success(`Impersonation session started for ${selectedUser.full_name}`);
      setImpersonateReason("");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsImpersonating(false);
    }
  };

  const handleEndImpersonation = async () => {
    if (!activeSession) return;
    try {
      await supportApi.endImpersonation(activeSession.auditLogId);
      setActiveSession(null);
      toast.success("Impersonation session ended and logged");
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    const newPassword = prompt("Enter new password for this user (min 8 chars):");
    if (!newPassword || newPassword.length < 8) { toast.error("Password too short"); return; }
    try {
      await supportApi.resetPassword(selectedUser.id, { new_password: newPassword });
      toast.success("Password reset successfully");
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const { data } = await supportApi.auditLogs({ page: 1, page_size: 50 });
      setAuditLogs(data.items);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (tab === "audit") loadAuditLogs();
  }, [tab]);  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/10">
        <p className="font-cinzel text-sm tracking-[0.3em] text-gold-300">RATNAMAYURI</p>
        <p className="font-garamond text-xs tracking-widest text-gold-600 mt-0.5">SUPPORT PORTAL</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <button onClick={() => { setTab("lookup"); setMobileOpen(false); }}
          className={`sidebar-link rounded-sm w-full ${tab === "lookup" ? "active" : ""}`}>
          <Search size={15} /> User Lookup
        </button>
        <button onClick={() => { setTab("audit"); setMobileOpen(false); }}
          className={`sidebar-link rounded-sm w-full ${tab === "audit" ? "active" : ""}`}>
          <FileText size={15} /> Audit Logs
        </button>
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={() => { useAuthStore.getState().logout(); router.push("/auth/login"); }}
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
          <p className="font-garamond text-[9px] tracking-widest text-gold-600 mt-0.5">SUPPORT PORTAL</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gold-300 hover:text-cream p-1">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 bg-deep sidebar-bg flex-col flex-shrink-0 min-h-screen">
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

      {/* Main */}
      <main className="flex-1 bg-cream dashboard-bg p-8 overflow-auto min-h-0">
        {/* Active impersonation banner */}
        {activeSession && (
          <div className="bg-orange-50 border-2 border-orange-400 p-4 mb-6 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-orange-600" />
              <div>
                <p className="font-cinzel text-xs tracking-wide text-orange-700">ACTIVE IMPERSONATION SESSION</p>
                <p className="font-garamond text-sm text-orange-600">
                  Viewing as: <strong>{activeSession.user.full_name}</strong> ({activeSession.user.email})
                </p>
              </div>
            </div>
            <button onClick={handleEndImpersonation}
              className="flex items-center gap-2 font-cinzel text-xs tracking-wide text-red-600
                border border-red-300 px-4 py-2 hover:bg-red-50 transition-colors">
              <LogOut size={12} /> END SESSION
            </button>
          </div>
        )}

        {/* ── Lookup Tab ── */}
        {tab === "lookup" && (
          <div>
            <div className="mb-8">
              <span className="section-tag">SUPPORT TOOLS</span>
              <h1 className="section-title">User <em className="italic">Lookup</em></h1>
            </div>

            {/* Search form */}
            <div className="card p-6 mb-6">
              <h2 className="font-cinzel text-xs tracking-widest text-muted mb-4">FIND A USER</h2>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  {([
                    { value: "account_number", label: "Account #", icon: Hash },
                    { value: "email",           label: "Email",      icon: Mail },
                    { value: "name",            label: "Name",       icon: UserCheck },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button"
                      onClick={() => setSearchType(value)}
                      className={`flex items-center gap-2 font-cinzel text-xs tracking-wide px-4 py-2 transition-all
                        ${searchType === value ? "bg-deep text-gold-400" : "border border-gold-200 text-muted hover:border-gold-500"}`}>
                      <Icon size={12} /> {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={
                      searchType === "account_number" ? "e.g. RM1234567890" :
                      searchType === "email" ? "user@example.com" : "Full or partial name"
                    }
                    className="input-field flex-1"
                  />
                  <button type="submit" disabled={isSearching || !searchValue.trim()}
                    className="btn-primary flex items-center gap-2 px-6">
                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    SEARCH
                  </button>
                </div>
              </form>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Search results */}
              {results.length > 0 && (
                <div>
                  <h2 className="font-cinzel text-xs tracking-widest text-muted mb-3">
                    RESULTS ({results.length})
                  </h2>
                  <div className="space-y-2">
                    {results.map((user) => (
                      <button key={user.id} onClick={() => handleSelectUser(user)}
                        className={`w-full text-left card p-4 transition-all hover:border-gold-400
                          ${selectedUser?.id === user.id ? "border-gold-500 bg-gold-50" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-garamond text-sm font-medium text-brown">{user.full_name}</p>
                            <p className="font-garamond text-xs text-muted">{user.email}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="font-cinzel text-xs text-gold-600">{user.account_number}</span>
                              <span className={`badge text-xs capitalize
                                ${user.role === "customer" ? "bg-gray-100 text-gray-600" : "bg-purple-100 text-purple-700"}`}>
                                {user.role}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-cinzel text-xs ${user.is_active ? "text-green-600" : "text-red-500"}`}>
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                            <br />
                            <span className="font-garamond text-xs text-muted">{formatDate(user.created_at)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected user detail panel */}
              {selectedUser && (
                <div>
                  <h2 className="font-cinzel text-xs tracking-widest text-muted mb-3">USER DETAILS</h2>
                  <div className="card p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-cormorant text-xl font-medium text-brown">{selectedUser.full_name}</p>
                        <p className="font-garamond text-sm text-muted">{selectedUser.email}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-200 to-gold-500
                        flex items-center justify-center font-cinzel text-deep text-lg">
                        {selectedUser.full_name[0]}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { label: "Account #", value: selectedUser.account_number },
                        { label: "Role",      value: selectedUser.role },
                        { label: "Status",    value: selectedUser.is_active ? "Active" : "Inactive" },
                        { label: "Verified",  value: selectedUser.is_verified ? "Yes" : "No" },
                        { label: "Phone",     value: selectedUser.phone || "—" },
                        { label: "Joined",    value: formatDate(selectedUser.created_at) },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-ivory p-2.5">
                          <p className="font-cinzel text-xs tracking-wide text-muted mb-0.5">{label}</p>
                          <p className="font-garamond text-sm text-brown capitalize">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      <button onClick={handleResetPassword}
                        className="w-full btn-outline text-xs py-2">
                        🔑 RESET PASSWORD
                      </button>

                      {!activeSession && (
                        <div className="space-y-2">
                          <input
                            value={impersonateReason}
                            onChange={(e) => setImpersonateReason(e.target.value)}
                            placeholder="Reason for impersonation (required)"
                            className="input-field py-2 text-sm"
                          />
                          <button onClick={handleImpersonate}
                            disabled={isImpersonating || !impersonateReason.trim()}
                            className="w-full btn-primary flex items-center justify-center gap-2 text-xs py-2 disabled:opacity-50">
                            {isImpersonating
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Eye size={12} />}
                            START IMPERSONATION SESSION
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User's orders */}
                  <h3 className="font-cinzel text-xs tracking-widest text-muted mb-2">ORDER HISTORY</h3>
                  {isLoadingUser ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="animate-spin text-gold-500" size={20} />
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="card p-6 text-center">
                      <p className="font-garamond text-sm text-muted">No orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userOrders.map((order) => (
                        <div key={order.id} className="card p-3 flex items-center justify-between">
                          <div>
                            <p className="font-cinzel text-xs text-brown">#{order.order_number}</p>
                            <p className="font-garamond text-xs text-muted">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-cinzel text-xs text-brown">₹{order.total_amount.toLocaleString("en-IN")}</p>
                            <p className={`font-cinzel text-xs capitalize
                              ${order.status === "delivered" ? "text-green-600" :
                                order.status === "cancelled" ? "text-red-500" : "text-yellow-600"}`}>
                              {order.status.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Audit Logs Tab ── */}
        {tab === "audit" && (
          <div>
            <div className="mb-8">
              <span className="section-tag">SECURITY</span>
              <h1 className="section-title">Audit <em className="italic">Logs</em></h1>
            </div>

            {isLoadingAudit ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="animate-spin text-gold-500" size={28} />
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ivory">
                    <tr>
                      <th className="table-th">Action</th>
                      <th className="table-th">Performed By</th>
                      <th className="table-th">Target User</th>
                      <th className="table-th">Description</th>
                      <th className="table-th">IP Address</th>
                      <th className="table-th">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-ivory/50 transition-colors">
                        <td className="table-td">
                          <span className={`badge text-xs capitalize
                            ${log.action.includes("impersonation") ? "bg-orange-100 text-orange-700" :
                              log.action.includes("reset") ? "bg-red-100 text-red-700" :
                              "bg-blue-100 text-blue-700"}`}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="table-td font-garamond text-xs text-muted">User #{log.performed_by}</td>
                        <td className="table-td font-garamond text-xs text-muted">
                          {log.target_user_id ? `User #${log.target_user_id}` : "—"}
                        </td>
                        <td className="table-td font-garamond text-xs text-muted max-w-xs truncate">
                          {log.description || "—"}
                        </td>
                        <td className="table-td font-garamond text-xs text-muted">{log.ip_address || "—"}</td>
                        <td className="table-td font-garamond text-xs text-muted">{formatDateTime(log.created_at)}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="table-td text-center py-10 font-garamond text-muted">
                          No audit logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
