"use client";

import { useState } from "react";
import { Globe, Save, Image as ImageIcon, Layout, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function WebsiteSettingsPage() {
  const [siteName, setSiteName] = useState("Ratnamayuri Jewellery & Sarees");
  const [footerText, setFooterText] = useState("© 2026 Ratnamayuri. All Rights Reserved. Crafted with Elegance in Guntur, Andhra Pradesh.");
  const [seoTitle, setSeoTitle] = useState("Ratnamayuri | Handcrafted Jewellery & Silk Sarees");
  const [seoMeta, setSeoMeta] = useState("Shop exquisite handcrafted gold plated chains, kundan bangles, designer sarees, and bridal accessories.");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Website configuration updated successfully!");
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Website Configuration &amp; Branding</h1>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: General Branding */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
            <Globe className="text-[#0D2619]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Brand &amp; General Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Website Brand Title</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-bold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Footer Copyright Notice</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                required
              />
            </div>
          </div>
        </div>

        {/* Card 2: SEO & Meta */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
            <ShieldCheck className="text-[#0D2619]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">SEO &amp; Search Engine Metadata</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Global Meta Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#1C2E24] block mb-1">Global Meta Description</label>
              <textarea
                rows={3}
                value={seoMeta}
                onChange={(e) => setSeoMeta(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-4 font-garamond text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                required
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
            <span>Save Website Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
}
