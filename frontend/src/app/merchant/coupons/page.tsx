"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Plus, Trash2, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

function MerchantCouponsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const demoCoupons = [
    { id: 1, code: "STORE10", description: "10% off all products", discount: "10% Off", usage: 34, status: "Active" },
    { id: 2, code: "WELCOME50", description: "₹50 off for new buyers", discount: "₹50 Off", usage: 89, status: "Active" },
    { id: 3, code: "FESTIVE15", description: "Festive season 15% discount", discount: "15% Off", usage: 156, status: "Expired" },
  ];

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") router.push("/auth/login");
  }, [isAuthenticated, role]);

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Store Coupons</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Coupons</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">3</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Active Coupons</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">2</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Redemptions</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">279</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input type="text" placeholder="Search coupons..."
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]" />
          </div>
          <button onClick={() => toast.success("Create coupon feature coming soon!")}
            className="inline-flex items-center gap-1.5 bg-[#0D2619] hover:bg-[#19402B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs">
            <Plus size={15} />
            <span>Create Coupon</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 px-3">Code</th>
                <th className="pb-3 px-3">Description</th>
                <th className="pb-3 px-3">Discount</th>
                <th className="pb-3 px-3">Times Used</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EA]">
              {demoCoupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="bg-red-50 text-red-700 font-extrabold px-2.5 py-1 rounded-md text-xs border border-red-200">{c.code}</span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-[#1C2E24]">{c.description}</td>
                  <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{c.discount}</td>
                  <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{c.usage}</td>
                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${c.status === "Active" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-red-50 text-red-700"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button onClick={() => toast.success(`Coupon ${c.code} deleted`)} className="p-1 text-[#6B7A70] hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MerchantCouponsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <MerchantCouponsContent />
    </Suspense>
  );
}
