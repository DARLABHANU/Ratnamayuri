"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Order, OrderStatus } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, getApiError } from "@/lib/utils";
import { orderApi } from "@/lib/api";

const ALL_STATUSES: OrderStatus[] = ["pending","confirmed","processing","shipped","out_for_delivery","delivered","cancelled","refunded"];

function AdminOrdersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, role } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(params.get("status") || "");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !["admin","support"].includes(role || "")) { router.push("/auth/login"); return; }
    loadOrders();
  }, [isAuthenticated, role, filter, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.orders({ page, page_size: 20, status: filter || undefined });
      setOrders(data.items);
      setTotal(data.total);
    } finally { setIsLoading(false); }
  };

  const handleStatusUpdate = async (orderId: number, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await orderApi.updateStatus(orderId, { status });
      toast.success("Status updated");
      loadOrders();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setUpdatingId(null); }
  };

  return (
    <div>
      <div className="mb-8">
        <span className="section-tag">FULFILMENT</span>
        <h1 className="section-title">Order <em className="italic">Management</em></h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 flex-wrap">
        {[{ value: "", label: "All" }, ...ALL_STATUSES.map(s => ({ value: s, label: ORDER_STATUS_LABELS[s] }))].map((f) => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
            className={`flex-shrink-0 font-cinzel text-xs tracking-wide px-3 py-2 transition-all
              ${filter === f.value ? "bg-deep text-gold-400" : "border border-gold-200 text-muted hover:border-gold-500"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="flex items-center gap-2">
                    <ChevronDown size={14} className={`text-muted transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
                    <span className="font-cinzel text-xs tracking-wide text-brown">#{order.order_number}</span>
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
                    disabled={updatingId === order.id}
                    className="input-field py-1.5 text-xs font-cinzel w-44 disabled:opacity-50">
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                  </select>
                  {updatingId === order.id && <Loader2 size={14} className="animate-spin text-gold-500" />}
                </div>
              </div>

              {expandedId === order.id && (
                <div className="border-t border-gold-100 p-4 bg-ivory">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-cinzel text-xs tracking-widest text-muted mb-2">ITEMS</p>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between font-garamond text-sm py-1 border-b border-gold-50">
                          <span className="text-brown">{item.product_name} × {item.quantity}</span>
                          <span className="text-muted">{formatPrice(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-cinzel text-xs tracking-widest text-muted mb-2">FINANCIALS</p>
                      {[
                        { label: "Subtotal", val: formatPrice(order.subtotal) },
                        ...(order.discount_amount > 0 ? [{ label: "Discount", val: `-${formatPrice(order.discount_amount)}` }] : []),
                        { label: "Shipping", val: order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount) },
                        { label: "GST", val: formatPrice(order.tax_amount) },
                        { label: "TOTAL", val: formatPrice(order.total_amount) },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex justify-between font-garamond text-sm py-1 border-b border-gold-50">
                          <span className="text-muted">{label}</span>
                          <span className="text-brown">{val}</span>
                        </div>
                      ))}
                      {order.tracking_number && (
                        <p className="font-garamond text-xs text-muted mt-2">
                          Tracking: <span className="text-brown">{order.tracking_number}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {orders.length === 0 && (
            <div className="card p-12 text-center">
              <p className="font-garamond text-muted">No orders found</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <p className="font-garamond text-xs text-muted">{total} total orders</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return <Suspense fallback={<div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gold-500" size={28}/></div>}><AdminOrdersContent /></Suspense>;
}
