"use client";

import { useState } from "react";
import { Save, Lock, Building, DollarSign, Bell } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [platformMargin, setPlatformMargin] = useState("0");
  const [promoterDiscount, setPromoterDiscount] = useState("199");
  const [promoterCommission, setPromoterCommission] = useState("100");
  const [platformProfit, setPlatformProfit] = useState("30");
  const [supportEmail, setSupportEmail] = useState("support@ratnamayuri.live");
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Admin Panel Settings saved successfully!");
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Platform Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Default Pricing & Commission Rules */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
            <DollarSign className="text-[#0D2619]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Commission &amp; Pricing Formula Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Standard Platform Margin (₹)</label>
              <input
                type="number"
                value={platformMargin}
                onChange={(e) => setPlatformMargin(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              />
              <p className="text-[11px] text-[#8C9890] mt-1">Customer Price = Merchant Base Price (Direct Listing)</p>
            </div>

            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Promoter Coupon Discount Value (₹)</label>
              <input
                type="number"
                value={promoterDiscount}
                onChange={(e) => setPromoterDiscount(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              />
              <p className="text-[11px] text-[#8C9890] mt-1">Fixed discount given to customer using promoter coupon</p>
            </div>

            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Promoter Commission Split (₹)</label>
              <input
                type="number"
                value={promoterCommission}
                onChange={(e) => setPromoterCommission(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-bold text-[#2E7D32] focus:outline-none focus:border-[#0D2619]"
              />
              <p className="text-[11px] text-[#8C9890] mt-1">Direct amount transferred to promoter balance upon purchase</p>
            </div>

            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Platform Profit Share on Coupon (₹)</label>
              <input
                type="number"
                value={platformProfit}
                onChange={(e) => setPlatformProfit(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              />
              <p className="text-[11px] text-[#8C9890] mt-1">Platform retained profit share on promoter coupon usage</p>
            </div>
          </div>
        </div>

        {/* Card 2: Contact & Support Settings */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
            <Building className="text-[#0D2619]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Contact &amp; Store Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              />
            </div>

            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Support Phone / WhatsApp</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
}
