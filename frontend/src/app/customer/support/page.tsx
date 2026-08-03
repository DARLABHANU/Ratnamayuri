"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, MessageSquare, AlertCircle, Plus, Send,
  Calendar, ChevronLeft, HelpCircle, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { supportApi, orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, getApiError } from "@/lib/utils";

export default function CustomerSupportPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general_inquiry");
  const [priority, setPriority] = useState("medium");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, ordersRes] = await Promise.all([
        supportApi.getMyTickets(),
        orderApi.list(),
      ]);
      setTickets(ticketsRes.data || []);
      setOrders(ordersRes.data.items || []);
    } catch {
      toast.error("Failed to load support dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and description are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
        order_id: selectedOrderId ? Number(selectedOrderId) : undefined,
      };

      const { data } = await supportApi.createTicket(payload);
      toast.success("Support ticket created successfully!");
      setTickets((prev) => [data, ...prev]);

      setSubject("");
      setCategory("general_inquiry");
      setPriority("medium");
      setSelectedOrderId("");
      setMessage("");
      setShowCreateForm(false);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]";
      case "in_progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "resolved":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const categoryLabels: Record<string, string> = {
    order_help: "Order Help",
    payment: "Payment Issue",
    refund: "Return & Refund",
    general_inquiry: "General Inquiry",
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C2E24] font-garamond">

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden sticky top-0 z-40 bg-[#FAF8F3] border-b border-[#E5E0D5] shadow-xs">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F0ECE5] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} className="text-[#1C2E24]" />
          </button>
          <h1 className="font-cormorant text-[20px] font-bold tracking-wide text-[#1C2E24]">
            Help &amp; Support
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#0D2619] text-white shadow-xs"
            aria-label="New ticket"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* ── Desktop Header ── */}
      <div className="hidden md:block max-w-5xl mx-auto px-6 pt-6 pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#F0ECE1] pb-4 mb-4 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
              HELP &amp; RESOLUTION CENTRE
            </span>
            <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">Customer Support</h1>
            <p className="text-xs text-[#8C9890] mt-0.5">
              Get assistance with your orders, payments, refunds, and collections
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-xs"
          >
            {showCreateForm ? <MessageSquare size={14} /> : <Plus size={14} />}
            <span>{showCreateForm ? "VIEW MY TICKETS" : "NEW SUPPORT REQUEST"}</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#0D2619]" size={32} />
          </div>
        ) : showCreateForm ? (
          /* Create Ticket Form */
          <div className="max-w-2xl mx-auto bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">
                Submit Support Ticket
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-xs font-bold text-[#8C9890] hover:text-[#1C2E24]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C2E24] mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C2E24] mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  >
                    <option value="general_inquiry">General Inquiry</option>
                    <option value="order_help">Order Help</option>
                    <option value="payment">Payment Issue</option>
                    <option value="refund">Return &amp; Refund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2E24] mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2E24] mb-1">
                  Link to Order (Optional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                >
                  <option value="">-- No Linked Order --</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Order #{order.order_number} ({formatDate(order.created_at)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2E24] mb-1">
                  Details / Description *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide all relevant details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-3 text-xs font-garamond text-[#1C2E24] focus:outline-none focus:border-[#0D2619] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>SUBMIT SUPPORT REQUEST</span>
              </button>
            </form>
          </div>
        ) : (
          /* Tickets List */
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white border border-[#E5E0D5] rounded-3xl p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto my-8">
                <div className="w-16 h-16 bg-[#FAF8F3] rounded-full flex items-center justify-center mx-auto text-[#8C9890]">
                  <HelpCircle size={28} />
                </div>
                <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">No Support Requests</h2>
                <p className="text-xs text-[#8C9890]">You do not have any open or previous support tickets.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Plus size={14} />
                  <span>NEW SUPPORT REQUEST</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] mb-2">
                  Active Tickets ({tickets.length})
                </h2>
                {tickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/customer/support/${t.id}`}
                    className="block bg-white border border-[#E5E0D5] hover:border-[#0D2619] rounded-2xl p-4 md:p-5 shadow-xs transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-garamond text-xs font-bold text-[#0D2619]">
                            TICKET #{t.id}
                          </span>
                          <span className="text-[10px] text-[#556B5D] font-bold bg-[#FAF8F3] border border-[#E5E0D5] px-2 py-0.5 rounded-md">
                            {categoryLabels[t.category] || t.category}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded-md ${getStatusBadge(t.status)}`}>
                            {t.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="font-garamond text-sm font-bold text-[#1C2E24]">
                          {t.subject}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[#8C9890]">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar size={12} className="text-[#0D2619]" />
                          {formatDate(t.updated_at)}
                        </span>
                        <ArrowRight size={14} className="text-[#8C9890] group-hover:text-[#0D2619] transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
