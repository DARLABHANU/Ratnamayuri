"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ChevronRight, Loader2 } from "lucide-react";
import { orderApi } from "@/lib/api";
import { Order, OrderListResponse, OrderStatus } from "@/types";
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

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-8">
        <span className="section-tag">ACCOUNT</span>
        <h1 className="section-title">My <em className="italic">Orders</em></h1>
        <div className="divider-gold mx-0 mt-4" />
      </div>

      {/* Status filter tabs — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {STATUS_FILTERS.map((f) => (
          <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`flex-shrink-0 font-cinzel text-xs tracking-wide px-3 sm:px-4 py-2 transition-all rounded-md
              ${statusFilter === f.value
                ? "bg-deep text-gold-400"
                : "border border-gold-200 text-muted hover:border-gold-500 hover:text-brown"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-gold-500" size={28} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-gold-200 mx-auto mb-4" />
          <h2 className="font-cormorant text-2xl text-brown mb-2">No orders found</h2>
          <p className="font-garamond text-muted mb-6">
            {statusFilter ? "No orders with this status" : "You haven't placed any orders yet"}
          </p>
          <Link href="/customer/products" className="btn-primary">START SHOPPING</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((order) => (
            <Link key={order.id} href={`/customer/orders/${order.id}`}
              className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4
                hover:border-gold-300 transition-all group">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <p className="font-cinzel text-sm tracking-wide text-brown">#{order.order_number}</p>
                  <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="font-garamond text-sm text-muted mb-1">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""} · Placed {formatDate(order.created_at)}
                </p>
                <p className="font-garamond text-xs text-muted truncate">
                  {order.items.slice(0, 2).map((i) => i.product_name).join(", ")}
                  {order.items.length > 2 && ` +${order.items.length - 2} more`}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <p className="font-cinzel text-sm text-brown">{formatPrice(order.total_amount)}</p>
                <ChevronRight size={16} className="text-muted group-hover:text-gold-500 transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 font-cinzel text-xs transition-colors
                    ${p === page ? "bg-deep text-gold-400" : "border border-gold-200 hover:border-gold-500"}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
