"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Send, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { supportApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, formatDateTime, getApiError } from "@/lib/utils";

export default function CustomerTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params.id);
  const { isAuthenticated, user } = useAuthStore();
  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchDetails();
  }, [isAuthenticated, ticketId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const { data } = await supportApi.getTicketDetails(ticketId);
      setTicket(data);
      scrollToBottom();
    } catch (err) {
      toast.error("Failed to load ticket details");
      router.push("/customer/support");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await supportApi.replyToTicket(ticketId, {
        message: replyMessage.trim()
      });
      setTicket(data);
      setReplyMessage("");
      toast.success("Reply sent!");
      scrollToBottom();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabelClass = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800 border-green-200";
      case "in_progress": return "bg-amber-100 text-amber-800 border-amber-200";
      case "resolved": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const categoryLabels: Record<string, string> = {
    order_help: "Order Help",
    payment: "Payment Issue",
    refund: "Return & Refund",
    general_inquiry: "General Inquiry"
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#FAF6EE] min-h-screen">
        <Loader2 className="animate-spin text-[#C9973E]" size={36} />
        <p className="font-cinzel text-xs tracking-widest text-[#7A5C5C]">LOAD TICKET DETAILS...</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="bg-[#FAF6EE] min-h-screen">
      <main className="max-w-4xl w-full mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/customer/support"
          className="inline-flex items-center gap-1.5 text-xs text-[#7A5C5C] hover:text-[#4A0F0F] font-bold tracking-widest mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> BACK TO SUPPORT CENTRE
        </Link>

        {/* Ticket Header Card */}
        <div className="bg-white border border-[#E8D5B0] rounded-sm p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#FAF6EE] pb-4 mb-4">
            <div>
              <span className="font-cinzel text-xs text-[#C9973E] font-bold">
                SUPPORT TICKET #{ticket.id}
              </span>
              <h1 className="font-cormorant text-2xl font-bold text-[#4A0F0F] mt-0.5">
                {ticket.subject}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold tracking-wider uppercase px-3 py-1 border rounded-full ${getStatusLabelClass(ticket.status)}`}>
                {ticket.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[#9A7070] font-medium uppercase text-[10px] tracking-wider">Category</p>
              <p className="text-[#4A0F0F] font-semibold mt-0.5">{categoryLabels[ticket.category] || ticket.category}</p>
            </div>
            <div>
              <p className="text-[#9A7070] font-medium uppercase text-[10px] tracking-wider">Priority</p>
              <p className="text-[#4A0F0F] font-semibold mt-0.5 capitalize">{ticket.priority}</p>
            </div>
            {ticket.order_id && (
              <div>
                <p className="text-[#9A7070] font-medium uppercase text-[10px] tracking-wider">Linked Order</p>
                <Link
                  href={`/customer/orders/${ticket.order_id}`}
                  className="text-[#C9973E] font-semibold hover:underline block mt-0.5"
                >
                  Order #{ticket.order_id}
                </Link>
              </div>
            )}
            <div>
              <p className="text-[#9A7070] font-medium uppercase text-[10px] tracking-wider">Created On</p>
              <p className="text-[#4A0F0F] font-semibold mt-0.5">{formatDate(ticket.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Message Thread (Chat Style) */}
        <div className="bg-white border border-[#E8D5B0] rounded-sm shadow-sm flex flex-col min-h-[400px] max-h-[550px]">
          {/* Thread Header */}
          <div className="bg-[#FAF6EE] px-6 py-4 border-b border-[#E8D5B0]">
            <p className="font-cinzel text-[10px] tracking-widest text-[#7A5C5C] font-bold uppercase">
              Conversation History
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {ticket.replies.map((reply: any, index: number) => {
              const isAgent = ["support", "admin"].includes(reply.sender_role);
              return (
                <div
                  key={reply._id || index}
                  className={`flex flex-col max-w-[85%] ${
                    isAgent ? "mr-auto items-start" : "ml-auto items-end"
                  }`}
                >
                  {/* Sender Name */}
                  <span className="text-[10px] text-[#9A7070] font-bold mb-1 px-1 flex items-center gap-1.5">
                    {isAgent ? (
                      <>
                        <span className="bg-[#4A0F0F] text-[#FAF6EE] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm">
                          {reply.sender_role.toUpperCase()}
                        </span>
                        <span className="text-[#4A0F0F]">{reply.sender_name}</span>
                      </>
                    ) : (
                      <span>You</span>
                    )}
                    <span className="text-[9px] font-normal text-[#B09090]">
                      {formatDateTime(reply.created_at)}
                    </span>
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 rounded-md text-xs font-garamond leading-relaxed whitespace-pre-wrap ${
                      isAgent
                        ? "bg-[#FAF6EE] text-[#4A0F0F] border border-[#E8D5B0]"
                        : "bg-[#4A0F0F] text-[#FAF6EE] border border-[#5A1212]"
                    }`}
                  >
                    {reply.message}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Reply Form */}
          {ticket.status !== "resolved" ? (
            <form onSubmit={handleSendReply} className="border-t border-[#E8D5B0] p-4 bg-[#FAF6EE]">
              <div className="flex gap-2 items-end">
                <textarea
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type a message or response to support agent..."
                  className="flex-1 bg-white border border-[#E8D5B0] text-xs text-[#4A0F0F] p-3 focus:outline-none focus:border-[#C9973E] rounded-sm font-garamond resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting || !replyMessage.trim()}
                  className="bg-[#4A0F0F] text-[#FAF6EE] border border-[#C9973E] p-3 hover:bg-[#6B1A1A] transition-colors rounded-sm shadow-sm flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t border-[#E8D5B0] p-5 text-center bg-gray-50 flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-gray-400" />
              <p className="text-xs text-gray-500 font-medium">
                This ticket has been marked as **Resolved**. If you post a new reply, it will automatically be reopened.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
