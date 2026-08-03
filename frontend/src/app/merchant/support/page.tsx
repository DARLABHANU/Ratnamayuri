"use client";

import { useState } from "react";
import { Send, MessageSquare, HelpCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function MerchantSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How do I add a new product?", a: "Navigate to the Products page and click 'Add Product'. Fill in the product details including title, description, price, and images. Your product will be listed after admin approval." },
    { q: "When do I receive my payouts?", a: "Payouts are processed within 3-5 business days after an order is delivered and the return window has closed. You can request a withdrawal from your Wallet page." },
    { q: "How is my commission calculated?", a: "The platform commission rate is set by the admin (typically 5-15%). This percentage is deducted from each sale amount, and the remaining balance is credited to your wallet." },
    { q: "What happens if a customer requests a return?", a: "You will be notified of return requests. The admin will mediate the return process. Refunds are deducted from your wallet balance once the return is approved." },
    { q: "How do I update my bank details?", a: "Go to Store Profile and update the Bank Account Number and IFSC Code fields. Changes take effect on the next payout cycle." },
  ];

  const handleSubmit = async () => {
    if (!subject || !message) { toast.error("Please fill in both subject and message"); return; }
    setIsSending(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success("Support ticket submitted! We'll get back to you within 24 hours.");
    setSubject(""); setMessage("");
    setIsSending(false);
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Help & Support</h1>

      {/* FAQ Section */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[#F0ECE1] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center">
            <HelpCircle size={18} className="text-[#0D2619]" />
          </div>
          <div>
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Frequently Asked Questions</h3>
            <p className="text-[11px] text-[#8C9890]">Quick answers to common seller questions</p>
          </div>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-[#E5E0D5] rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#FAF8F3] transition-colors"
              >
                <span className="font-bold text-xs text-[#1C2E24]">{faq.q}</span>
                {expandedFaq === idx ? <ChevronUp size={14} className="text-[#8C9890]" /> : <ChevronDown size={14} className="text-[#8C9890]" />}
              </button>
              {expandedFaq === idx && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-[#556B5D] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[#F0ECE1] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center">
            <MessageSquare size={18} className="text-[#0D2619]" />
          </div>
          <div>
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Contact Support</h3>
            <p className="text-[11px] text-[#8C9890]">Submit a ticket and we&apos;ll respond within 24 hours</p>
          </div>
        </div>

        <div className="space-y-4 text-xs max-w-lg">
          <div>
            <label className="font-bold text-[#1C2E24] block mb-1">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              placeholder="e.g. Payout delay, Product listing issue" />
          </div>
          <div>
            <label className="font-bold text-[#1C2E24] block mb-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-4 font-garamond text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619] resize-none"
              placeholder="Describe your issue in detail..." />
          </div>
          <button onClick={handleSubmit} disabled={isSending}
            className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">
            {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Submit Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
}
