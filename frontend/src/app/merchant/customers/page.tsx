"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Users, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

function MerchantCustomersContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const demoCustomers = [
    { id: 1, name: "Priya Sharma", email: "priya@gmail.com", orders: 12, total_spent: "₹14,580", last_order: "30 May, 2025" },
    { id: 2, name: "Sneha Reddy", email: "sneha.r@gmail.com", orders: 8, total_spent: "₹9,420", last_order: "28 May, 2025" },
    { id: 3, name: "Karthik Rao", email: "karthik@gmail.com", orders: 5, total_spent: "₹6,250", last_order: "25 May, 2025" },
    { id: 4, name: "Anjali Patil", email: "anjali.p@gmail.com", orders: 3, total_spent: "₹3,890", last_order: "20 May, 2025" },
    { id: 5, name: "Ravi Kumar", email: "ravi.k@gmail.com", orders: 2, total_spent: "₹1,798", last_order: "18 May, 2025" },
  ];

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") router.push("/auth/login");
  }, [isAuthenticated, role]);

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Store Customers</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Customers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">142</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Repeat Buyers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">58</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">New This Month</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">24</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
          <input type="text" placeholder="Search customers..."
            className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 px-3">Customer</th>
                <th className="pb-3 px-3">Orders</th>
                <th className="pb-3 px-3">Total Spent</th>
                <th className="pb-3 px-3">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EA]">
              {demoCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-[#1C2E24]">{c.name}</p>
                    <p className="text-[11px] text-[#8C9890]">{c.email}</p>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{c.orders}</td>
                  <td className="py-3.5 px-3 font-extrabold text-[#2E7D32]">{c.total_spent}</td>
                  <td className="py-3.5 px-3 text-[#556B5D] font-medium">{c.last_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MerchantCustomersPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <MerchantCustomersContent />
    </Suspense>
  );
}
