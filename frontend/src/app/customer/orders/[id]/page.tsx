"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Package, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "@/lib/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
import { Order } from "@/types";
import { formatPrice, formatDate, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import OrderTracker from "@/components/customer/OrderTracker";
import { useAuthStore } from "@/store/authStore";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handlePayNow = async () => {
    if (!order) return;
    setIsProcessingPayment(true);
    
    // Load Razorpay script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Failed to load Razorpay payment window. Please check your network connection.");
      setIsProcessingPayment(false);
      return;
    }

    // Graceful fallback to sandbox/mock payment if rzp keys are missing in backend
    if (!(order as any).razorpay_order_id) {
      toast.error("Keys missing: Simulating instant mock payment confirmation...");
      try {
        const { data: updatedOrder } = await orderApi.razorpayVerify({
          razorpay_order_id: String(order.id),
          razorpay_payment_id: "mock_payment",
          razorpay_signature: "mock_signature",
        });
        setOrder(updatedOrder);
        toast.success("Order payment simulated successfully!");
      } catch (err) {
        toast.error("Simulation update failed.");
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    const options = {
      key: (order as any).razorpay_key_id,
      amount: Math.round(order.total_amount * 100), // in paise
      currency: "INR",
      name: "Ratnamayuri",
      description: `Order #${order.order_number}`,
      order_id: (order as any).razorpay_order_id,
      handler: async function (response: any) {
        setIsProcessingPayment(true);
        try {
          const { data: updatedOrder } = await orderApi.razorpayVerify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setOrder(updatedOrder);
          toast.success("Payment verified successfully! Order confirmed.");
        } catch (verifyErr) {
          toast.error("Payment signature verification failed. Please contact support.");
        } finally {
          setIsProcessingPayment(false);
        }
      },
      prefill: {
        name: user?.full_name || "",
        email: user?.email || "",
      },
      theme: {
        color: "#5C1318",
      },
      modal: {
        ondismiss: function () {
          toast.error("Payment modal closed.");
          setIsProcessingPayment(false);
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    orderApi.get(Number(id))
      .then((r) => setOrder(r.data))
      .catch(() => router.push("/customer/orders"))
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated]);

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );
  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1 font-cinzel text-xs tracking-wide text-muted hover:text-brown mb-8">
        <ChevronLeft size={14} /> MY ORDERS
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="font-cinzel text-xs tracking-widest text-gold-500 mb-1">ORDER</p>
          <h1 className="font-cormorant text-3xl font-light text-brown">#{order.order_number}</h1>
          <p className="font-garamond text-sm text-muted mt-1">Placed on {formatDate(order.created_at)}</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <span className={`badge py-1 px-3 ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          {order.tracking_number && (
            <p className="font-garamond text-xs text-muted">
              Tracking: <span className="text-brown font-medium">{order.tracking_number}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tracker */}
      <div className="card p-6 mb-6">
        <h2 className="font-cinzel text-xs tracking-widest text-muted mb-6 flex items-center gap-2">
          <Package size={12} /> ORDER TRACKING
        </h2>
        <OrderTracker status={order.status} history={order.status_history} />
      </div>



      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Items */}
        <div className="card p-6">
          <h2 className="font-cinzel text-xs tracking-widest text-muted mb-4">ITEMS ORDERED</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-14 h-16 bg-ivory flex-shrink-0 overflow-hidden">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold-300">
                      <Package size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-garamond text-sm text-brown font-medium leading-tight">{item.product_name}</p>
                  <p className="font-garamond text-xs text-muted mt-0.5">Qty: {item.quantity}</p>
                  <p className="font-cinzel text-xs text-brown mt-1">{formatPrice(item.total_price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Address */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-cinzel text-xs tracking-widest text-muted mb-4 flex items-center gap-2">
              <CreditCard size={12} /> PAYMENT SUMMARY
            </h2>
            <div className="space-y-2">
              {[
                { label: "Subtotal", val: formatPrice(order.subtotal) },
                ...(order.discount_amount > 0 ? [{ label: "Discount", val: `-${formatPrice(order.discount_amount)}`, green: true }] : []),
                { label: "Shipping", val: order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount) },
                { label: "GST", val: formatPrice(order.tax_amount) },
              ].map(({ label, val, green }) => (
                <div key={label} className="flex justify-between font-garamond text-sm">
                  <span className="text-muted">{label}</span>
                  <span className={green ? "text-green-600" : "text-brown"}>{val}</span>
                </div>
              ))}
              <div className="flex justify-between font-cinzel text-sm border-t border-gold-200 pt-2 mt-2">
                <span>TOTAL</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gold-100">
              <div className="flex justify-between font-garamond text-sm">
                <span className="text-muted">Payment Method</span>
                <span className="text-brown capitalize">{order.payment_method || "N/A"}</span>
              </div>
              <div className="flex justify-between font-garamond text-sm mt-1">
                <span className="text-muted">Payment Status</span>
                <span className={`capitalize font-medium ${order.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                  {order.payment_status}
                </span>
              </div>
              
              {order.payment_status === "pending" && order.status !== "cancelled" && (
                <button
                  onClick={handlePayNow}
                  disabled={isProcessingPayment}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs tracking-wider"
                >
                  {isProcessingPayment && <Loader2 size={12} className="animate-spin" />}
                  PAY NOW WITH RAZORPAY
                </button>
              )}
            </div>
          </div>

          {order.delivered_at && (
            <div className="bg-green-50 border border-green-200 p-4">
              <p className="font-cinzel text-xs tracking-wide text-green-700">✓ DELIVERED</p>
              <p className="font-garamond text-sm text-green-600 mt-1">
                {formatDateTime(order.delivered_at)}
              </p>
            </div>
          )}

          {order.notes && (
            <div className="card p-4">
              <p className="font-cinzel text-xs tracking-widest text-muted mb-1">ORDER NOTES</p>
              <p className="font-garamond text-sm text-brown">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
