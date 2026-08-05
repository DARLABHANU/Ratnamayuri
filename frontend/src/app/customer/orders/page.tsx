"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, ChevronRight, ChevronLeft, Loader2, ShoppingBag } from "lucide-react";
import { orderApi } from "@/lib/api";
import { OrderListResponse } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchOrders();
  }, [isAuthenticated, statusFilter, page]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data: res } = await orderApi.list({
        page,
        page_size: 10,
        status: statusFilter || undefined,
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">

      {/* ── Desktop Header ── */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-6 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
          ACCOUNT
        </span>
        <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">My Orders</h1>
        <p className="text-xs text-[#8C9890] mt-0.5">Track your order status and view order history</p>
      </div>

      {/* ── Content Area ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Status filter tabs — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={`flex-shrink-0 font-garamond text-xs font-bold px-4 py-2 rounded-full transition-all border whitespace-nowrap ${
                statusFilter === f.value
                  ? "bg-[#0D2619] text-white border-[#0D2619] shadow-xs"
                  : "bg-white text-[#556B5D] border-[#E5E0D5] hover:border-[#0D2619]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-52">
            <Loader2 className="animate-spin text-[#0D2619]" size={32} />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto my-8">
            <div className="w-16 h-16 bg-[#FAF8F3] rounded-full flex items-center justify-center mx-auto text-[#8C9890]">
              <Package size={28} />
            </div>
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">No Orders Found</h2>
            <p className="text-xs text-[#8C9890]">
              {statusFilter ? "No orders with this status" : "You haven't placed any orders yet."}
            </p>
            <Link
              href="/customer/products"
              className="inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <ShoppingBag size={14} />
              <span>START SHOPPING</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {data.items.map((order) => (
              <Link
                key={order.id}
                href={`/customer/orders/${order.id}`}
                className="bg-white border border-[#E5E0D5] rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-[#0D2619] transition-all group block"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-garamond text-sm font-bold text-[#1C2E24]">
                      #{order.order_number}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C9890]">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} · Placed {formatDate(order.created_at)}
                  </p>
                  <p className="text-xs text-[#556B5D] truncate">
                    {order.items.slice(0, 2).map((i) => i.product_name).join(", ")}
                    {order.items.length > 2 ? "..." : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0ECE1]">
                  <span className="font-cormorant text-lg font-bold text-[#0D2619]">
                    {formatPrice(order.total_amount)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FAF8F3] flex items-center justify-center text-[#8C9890] group-hover:text-[#0D2619] group-hover:bg-[#E8F5E9] transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
