"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export default function WithdrawalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [withdrawal, setWithdrawal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Demo fallback matching reference image
  const displayWD = withdrawal || {
    id: 1254,
    withdrawal_id: "#WD1254",
    store_name: "Sowmya Collections",
    status: "Completed",
    request_date: "30 May, 2025 | 11:20 AM",
    amount: "₹15,000",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    bank_details: {
      bank_name: "State bank of india",
      account_number: "**** **** 1234",
      ifsc_code: "SBIN0001234",
      account_holder: "Sowmya Reddy"
    },
    timeline: [
      { step: "Request Submitted", date: "30 May, 11:20 AM" },
      { step: "Under Review", date: "30 May, 11:30 AM" },
      { step: "Approved", date: "30 May, 12:15 PM" },
      { step: "Amount Transferred", date: "30 May, 12:30 PM" },
      { step: "Completed", date: "30 May, 12:45 PM" }
    ]
  };

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, role]);

  const handleDownload = () => {
    toast.success("Downloading withdrawal payout receipt...");
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full border border-[#E5E0D5] bg-white flex items-center justify-center text-[#1C2E24] hover:bg-[#FAF8F3] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Withdrawal Details</h1>
      </div>

      {isLoading ? (
        <div className="h-64 bg-white rounded-3xl border border-[#E5E0D5] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#0D2619]" size={32} />
        </div>
      ) : (
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-8 shadow-xs relative space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#F0ECE1]">
            
            {/* Left Panel: Seller & Bank Details */}
            <div className="space-y-6 pr-0 md:pr-6">
              
              {/* Seller Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayWD.avatar}
                    alt={displayWD.store_name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E0D5]"
                  />
                  <div>
                    <span className="text-[11px] text-[#8C9890] block">Seller Name</span>
                    <span className="font-bold text-sm text-[#1C2E24]">{displayWD.store_name}</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#2E7D32]">
                  {displayWD.status}
                </span>
              </div>

              {/* ID & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-[#8C9890] block mb-1">Withdrawal ID</span>
                  <span className="font-cormorant text-lg font-bold text-[#1C2E24]">{displayWD.withdrawal_id}</span>
                </div>
                <div>
                  <span className="text-xs text-[#8C9890] block mb-1">Request Date</span>
                  <span className="text-xs font-semibold text-[#1C2E24]">{displayWD.request_date}</span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <span className="text-xs text-[#8C9890] block mb-1">Amount</span>
                <span className="font-cormorant text-3xl font-extrabold text-[#1C2E24]">{displayWD.amount}</span>
              </div>

              {/* Bank Details */}
              <div className="pt-4 border-t border-[#F0ECE1] space-y-3">
                <span className="text-xs font-bold text-[#1C2E24] block">Bank Details</span>

                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-[#8C9890] block">Bank Name</span>
                    <span className="font-semibold text-[#1C2E24]">{displayWD.bank_details.bank_name}</span>
                  </div>
                  <div>
                    <span className="text-[#8C9890] block">Account Number</span>
                    <span className="font-semibold text-[#1C2E24]">{displayWD.bank_details.account_number}</span>
                  </div>
                  <div>
                    <span className="text-[#8C9890] block">IFSC Code</span>
                    <span className="font-semibold text-[#1C2E24]">{displayWD.bank_details.ifsc_code}</span>
                  </div>
                  <div>
                    <span className="text-[#8C9890] block">Account Holder Name</span>
                    <span className="font-semibold text-[#1C2E24]">{displayWD.bank_details.account_holder}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Panel: Withdrawal Timeline */}
            <div className="pt-6 md:pt-0 md:pl-8 space-y-6 flex flex-col justify-between">
              
              <div>
                <span className="text-xs font-bold text-[#1C2E24] block mb-6">Withdrawal Timeline</span>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2E7D32]/20">
                  {displayWD.timeline.map((item: any, idx: number) => (
                    <div key={idx} className="relative flex items-center justify-between text-xs">
                      <div className="absolute -left-6 bg-white text-[#2E7D32]">
                        <CheckCircle2 size={18} className="fill-[#2E7D32] text-white" />
                      </div>
                      <span className="font-bold text-[#1C2E24]">{item.step}</span>
                      <span className="text-[#8C9890] font-medium">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Receipt Button Bottom Right */}
              <div className="flex justify-end pt-6">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  <Download size={15} />
                  <span>Download Receipt</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
