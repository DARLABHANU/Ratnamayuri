"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, MessageSquare, AlertCircle, Plus, Send, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { supportApi, orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, getApiError } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
        orderApi.list()
      ]);
      setTickets(ticketsRes.data);
      setOrders(ordersRes.data.items || []);
    } catch (err) {
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
        order_id: selectedOrderId ? Number(selectedOrderId) : undefined
      };

      const { data } = await supportApi.createTicket(payload);
      toast.success("Support ticket created successfully!");
      setTickets(prev => [data, ...prev]);
      
      // Reset form
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800 border-green-200";
      case "in_progress": return "bg-amber-100 text-amber-800 border-amber-200";
      case "resolved": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-amber-600 bg-amber-50";
      case "low": return "text-gray-500 bg-gray-50";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  const categoryLabels: Record<string, string> = {
    order_help: "Order Help",
    payment: "Payment Issue",
    refund: "Return & Refund",
    general_inquiry: "General Inquiry"
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EE]">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E8D5B0] pb-6 mb-8 gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9973E]">Help &amp; Resolution Centre</span>
            <h1 className="font-cormorant text-3xl md:text-4xl text-[#4A0F0F] font-bold mt-1">Customer Support</h1>
            <p className="text-xs text-[#7A5C5C] mt-1 font-garamond">
              Get assistance with your orders, payments, refunds, and collections.
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 bg-[#4A0F0F] text-[#FAF6EE] border border-[#C9973E] text-xs font-bold tracking-widest py-3 px-5 hover:bg-[#6B1A1A] transition-colors rounded-sm shadow-sm"
          >
            {showCreateForm ? <MessageSquare size={14} /> : <Plus size={14} />}
            {showCreateForm ? "VIEW MY TICKETS" : "NEW SUPPORT REQUEST"}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#C9973E]" size={36} />
            <p className="font-cinzel text-xs tracking-widest text-[#7A5C5C]">LOAD HELP CENTRE...</p>
          </div>
        ) : showCreateForm ? (
          /* Create Form */
          <div className="max-w-2xl mx-auto bg-white border border-[#E8D5B0] rounded-sm p-6 shadow-sm">
            <h2 className="font-cinzel text-sm tracking-widest text-[#4A0F0F] border-b border-[#FAF6EE] pb-3 mb-5 uppercase">
              Submit Support Ticket
            </h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#7A5C5C] tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summarise your issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#7A5C5C] tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond"
                  >
                    <option value="general_inquiry">General Inquiry</option>
                    <option value="order_help">Order Help</option>
                    <option value="payment">Payment Issue</option>
                    <option value="refund">Return &amp; Refund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#7A5C5C] tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#7A5C5C] tracking-wider mb-1.5">
                  Link to Order (Optional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond"
                >
                  <option value="">-- No Linked Order --</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Order #{order.order_number} ({formatDate(order.created_at)}) - ₹{order.total_amount.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#7A5C5C] tracking-wider mb-1.5">
                  Details / Description *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Provide all relevant details to help us assist you faster..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#4A0F0F] text-[#FAF6EE] border border-[#C9973E] text-xs font-bold tracking-widest py-3 hover:bg-[#6B1A1A] transition-colors rounded-sm shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                SUBMIT SUPPORT REQUEST
              </button>
            </form>
          </div>
        ) : (
          /* Tickets List */
          <div>
            {tickets.length === 0 ? (
              <div className="bg-white border border-[#E8D5B0] rounded-sm p-12 text-center max-w-md mx-auto shadow-sm">
                <AlertCircle className="w-12 h-12 text-[#C9973E] mx-auto mb-4" />
                <h3 className="font-cinzel text-sm tracking-widest text-[#4A0F0F] font-bold uppercase mb-2">
                  No Support Requests
                </h3>
                <p className="text-xs text-[#7A5C5C] font-garamond mb-6">
                  You do not have any open or previous support tickets with us.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-[#4A0F0F] text-[#FAF6EE] border border-[#C9973E] text-[10px] font-bold tracking-widest py-2.5 px-6 hover:bg-[#6B1A1A] transition-colors rounded-sm"
                >
                  NEW SUPPORT REQUEST
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="font-cinzel text-xs tracking-widest text-[#7A5C5C] font-bold uppercase mb-2">
                  Active Tickets &amp; Requests ({tickets.length})
                </h2>
                <div className="grid gap-3">
                  {tickets.map((t) => (
                    <Link
                      key={t.id}
                      href={`/customer/support/${t.id}`}
                      className="block bg-white border border-[#E8D5B0] hover:border-[#C9973E] hover:shadow-md transition-all duration-200 p-5 rounded-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-cinzel text-xs text-[#C9973E] font-bold">
                              TICKET #{t.id}
                            </span>
                            <span className="text-xs text-[#7A5C5C] font-semibold bg-[#FAF6EE] border border-[#E8D5B0] px-2 py-0.5 rounded-sm">
                              {categoryLabels[t.category] || t.category}
                            </span>
                            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 border rounded-full ${getStatusClass(t.status)}`}>
                              {t.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="font-garamond text-sm text-[#4A0F0F] font-bold">
                            {t.subject}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-left sm:text-right flex-shrink-0 text-xs text-[#7A5C5C]">
                          <div>
                            <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getPriorityClass(t.priority)}`}>
                              {t.priority} priority
                            </span>
                            <p className="flex items-center gap-1 mt-1 text-[11px] font-medium">
                              <Calendar size={12} className="text-[#C9973E]" />
                              Updated: {formatDate(t.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
