"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, Download, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Order, OrderStatus } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, getApiError } from "@/lib/utils";

const ALL_STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function AdminOrdersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, role } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [shippedCount, setShippedCount] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(params.get("status") || "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadOrders();
  }, [isAuthenticated, role, filter, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.orders({ page, page_size: 20, status: filter || undefined });
      if (data && data.items) {
        setOrders(data.items);
        setTotalOrders(data.total);
        setTotalPages(data.pages || 1);
        
        let delivered = 0;
        let shipped = 0;
        let processing = 0;
        data.items.forEach((o: any) => {
          if (o.status === "delivered") delivered++;
          else if (o.status === "shipped") shipped++;
          else if (o.status === "processing") processing++;
        });
        setDeliveredCount(delivered);
        setShippedCount(shipped);
        setProcessingCount(processing);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await orderApi.updateStatus(orderId, { status });
      toast.success("Order status updated successfully");
      loadOrders();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(`Are you sure you want to delete order #${orderId}?`)) return;
    setUpdatingId(orderId);
    try {
      await adminApi.deleteOrder(orderId);
      toast.success("Order deleted successfully");
      loadOrders();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const displayList = orders
    .filter(o => 
      (o.order_number || "").toLowerCase().includes(search.toLowerCase()) || 
      ((o as any).user?.full_name || "").toLowerCase().includes(search.toLowerCase())
    )
    .map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: (o as any).user?.full_name || "Guest Customer",
      price: formatPrice(o.total_amount),
      status: o.status,
      date: formatDate(o.created_at || "")
    }));

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-[#E8F5E9] text-[#2E7D32]";
      case "shipped":
        return "bg-[#E3F2FD] text-[#1565C0]";
      case "processing":
        return "bg-[#FFF3E0] text-[#E65100]";
      case "pending":
        return "bg-[#F3E5F5] text-[#7B1FA2]";
      default:
        return "bg-[#FFEBEE] text-[#C62828]";
    }
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Orders Management</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Top Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Orders</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalOrders.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Delivered</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{deliveredCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Shipped</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#1565C0]">{shippedCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Processing</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#E65100]">{processingCount.toLocaleString()}</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
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

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative border border-[#E5E0D5] rounded-xl px-3 py-2 bg-[#FAF8F3]">
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                className="text-xs font-semibold text-[#1C2E24] bg-transparent appearance-none pr-6 focus:outline-none cursor-pointer"
              >
                {ALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button
              onClick={() => toast.success("Exporting Orders CSV...")}
              className="inline-flex items-center gap-1.5 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ── 3. Orders Table ── */}
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
                  <th className="pb-3 px-3">Order Date</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {displayList.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-[#8C9890]">No orders found.</td></tr>
                ) : (
                  displayList.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">#{order.order_number}</td>
                    <td className="py-3.5 px-3 font-semibold text-[#1C2E24]">{order.customer_name}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#1C2E24]">{order.price}</td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md capitalize inline-block ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#556B5D] font-medium">{order.date}</td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="p-1 text-[#6B7A70] hover:text-[#0D2619] transition-colors"
                          title="View Order Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1 text-[#6B7A70] hover:text-red-600 transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Pagination Dock ── */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F0ECE1]">
          <span className="text-[11px] text-[#8C9890] font-medium">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-[#E5E0D5] text-[#1C2E24] hover:bg-[#FAF8F3] disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E5E0D5] text-[#1C2E24] hover:bg-[#FAF8F3] disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
