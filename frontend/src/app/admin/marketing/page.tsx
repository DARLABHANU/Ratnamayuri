"use client";

import { useState } from "react";
import { Megaphone, Send, Mail, MessageSquare, Share2 } from "lucide-react";
import toast from "react-hot-toast";

export default function MarketingToolsPage() {
  const [broadcastSubject, setBroadcastSubject] = useState("Festival Special Offers on Silk Sarees & Jewellery!");
  const [broadcastMessage, setBroadcastMessage] = useState("Explore our newly arrived handcrafted gold plated chains, bangles, and bridal sarees with exclusive discounts.");

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Marketing broadcast email sent to all registered customers!");
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Marketing &amp; Promotional Tools</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Email Broadcast Card (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
            <Mail className="text-[#0D2619]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Customer Email Broadcast</h3>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Email Subject Line</label>
              <input
                type="text"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Broadcast Message Content</label>
              <textarea
                rows={5}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-4 font-garamond text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Send size={14} />
                <span>Send Broadcast</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Quick Campaigns Card (1 col) */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
            <Share2 className="text-[#0D2619]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Social Campaigns</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#0D2619] font-bold">
                <MessageSquare size={16} />
                <span>WhatsApp Promoter Blast</span>
              </div>
              <p className="text-[#556B5D] text-[11px]">Send instant promo codes and product links to top promoter WhatsApp groups.</p>
              <button
                onClick={() => toast.success("Promoter WhatsApp links generated!")}
                className="w-full bg-[#0D2619] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#19402B] transition-colors"
              >
                Generate WhatsApp Blast
              </button>
            </div>

            <div className="p-4 bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#0D2619] font-bold">
                <Megaphone size={16} />
                <span>Banner Campaign</span>
              </div>
              <p className="text-[#556B5D] text-[11px]">Activate top marquee sale banner across customer storefront pages.</p>
              <button
                onClick={() => toast.success("Hero Sale Banner updated across site!")}
                className="w-full border border-[#0D2619] text-[#0D2619] py-2 rounded-xl text-xs font-bold hover:bg-[#0D2619] hover:text-white transition-colors"
              >
                Update Store Banners
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
