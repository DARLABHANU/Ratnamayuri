"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, UserCheck, Loader2, ShieldAlert, Eye,
  FileText, LogOut, Phone, Mail, Hash, Menu, X,
  MessageSquare, AlertCircle, Send, CheckCircle, Clock, Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { supportApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User, Order, AuditLog } from "@/types";
import { formatDate, formatDateTime, getApiError } from "@/lib/utils";

type Tab = "lookup" | "audit" | "tickets";

export default function SupportDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [tab, setTab] = useState<Tab>("tickets");
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

  // Support Tickets Queue
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketOrders, setTicketOrders] = useState<Order[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>("");
  const [agentReplyMsg, setAgentReplyMsg] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const { data } = await supportApi.impersonate({ target_user_id: selectedUser.id, reason: impersonateReason.trim() });
      setActiveSession({
        token: data.impersonation_token,
        auditLogId: data.audit_log_id,
        user: data.target_user,
      });

      Cookies.set("impersonation_token", data.impersonation_token, { expires: 1 / 24 });
      Cookies.set("impersonation_audit_id", String(data.audit_log_id), { expires: 1 / 24 });
      Cookies.set("impersonation_target_name", data.target_user.full_name, { expires: 1 / 24 });

      toast.success(`Impersonation active for ${data.target_user.full_name}. You can view the store from their perspective.`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsImpersonating(false);
    }
  };

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const { data } = await supportApi.auditLogs();
      setAuditLogs(data.items);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const params: any = {};
      if (ticketStatusFilter) params.status = ticketStatusFilter;
      if (ticketPriorityFilter) params.priority = ticketPriorityFilter;
      const { data } = await supportApi.getAllTickets(params);
      setTickets(data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (tab === "audit") loadAuditLogs();
    if (tab === "tickets") loadTickets();
  }, [tab, ticketStatusFilter, ticketPriorityFilter]);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketStatusUpdate(ticket.status);
    if (ticket.user_id) {
      try {
        const { data } = await supportApi.userOrders(ticket.user_id);
        setTicketOrders(data.items);
      } catch {
        setTicketOrders([]);
      }
    }
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !agentReplyMsg.trim()) return;
    setIsSendingReply(true);
    try {
      const payload: any = { message: agentReplyMsg.trim() };
      if (ticketStatusUpdate && ticketStatusUpdate !== selectedTicket.status) {
        payload.status = ticketStatusUpdate;
      }
      const { data } = await supportApi.agentReplyToTicket(selectedTicket.id, payload);
      toast.success("Reply submitted successfully");
      setSelectedTicket(data);
      setAgentReplyMsg("");
      loadTickets();
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSendingReply(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D2619] text-emerald-100 font-garamond">
      <div className="p-6 border-b border-emerald-800/40">
        <p className="font-cormorant font-bold text-lg tracking-widest text-white">RATNAMAYURI</p>
        <p className="text-[10px] font-semibold tracking-widest text-emerald-400 mt-0.5 uppercase">SUPPORT DASHBOARD</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => { setTab("tickets"); setMobileOpen(false); }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold transition-all rounded-xl ${
            tab === "tickets" ? "bg-[#19402B] text-white shadow-2xs" : "text-emerald-200/80 hover:bg-[#19402B]/50 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <MessageSquare size={15} /> Support Tickets
          </span>
          {tickets.filter((t) => t.status === "open").length > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
              {tickets.filter((t) => t.status === "open").length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setTab("lookup"); setMobileOpen(false); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-bold transition-all rounded-xl ${
            tab === "lookup" ? "bg-[#19402B] text-white shadow-2xs" : "text-emerald-200/80 hover:bg-[#19402B]/50 hover:text-white"
          }`}
        >
          <Search size={15} /> User Lookup
        </button>

        <button
          onClick={() => { setTab("audit"); setMobileOpen(false); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-bold transition-all rounded-xl ${
            tab === "audit" ? "bg-[#19402B] text-white shadow-2xs" : "text-emerald-200/80 hover:bg-[#19402B]/50 hover:text-white"
          }`}
        >
          <FileText size={15} /> Audit Logs
        </button>
      </nav>

      <div className="p-3 border-t border-emerald-800/40">
        <button
          onClick={() => { useAuthStore.getState().logout(); router.push("/auth/login"); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-bold text-red-300 hover:bg-red-950/40 rounded-xl transition-all"
        >
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
          <p className="text-[9px] font-semibold tracking-widest text-emerald-400 mt-0.5 uppercase">SUPPORT DASHBOARD</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#0D2619] flex-col flex-shrink-0 min-h-screen border-r border-emerald-800/40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
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
      <main className="flex-grow p-4 md:p-8 overflow-auto space-y-6">
        
        {/* ── TICKETS TAB ── */}
        {tab === "tickets" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Support Requests &amp; Queue</h1>
              <p className="text-xs text-[#8C9890] mt-0.5">Manage customer inquiries and ticket communications</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-[#1C2E24] mb-1">Status</label>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-semibold text-[#1C2E24] px-3 py-2 rounded-xl focus:outline-none focus:border-[#0D2619]"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2E24] mb-1">Priority</label>
                <select
                  value={ticketPriorityFilter}
                  onChange={(e) => setTicketPriorityFilter(e.target.value)}
                  className="bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-semibold text-[#1C2E24] px-3 py-2 rounded-xl focus:outline-none focus:border-[#0D2619]"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Tickets Grid / Detail View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tickets List (1 col) */}
              <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Active Queue</h3>
                {isLoadingTickets ? (
                  <div className="py-12 text-center">
                    <Loader2 className="animate-spin text-[#0D2619] mx-auto" size={24} />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8C9890]">No support tickets found</div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                          selectedTicket?.id === t.id
                            ? "bg-[#0D2619] text-white border-[#0D2619]"
                            : "bg-[#FAF8F3] border-[#E5E0D5] hover:border-[#0D2619]"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[11px] font-bold font-mono">#{t.ticket_number}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            t.status === "open" ? "bg-amber-100 text-amber-800" : t.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="font-bold text-xs truncate mb-1">{t.subject}</p>
                        <p className="text-[11px] opacity-80 truncate">{t.customer_name || t.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticket Details & Chat (2 cols) */}
              <div className="lg:col-span-2 bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs min-h-[500px] flex flex-col justify-between">
                {selectedTicket ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F0ECE1] pb-4 gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-[#0D2619]">#{selectedTicket.ticket_number}</span>
                          <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">{selectedTicket.subject}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={ticketStatusUpdate}
                            onChange={(e) => setTicketStatusUpdate(e.target.value)}
                            className="bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-semibold text-[#1C2E24] px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#0D2619]"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                      </div>

                      {/* Messages Flow */}
                      <div className="space-y-3 max-h-[350px] overflow-y-auto p-4 bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl">
                        <div className="bg-white p-4 rounded-xl border border-[#E5E0D5]">
                          <p className="text-xs font-bold text-[#1C2E24] mb-1">{selectedTicket.customer_name || selectedTicket.email}</p>
                          <p className="text-xs text-[#556B5D] leading-relaxed">{selectedTicket.description}</p>
                          <span className="text-[10px] text-[#8C9890] mt-2 block">{formatDateTime(selectedTicket.created_at)}</span>
                        </div>

                        {selectedTicket.messages?.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border ${
                              m.sender_role === "support" || m.sender_role === "admin"
                                ? "bg-[#0D2619] text-white border-[#0D2619] ml-8"
                                : "bg-white text-[#1C2E24] border-[#E5E0D5] mr-8"
                            }`}
                          >
                            <p className="text-xs font-bold mb-1">{m.sender_name || m.sender_role}</p>
                            <p className="text-xs leading-relaxed opacity-90">{m.message}</p>
                            <span className="text-[10px] opacity-70 mt-2 block">{formatDateTime(m.created_at)}</span>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    </div>

                    {/* Agent Reply Box */}
                    <form onSubmit={handleSendTicketReply} className="space-y-3 pt-4 border-t border-[#F0ECE1]">
                      <textarea
                        value={agentReplyMsg}
                        onChange={(e) => setAgentReplyMsg(e.target.value)}
                        placeholder="Type agent response message..."
                        rows={3}
                        className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-3 text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619] resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSendingReply || !agentReplyMsg.trim()}
                          className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                        >
                          {isSendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          <span>Submit Ticket Reply</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="py-24 text-center text-xs text-[#8C9890]">
                    Select a support ticket from the active queue to view details and reply.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── LOOKUP TAB ── */}
        {tab === "lookup" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Customer Lookup &amp; Impersonation</h1>
              <p className="text-xs text-[#8C9890] mt-0.5">Search user profiles and manage support sessions</p>
            </div>

            {/* Search Controls */}
            <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-[#1C2E24] mb-1">Search By</label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className="bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-semibold text-[#1C2E24] px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#0D2619]"
                  >
                    <option value="email">Email Address</option>
                    <option value="account_number">Account Number</option>
                    <option value="name">Customer Name</option>
                  </select>
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-[#1C2E24] mb-1">Search Term</label>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Enter customer email, account number, or name..."
                    className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  <span>Search User</span>
                </button>
              </form>
            </div>

            {/* Results Grid */}
            {results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Results List (1 col) */}
                <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
                  <h3 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Matching Users</h3>
                  <div className="space-y-3">
                    {results.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                          selectedUser?.id === u.id
                            ? "bg-[#0D2619] text-white border-[#0D2619]"
                            : "bg-[#FAF8F3] border-[#E5E0D5] hover:border-[#0D2619]"
                        }`}
                      >
                        <p className="font-bold text-xs">{u.full_name}</p>
                        <p className="text-[11px] opacity-80">{u.email}</p>
                        <span className="text-[10px] uppercase font-bold opacity-60 mt-1 block">Role: {u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Details & Impersonation (2 cols) */}
                <div className="md:col-span-2 bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
                  {selectedUser ? (
                    <div className="space-y-6">
                      <div className="border-b border-[#F0ECE1] pb-4">
                        <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">{selectedUser.full_name}</h2>
                        <p className="text-xs text-[#8C9890]">{selectedUser.email} • ID: #{selectedUser.id}</p>
                      </div>

                      {/* Impersonation Form */}
                      <div className="bg-[#FAF8F3] border border-[#E5E0D5] p-4 rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-[#1C2E24] flex items-center gap-1.5">
                          <UserCheck size={16} className="text-[#0D2619]" /> Support Impersonation Session
                        </h4>
                        <p className="text-xs text-[#556B5D]">
                          Enter an audit reason to initiate a secure read-only support session.
                        </p>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={impersonateReason}
                            onChange={(e) => setImpersonateReason(e.target.value)}
                            placeholder="Reason for impersonation (e.g. Order #123 investigation)..."
                            className="flex-1 bg-white border border-[#E5E0D5] rounded-xl px-4 py-2 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                          />
                          <button
                            type="button"
                            onClick={handleImpersonate}
                            disabled={isImpersonating || !impersonateReason.trim()}
                            className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                          >
                            {isImpersonating ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                            <span>Start Session</span>
                          </button>
                        </div>
                      </div>

                      {/* Customer Orders */}
                      <div className="space-y-3">
                        <h4 className="font-cormorant text-xl font-bold text-[#1C2E24]">Recent Customer Orders</h4>
                        {isLoadingUser ? (
                          <div className="py-8 text-center"><Loader2 className="animate-spin text-[#0D2619] mx-auto" size={20} /></div>
                        ) : userOrders.length === 0 ? (
                          <div className="text-xs text-[#8C9890]">No orders logged for this user</div>
                        ) : (
                          <div className="space-y-2">
                            {userOrders.map((o) => (
                              <div key={o.id} className="p-3 bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-bold text-[#1C2E24]">Order #{o.id}</span>
                                  <span className="text-[#8C9890] block text-[10px]">{formatDate(o.created_at)}</span>
                                </div>
                                <span className="font-bold text-[#2E7D32]">₹{o.total_amount}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center text-xs text-[#8C9890]">
                      Select a user from search results to view profile and initiate support session.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AUDIT LOGS TAB ── */}
        {tab === "audit" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Support Audit Logs</h1>
              <p className="text-xs text-[#8C9890] mt-0.5">Immutable record of all agent support actions and impersonations</p>
            </div>

            <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs">
              {isLoadingAudit ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin text-[#0D2619] mx-auto" size={28} /></div>
              ) : auditLogs.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#8C9890]">No audit logs recorded yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                        <th className="pb-3 px-3">Log ID</th>
                        <th className="pb-3 px-3">Agent</th>
                        <th className="pb-3 px-3">Target User</th>
                        <th className="pb-3 px-3">Action</th>
                        <th className="pb-3 px-3">Reason</th>
                        <th className="pb-3 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F2EA]">
                      {auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-[#8C9890]">#{log.id}</td>
                          <td className="py-3 px-3 font-bold text-[#1C2E24]">Agent #{log.support_user_id || log.user_id}</td>
                          <td className="py-3 px-3 text-[#556B5D]">User #{log.target_user_id}</td>
                          <td className="py-3 px-3">
                            <span className="bg-[#E3F2FD] text-[#1565C0] font-bold text-[10px] px-2 py-0.5 rounded-md">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#556B5D] max-w-xs truncate">{log.reason || "N/A"}</td>
                          <td className="py-3 px-3 text-[#8C9890]">{formatDateTime(log.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
