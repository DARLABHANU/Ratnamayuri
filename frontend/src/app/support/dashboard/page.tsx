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
      const { data } = await supportApi.impersonate({
        target_user_id: selectedUser.id,
        reason: impersonateReason,
      });

      // Save support agent's original token & role to restore later
      const originalToken = Cookies.get("access_token");
      const originalRole = Cookies.get("user_role");
      if (originalToken) {
        Cookies.set("impersonator_original_token", originalToken, { expires: 1, sameSite: "Lax" });
        if (originalRole) {
          Cookies.set("impersonator_original_role", originalRole, { expires: 1, sameSite: "Lax" });
        }
      }
      Cookies.set("impersonator_audit_log_id", String(data.audit_log_id), { expires: 1, sameSite: "Lax" });

      // Apply impersonated user credentials
      Cookies.set("access_token", data.impersonation_token, { expires: 1, sameSite: "Lax" });
      Cookies.set("user_role", selectedUser.role, { expires: 1, sameSite: "Lax" });

      // Update auth store user
      useAuthStore.getState().setUser(selectedUser);

      toast.success(`Impersonation session started for ${selectedUser.full_name}`);
      setImpersonateReason("");
      
      // Redirect to home page where they can act as the customer
      window.location.href = "/";
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

  // Support tickets API loads
  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const params: Record<string, string> = {};
      if (ticketStatusFilter) params.status = ticketStatusFilter;
      if (ticketPriorityFilter) params.priority = ticketPriorityFilter;
      
      const { data } = await supportApi.getAllTickets(params);
      setTickets(data.items || []);
    } catch (err) {
      toast.error("Failed to load tickets");
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketStatusUpdate(ticket.status);
    setAgentReplyMsg("");
    
    // Fetch associated customer details and order list for support context
    try {
      const { data } = await supportApi.userOrders(ticket.user_id);
      setTicketOrders(data.items || []);
    } catch {
      setTicketOrders([]);
    }
    
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleAgentReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !agentReplyMsg.trim()) return;

    setIsSendingReply(true);
    try {
      const { data } = await supportApi.agentReplyToTicket(selectedTicket.id, {
        message: agentReplyMsg.trim(),
        status: ticketStatusUpdate
      });
      setSelectedTicket(data);
      setAgentReplyMsg("");
      toast.success("Reply sent successfully!");
      
      // Refresh ticket list in queue
      loadTickets();
      
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateTicketStatusOnly = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      const { data } = await supportApi.updateTicketStatus(selectedTicket.id, {
        status: newStatus
      });
      setSelectedTicket(data);
      setTicketStatusUpdate(newStatus);
      toast.success(`Ticket status marked as ${newStatus}`);
      loadTickets();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  useEffect(() => {
    if (tab === "audit") loadAuditLogs();
    if (tab === "tickets") loadTickets();
  }, [tab, ticketStatusFilter, ticketPriorityFilter]);

  const categoryLabels: Record<string, string> = {
    order_help: "Order Help",
    payment: "Payment Issue",
    refund: "Return & Refund",
    general_inquiry: "General Inquiry"
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return "bg-green-50 text-green-700 border-green-200";
      case "in_progress": return "bg-amber-50 text-amber-700 border-amber-200";
      case "resolved": return "bg-gray-50 text-gray-600 border-gray-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-50 text-red-700 border-red-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "low": return "bg-gray-50 text-gray-600 border-gray-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#4A0F0F] text-[#E8D5B0] border-r border-[#C9973E]/20">
      <div className="p-5 border-b border-[#FAF6EE]/10 flex flex-col gap-1">
        <p className="font-cinzel text-sm tracking-[0.25em] text-[#C9973E] font-bold">RATNAMAYURI</p>
        <p className="font-garamond text-[9px] tracking-widest text-[#FAF6EE]/60 uppercase">SUPPORT DASHBOARD</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <button onClick={() => { setTab("tickets"); setMobileOpen(false); }}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-left font-cinzel text-xs tracking-wider transition-colors
            ${tab === "tickets" ? "bg-[#FAF6EE] text-[#4A0F0F] font-bold" : "hover:bg-[#5A1212]"}`}>
          <MessageSquare size={14} className={tab === "tickets" ? "text-[#4A0F0F]" : "text-[#C9973E]"} /> SUPPORT TICKETS
        </button>
        <button onClick={() => { setTab("lookup"); setMobileOpen(false); }}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-left font-cinzel text-xs tracking-wider transition-colors
            ${tab === "lookup" ? "bg-[#FAF6EE] text-[#4A0F0F] font-bold" : "hover:bg-[#5A1212]"}`}>
          <Search size={14} className={tab === "lookup" ? "text-[#4A0F0F]" : "text-[#C9973E]"} /> USER LOOKUP
        </button>
        <button onClick={() => { setTab("audit"); setMobileOpen(false); }}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-left font-cinzel text-xs tracking-wider transition-colors
            ${tab === "audit" ? "bg-[#FAF6EE] text-[#4A0F0F] font-bold" : "hover:bg-[#5A1212]"}`}>
          <FileText size={14} className={tab === "audit" ? "text-[#4A0F0F]" : "text-[#C9973E]"} /> AUDIT LOGS
        </button>
      </nav>
      <div className="p-3 border-t border-[#FAF6EE]/10">
        <button onClick={() => { useAuthStore.getState().logout(); router.push("/auth/login"); }}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-left font-cinzel text-xs tracking-wider text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors">
          <LogOut size={14} /> SIGN OUT
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF6EE]">
      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-[#4A0F0F] text-[#E8D5B0] border-b border-[#C9973E]/20">
        <div className="flex flex-col">
          <p className="font-cinzel text-xs tracking-[0.2em] text-[#C9973E]">RATNAMAYURI</p>
          <p className="font-garamond text-[9px] tracking-widest text-[#FAF6EE]/60 uppercase">SUPPORT DASHBOARD</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#C9973E] hover:text-[#FAF6EE] p-1">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col flex-shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 max-w-xs h-full z-10 animate-slide-in">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="text-[#C9973E] hover:text-[#FAF6EE] p-1">
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow p-5 sm:p-8 overflow-auto">
        
        {/* ── TICKETS TAB ── */}
        {tab === "tickets" && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-widest text-[#C9973E] uppercase">Tickets Queue</span>
              <h1 className="font-cormorant text-2xl sm:text-3xl text-[#4A0F0F] font-bold mt-0.5">Support Requests</h1>
            </div>

            {/* Filter bar */}
            <div className="bg-white border border-[#E8D5B0] rounded-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-[9px] font-bold text-[#9A7070] uppercase mb-1 tracking-wider">Status</label>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] px-3 py-1.5 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#9A7070] uppercase mb-1 tracking-wider">Priority</label>
                <select
                  value={ticketPriorityFilter}
                  onChange={(e) => setTicketPriorityFilter(e.target.value)}
                  className="bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] px-3 py-1.5 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <button
                onClick={() => { setTicketStatusFilter(""); setTicketPriorityFilter(""); }}
                className="bg-[#FAF6EE] hover:bg-white text-xs border border-[#E8D5B0] text-[#7A5C5C] px-4 py-1.5 rounded-sm font-bold tracking-widest mt-4"
              >
                RESET
              </button>
            </div>

            {isLoadingTickets ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-[#C9973E]" size={28} />
                <p className="font-cinzel text-[10px] tracking-widest text-[#7A5C5C]">LOAD TICKETS QUEUE...</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 items-start">
                
                {/* Tickets list */}
                <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {tickets.length === 0 ? (
                    <div className="bg-white border border-[#E8D5B0] p-6 text-center rounded-sm">
                      <AlertCircle className="w-8 h-8 text-[#C9973E] mx-auto mb-2" />
                      <p className="text-xs text-[#7A5C5C] font-semibold font-garamond">No support tickets found</p>
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className={`w-full text-left bg-white border hover:border-[#C9973E] hover:shadow-sm transition-all duration-200 p-4 rounded-sm block
                          ${selectedTicket?.id === t.id ? "border-[#C9973E] bg-[#FAF0E4]" : "border-[#E8D5B0]"}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-cinzel text-[10px] text-[#C9973E] font-bold">TICKET #{t.id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${getStatusBadge(t.status)}`}>
                            {t.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="font-garamond text-xs font-bold text-[#4A0F0F] line-clamp-1">{t.subject}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#9A7070] mt-2 border-t border-[#FAF6EE] pt-2">
                          <span className="capitalize">{t.priority} Priority</span>
                          <span>{formatDate(t.updated_at)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Selected Ticket details panel */}
                <div className="lg:col-span-2">
                  {selectedTicket ? (
                    <div className="grid md:grid-cols-3 gap-6 items-start">
                      
                      {/* Conversations & Actions */}
                      <div className="md:col-span-2 bg-white border border-[#E8D5B0] rounded-sm shadow-sm flex flex-col h-[600px]">
                        {/* Conversation header */}
                        <div className="bg-[#FAF6EE] border-b border-[#E8D5B0] px-5 py-4 flex items-center justify-between">
                          <div>
                            <span className="font-cinzel text-[10px] text-[#C9973E] font-bold">SUBJECT</span>
                            <p className="text-xs font-bold text-[#4A0F0F]">{selectedTicket.subject}</p>
                          </div>
                          <div>
                            <select
                              value={ticketStatusUpdate}
                              onChange={(e) => handleUpdateTicketStatusOnly(e.target.value)}
                              className="bg-white border border-[#E8D5B0] text-[10px] font-bold text-[#4A0F0F] px-2 py-1 rounded-sm font-garamond"
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        </div>

                        {/* Thread */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                          {selectedTicket.replies.map((reply: any, index: number) => {
                            const isAgent = ["support", "admin"].includes(reply.sender_role);
                            return (
                              <div
                                key={reply._id || index}
                                className={`flex flex-col max-w-[90%] ${
                                  isAgent ? "ml-auto items-end" : "mr-auto items-start"
                                }`}
                              >
                                <span className="text-[9px] text-[#9A7070] font-bold mb-0.5 px-1 flex items-center gap-1">
                                  {isAgent ? (
                                    <>
                                      <span>You ({reply.sender_name})</span>
                                      <span className="bg-[#4A0F0F] text-[#FAF6EE] text-[8px] font-black px-1 rounded-sm uppercase">Agent</span>
                                    </>
                                  ) : (
                                    <span>{reply.sender_name} ({reply.sender_role})</span>
                                  )}
                                  <span className="font-normal text-[#B09090] text-[8px]">
                                    {formatDateTime(reply.created_at)}
                                  </span>
                                </span>

                                <div
                                  className={`p-3 rounded-md text-xs font-garamond leading-relaxed whitespace-pre-wrap ${
                                    isAgent
                                      ? "bg-[#4A0F0F] text-[#FAF6EE] border border-[#5A1212]"
                                      : "bg-[#FAF6EE] text-[#4A0F0F] border border-[#E8D5B0]"
                                  }`}
                                >
                                  {reply.message}
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Reply box */}
                        <form onSubmit={handleAgentReply} className="border-t border-[#E8D5B0] p-4 bg-[#FAF6EE] flex gap-2 items-end">
                          <textarea
                            rows={2}
                            value={agentReplyMsg}
                            onChange={(e) => setAgentReplyMsg(e.target.value)}
                            placeholder="Type a support response message to customer..."
                            className="flex-1 bg-white border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond resize-none font-medium"
                          />
                          <button
                            type="submit"
                            disabled={isSendingReply || !agentReplyMsg.trim()}
                            className="bg-[#4A0F0F] text-[#FAF6EE] border border-[#C9973E] p-3 hover:bg-[#6B1A1A] transition-colors rounded-sm shadow-sm flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                          >
                            {isSendingReply ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Right contextual info panels */}
                      <div className="space-y-4">
                        {/* Ticket metadata */}
                        <div className="bg-white border border-[#E8D5B0] rounded-sm p-4 shadow-sm text-xs">
                          <h3 className="font-cinzel text-[10px] tracking-widest text-[#9A7070] font-bold uppercase mb-2">Ticket Info</h3>
                          <div className="space-y-1 bg-[#FAF6EE] p-2.5 rounded-sm">
                            <p className="text-[10px] font-bold text-[#7A5C5C] uppercase">Category</p>
                            <p className="text-xs font-semibold text-[#4A0F0F]">{categoryLabels[selectedTicket.category] || selectedTicket.category}</p>
                            <p className="text-[10px] font-bold text-[#7A5C5C] uppercase mt-2">Priority</p>
                            <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold mt-0.5 ${getPriorityBadge(selectedTicket.priority)}`}>
                              {selectedTicket.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Customer contextual orders */}
                        <div className="bg-white border border-[#E8D5B0] rounded-sm p-4 shadow-sm text-xs">
                          <h3 className="font-cinzel text-[10px] tracking-widest text-[#9A7070] font-bold uppercase mb-2">Customer Orders</h3>
                          {ticketOrders.length === 0 ? (
                            <p className="text-xs text-[#7A5C5C] font-semibold italic">No order history found</p>
                          ) : (
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                              {ticketOrders.map((ord) => (
                                <div key={ord.id} className="border-b border-[#FAF6EE] pb-2 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-center font-semibold text-[#4A0F0F]">
                                    <span>#{ord.order_number}</span>
                                    <span>₹{ord.total_amount.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-[#9A7070] mt-0.5">
                                    <span>{formatDate(ord.created_at)}</span>
                                    <span className="capitalize text-amber-700">{ord.status.replace(/_/g, " ")}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white border border-[#E8D5B0] p-12 text-center rounded-sm max-w-sm mx-auto shadow-sm">
                      <MessageSquare className="w-10 h-10 text-[#C9973E] mx-auto mb-3" />
                      <h3 className="font-cinzel text-xs tracking-widest text-[#4A0F0F] font-bold uppercase mb-1">
                        Select a Ticket
                      </h3>
                      <p className="text-xs text-[#7A5C5C] font-garamond">
                        Click on a customer ticket card from the queue list to start responding and resolving their issues.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ── Lookup Tab ── */}
        {tab === "lookup" && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-widest text-[#C9973E] uppercase">SUPPORT TOOLS</span>
              <h1 className="font-cormorant text-2xl sm:text-3xl text-[#4A0F0F] font-bold mt-0.5">User Lookup</h1>
            </div>

            {/* Search form */}
            <div className="bg-white border border-[#E8D5B0] rounded-sm p-6 mb-6 shadow-sm">
              <h2 className="font-cinzel text-xs tracking-widest text-[#9A7070] mb-4">FIND A USER</h2>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "account_number", label: "Account #", icon: Hash },
                    { value: "email",           label: "Email",      icon: Mail },
                    { value: "name",            label: "Name",       icon: UserCheck },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button"
                      onClick={() => setSearchType(value)}
                      className={`flex items-center gap-2 font-cinzel text-xs tracking-wide px-4 py-2 transition-all rounded-sm
                        ${searchType === value ? "bg-[#4A0F0F] text-[#E8D5B0] font-bold" : "border border-[#E8D5B0] text-[#7A5C5C] hover:border-[#C9973E]"}`}>
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
                    className="w-full bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond flex-1"
                  />
                  <button type="submit" disabled={isSearching || !searchValue.trim()}
                    className="bg-[#4A0F0F] text-[#FAF6EE] border border-[#C9973E] text-xs font-bold tracking-widest py-3 px-6 hover:bg-[#6B1A1A] transition-colors rounded-sm flex items-center gap-2">
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
                  <h2 className="font-cinzel text-xs tracking-widest text-[#7A5C5C] font-bold uppercase mb-3">
                    RESULTS ({results.length})
                  </h2>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {results.map((user) => (
                      <button key={user.id} onClick={() => handleSelectUser(user)}
                        className={`w-full text-left bg-white border hover:border-[#C9973E] hover:shadow-sm p-4 transition-all rounded-sm block
                          ${selectedUser?.id === user.id ? "border-[#C9973E] bg-[#FAF0E4]" : "border-[#E8D5B0]"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-garamond text-xs font-bold text-[#4A0F0F]">{user.full_name}</p>
                            <p className="font-garamond text-xs text-[#9A7070] mt-0.5">{user.email}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="font-cinzel text-[10px] text-[#C9973E] font-bold">{user.account_number}</span>
                              <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 border rounded-full capitalize
                                ${user.role === "customer" ? "bg-gray-100 text-gray-700" : "bg-purple-100 text-purple-700"}`}>
                                {user.role}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 text-xs">
                            <span className={`font-cinzel text-[10px] font-bold uppercase ${user.is_active ? "text-green-600" : "text-red-500"}`}>
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                            <p className="font-garamond text-[10px] text-[#9A7070] mt-1">{formatDate(user.created_at)}</p>
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
                  <h2 className="font-cinzel text-xs tracking-widest text-[#7A5C5C] font-bold uppercase mb-3">USER DETAILS</h2>
                  <div className="bg-white border border-[#E8D5B0] rounded-sm p-5 mb-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-[#FAF6EE] pb-3 gap-3">
                      <div>
                        <p className="font-cormorant text-xl font-bold text-[#4A0F0F]">{selectedUser.full_name}</p>
                        <p className="font-garamond text-xs text-[#9A7070] mt-0.5">{selectedUser.email}</p>
                      </div>
                      <div className="w-10 h-10 border border-[#C9973E] rounded-full bg-[#FAF6EE] flex items-center justify-center font-cinzel text-[#4A0F0F] text-sm flex-shrink-0">
                        {selectedUser.full_name[0]}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                      {[
                        { label: "Account #", value: selectedUser.account_number },
                        { label: "Role",      value: selectedUser.role },
                        { label: "Status",    value: selectedUser.is_active ? "Active" : "Inactive" },
                        { label: "Verified",  value: selectedUser.is_verified ? "Yes" : "No" },
                        { label: "Phone",     value: selectedUser.phone || "—" },
                        { label: "Joined",    value: formatDate(selectedUser.created_at) },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-[#FAF6EE] p-2.5 rounded-sm">
                          <p className="text-[9px] font-bold text-[#9A7070] uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="font-garamond text-xs font-semibold text-[#4A0F0F] capitalize">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3 border-t border-[#FAF6EE] pt-4">
                      <button onClick={handleResetPassword}
                        className="w-full bg-[#FAF6EE] hover:bg-white text-xs border border-[#E8D5B0] text-[#7A5C5C] font-bold py-2 rounded-sm shadow-sm transition-colors uppercase">
                        🔑 RESET PASSWORD
                      </button>

                      {!activeSession && (
                        <div className="space-y-2">
                          <input
                            value={impersonateReason}
                            onChange={(e) => setImpersonateReason(e.target.value)}
                            placeholder="Reason for impersonation (required)"
                            className="w-full bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond"
                          />
                          <button onClick={handleImpersonate}
                            disabled={isImpersonating || !impersonateReason.trim()}
                            className="w-full bg-[#4A0F0F] text-[#FAF6EE] border border-[#C9973E] text-xs font-bold tracking-widest py-3.5 hover:bg-[#6B1A1A] transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-50">
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
                  <h3 className="font-cinzel text-xs tracking-widest text-[#7A5C5C] font-bold uppercase mb-2">ORDER HISTORY</h3>
                  {isLoadingUser ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="animate-spin text-[#C9973E]" size={20} />
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="bg-white border border-[#E8D5B0] p-6 text-center rounded-sm">
                      <p className="font-garamond text-xs text-[#9A7070] italic">No orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {userOrders.map((order) => (
                        <div key={order.id} className="bg-white border border-[#E8D5B0] p-3.5 rounded-sm flex items-center justify-between gap-4">
                          <div>
                            <p className="font-cinzel text-xs text-[#4A0F0F] font-bold">#{order.order_number}</p>
                            <p className="font-garamond text-[10px] text-[#9A7070] mt-0.5">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right text-xs">
                            <p className="font-cinzel text-xs text-[#4A0F0F] font-bold">₹{order.total_amount.toLocaleString("en-IN")}</p>
                            <p className={`font-cinzel text-[9px] font-bold uppercase mt-0.5
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

        {/* ── AUDIT LOGS TAB ── */}
        {tab === "audit" && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-widest text-[#C9973E] uppercase">SECURITY</span>
              <h1 className="font-cormorant text-2xl sm:text-3xl text-[#4A0F0F] font-bold mt-0.5">Audit Logs</h1>
            </div>

            {isLoadingAudit ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="animate-spin text-[#C9973E]" size={28} />
              </div>
            ) : (
              <div className="bg-white border border-[#E8D5B0] rounded-sm overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#FAF6EE] text-[9px] font-bold uppercase tracking-wider text-[#9A7070] border-b border-[#E8D5B0] text-left">
                      <tr>
                        <th className="p-4 border-r border-[#FAF6EE]">Action</th>
                        <th className="p-4 border-r border-[#FAF6EE]">Performed By</th>
                        <th className="p-4 border-r border-[#FAF6EE]">Target User</th>
                        <th className="p-4 border-r border-[#FAF6EE]">Description</th>
                        <th className="p-4 border-r border-[#FAF6EE]">IP Address</th>
                        <th className="p-4">Date &amp; Time</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-[#4A0F0F] font-medium font-garamond divide-y divide-[#FAF6EE]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#FAF6EE]/30 transition-colors">
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase
                              ${log.action.includes("impersonation") ? "bg-orange-50 text-orange-700 border-orange-200" :
                                log.action.includes("reset") ? "bg-red-50 text-red-700 border-red-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"}`}>
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-4 text-[#7A5C5C]">User #{log.performed_by}</td>
                          <td className="p-4 text-[#7A5C5C]">
                            {log.target_user_id ? `User #${log.target_user_id}` : "—"}
                          </td>
                          <td className="p-4 text-[#7A5C5C] max-w-xs truncate">
                            {log.description || "—"}
                          </td>
                          <td className="p-4 text-[#7A5C5C]">{log.ip_address || "—"}</td>
                          <td className="p-4 text-[#9A7070]">{formatDateTime(log.created_at)}</td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#9A7070] italic">
                            No audit logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
