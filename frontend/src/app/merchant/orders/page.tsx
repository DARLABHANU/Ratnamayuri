"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "@/lib/api";
import { Order, OrderStatus } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, getApiError } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending","confirmed","processing","shipped","out_for_delivery","delivered","cancelled",
];

export default function MerchantOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") { router.push("/auth/login"); return; }
    loadOrders();
  }, [isAuthenticated, role, filter, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await orderApi.merchantOrders({ page, page_size: 15, status: filter || undefined });
      setOrders(data.items);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus, trackingNumber?: string) => {
    setUpdatingId(orderId);
    try {
      await orderApi.updateStatus(orderId, { status: newStatus, tracking_number: trackingNumber });
      toast.success("Order status updated!");
      loadOrders();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <span className="section-tag">SALES</span>
        <h1 className="section-title">Incoming <em className="italic">Orders</em></h1>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {[{ value: "", label: "All" }, ...STATUS_OPTIONS.map(s => ({ value: s, label: ORDER_STATUS_LABELS[s] }))].map((f) => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
            className={`flex-shrink-0 font-cinzel text-xs tracking-wide px-4 py-2 transition-all
              ${filter === f.value ? "bg-deep text-gold-400" : "border border-gold-200 text-muted hover:border-gold-500"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-gold-500" size={28} />
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-cormorant text-2xl text-brown mb-2">No orders found</p>
          <p className="font-garamond text-sm text-muted">Orders containing your products will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="flex items-center gap-2">
                    <ChevronDown size={14} className={`text-muted transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
                    <span className="font-cinzel text-sm tracking-wide text-brown">#{order.order_number}</span>
                  </button>
                  <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-cinzel text-sm text-brown">{formatPrice(order.total_amount)}</p>
                    <p className="font-garamond text-xs text-muted">{formatDate(order.created_at)}</p>
                  </div>
                  <select value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                    disabled={updatingId === order.id || ["delivered","cancelled","refunded"].includes(order.status)}
                    className="input-field py-1.5 text-xs font-cinzel w-44 disabled:opacity-50">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                  </select>
                  {updatingId === order.id && <Loader2 size={14} className="animate-spin text-gold-500" />}
                </div>
              </div>

              {expandedId === order.id && (
                <div className="border-t border-gold-100 p-4 bg-ivory animate-fade-in">
                  <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-white border border-gold-100 flex-shrink-0 overflow-hidden">
                          {item.product_image
                            ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gold-200 text-xs">✦</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-garamond text-sm text-brown truncate">{item.product_name}</p>
                          <p className="font-garamond text-xs text-muted">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-cinzel text-xs text-brown">{formatPrice(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                  {order.status === "processing" && (
                    <div className="pt-3 border-t border-gold-100">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const val = (e.currentTarget.elements.namedItem("tracking") as HTMLInputElement).value;
                        handleStatusUpdate(order.id, "shipped", val);
                      }} className="flex gap-2">
                        <input name="tracking" placeholder="Enter tracking number" className="input-field flex-1 py-2 text-sm" required />
                        <button type="submit" className="btn-primary px-4 py-2 text-xs">MARK SHIPPED</button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <p className="font-garamond text-xs text-muted">Showing {orders.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 15}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
