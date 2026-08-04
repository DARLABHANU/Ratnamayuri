"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Order } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";

function MerchantOrdersContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [shippedCount, setShippedCount] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
      return;
    }
    loadOrders();
  }, [isAuthenticated, role, filter, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await orderApi.merchantOrders({ page, page_size: 20, status: filter || undefined });
      if (data && data.items && data.items.length > 0) {
        setOrders(data.items);
        setTotalOrders(data.total || data.items.length);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const displayList = orders.map((o) => ({
    id: o.id,
    order_number: o.order_number || `BNC${o.id}`,
    customer_name: (o as any).shipping_address?.full_name || (o as any).user?.full_name || "Customer",
    price: o.total_amount,
    status: o.status,
    date: formatDate(o.created_at || new Date().toISOString())
  }));

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-[#E8F5E9] text-[#2E7D32]";
      case "shipped":
        return "bg-[#E3F2FD] text-[#1565C0]";
      case "processing":
        return "bg-[#FFF3E0] text-[#E65100]";
      default:
        return "bg-[#F3E5F5] text-[#7B1FA2]";
    }
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Store Orders</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Orders</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalOrders}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Delivered</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{deliveredCount}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Shipped</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#1565C0]">{shippedCount}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Processing</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#E65100]">{processingCount}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>

          <button
            onClick={() => toast.success("Exporting Store Orders CSV...")}
            className="inline-flex items-center gap-1.5 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0D2619]" size={32} />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#8C9890]">No orders found</td>
                  </tr>
                ) : (
                  displayList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#1C2E24]">{item.order_number}</td>
                      <td className="py-3.5 px-3 font-medium text-[#1C2E24]">{item.customer_name}</td>
                      <td className="py-3.5 px-3 font-extrabold text-[#2E7D32]">{formatPrice(item.price)}</td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[#556B5D] font-medium">{item.date}</td>
                      <td className="py-3.5 px-3 text-right">
                        <Link href={`/merchant/orders/${item.id}`} className="p-1 text-[#6B7A70] hover:text-[#0D2619] transition-colors inline-block">
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-[#F0ECE1]">
          <button onClick={() => setPage(1)} className="w-7 h-7 rounded-lg bg-[#0D2619] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            1
          </button>
          <button onClick={() => setPage(2)} className="w-7 h-7 rounded-lg text-[#556B5D] hover:bg-[#FAF8F3] text-xs font-semibold">
            2
          </button>
          <button onClick={() => setPage(3)} className="w-7 h-7 rounded-lg text-[#556B5D] hover:bg-[#FAF8F3] text-xs font-semibold">
            3
          </button>
        </div>

      </div>

    </div>
  );
}

export default function MerchantOrdersPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <MerchantOrdersContent />
    </Suspense>
  );
}
