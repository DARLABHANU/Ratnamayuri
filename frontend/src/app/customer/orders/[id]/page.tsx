"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Package, CreditCard, RotateCcw, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "@/lib/api";
import { Order } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import OrderTracker from "@/components/customer/OrderTracker";
import { useAuthStore } from "@/store/authStore";

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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    orderApi.get(Number(id))
      .then((r) => setOrder(r.data))
      .catch(() => router.push("/customer/orders"))
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated]);

  const handleRefundOrder = async () => {
    const reason = window.prompt("Please enter a reason for the return request:");
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    setIsRefunding(true);
    try {
      const { data } = await orderApi.refund(Number(id), { reason });
      setOrder(data.order);
      toast.success("RMA return request submitted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to request return.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setIsCancelling(true);
    try {
      const { data: updatedOrder } = await orderApi.cancel(Number(id));
      setOrder(updatedOrder);
      toast.success("Order cancelled successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;
    setIsProcessingPayment(true);

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Failed to load Razorpay payment window.");
      setIsProcessingPayment(false);
      return;
    }

    if (!(order as any).razorpay_order_id) {
      try {
        const { data: updatedOrder } = await orderApi.razorpayVerify({
          razorpay_order_id: String(order.id),
          razorpay_payment_id: "mock_payment",
          razorpay_signature: "mock_signature",
        });
        setOrder(updatedOrder);
        toast.success("Order payment confirmed!");
      } catch {
        toast.error("Payment confirmation failed.");
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_key",
      amount: Math.round(order.total_amount * 100),
      currency: "INR",
      name: "Ratnamayuri Marketplace",
      description: `Payment for Order #${order.order_number}`,
      order_id: (order as any).razorpay_order_id,
      handler: async function (response: any) {
        try {
          const { data: updatedOrder } = await orderApi.razorpayVerify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setOrder(updatedOrder);
          toast.success("Payment verified successfully!");
        } catch {
          toast.error("Payment verification failed.");
        } finally {
          setIsProcessingPayment(false);
        }
      },
      prefill: {
        name: user?.full_name || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },
      theme: { color: "#0D2619" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#0D2619]" size={32} />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C2E24] font-garamond">
      {/* ── Mobile Header ── */}
      <div className="md:hidden sticky top-0 z-40 bg-[#FAF8F3] border-b border-[#E5E0D5] shadow-xs">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F0ECE5] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} className="text-[#1C2E24]" />
          </button>
          <h1 className="font-cormorant text-[20px] font-bold tracking-wide text-[#1C2E24]">
            Order Details
          </h1>
          <div className="w-9 h-9 flex items-center justify-center text-xs font-bold text-[#0D2619]">
            #{order.order_number.slice(-4)}
          </div>
        </div>
      </div>

      {/* ── Desktop Header ── */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-6 pb-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2619] hover:underline mb-3"
        >
          <ChevronLeft size={16} /> Back to My Orders
        </button>
        <div className="flex justify-between items-start border-b border-[#F0ECE1] pb-3 mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
              ORDER SUMMARY
            </span>
            <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">Order #{order.order_number}</h1>
            <p className="text-xs text-[#8C9890] mt-0.5">Placed on {formatDate(order.created_at)}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6">

        {/* Order Tracker Card */}
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-2 flex items-center gap-2">
            <Package size={18} className="text-[#0D2619]" /> Order Tracking
          </h2>
          <OrderTracker status={order.status} history={order.status_history} />
        </div>

        {/* Items & Payment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Items List Card */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
            <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-2">
              Items Ordered ({order.items.length})
            </h2>
            <div className="space-y-3 divide-y divide-[#F2EFE9]">
              {order.items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8F3] border border-[#E5E0D5] flex-shrink-0">
                    {item.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8C9890]">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-garamond text-sm font-bold text-[#1C2E24] truncate">{item.product_name}</p>
                    <p className="text-xs text-[#8C9890]">Qty: {item.quantity}</p>
                    <p className="font-garamond text-xs font-bold text-[#0D2619] mt-0.5">{formatPrice(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Shipping Summary */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
            <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-2 flex items-center gap-2">
              <CreditCard size={18} className="text-[#0D2619]" /> Payment Breakdown
            </h2>

            <div className="space-y-2 text-xs text-[#556B5D]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#1C2E24]">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[#2E7D32]">
                  <span>Discount</span>
                  <span className="font-bold">-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Transit</span>
                <span className="font-bold text-[#1C2E24]">{order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (18%)</span>
                <span className="font-bold text-[#1C2E24]">{formatPrice(order.tax_amount)}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-[#1C2E24] border-t border-[#F0ECE1] pt-3">
                <span>Total Amount</span>
                <span className="font-cormorant text-xl font-extrabold text-[#0D2619]">{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#F0ECE1] space-y-2">
              {order.payment_status === "pending" && order.status === "pending" && (
                <button
                  onClick={handlePayNow}
                  disabled={isProcessingPayment}
                  className="w-full bg-[#0D2619] text-white py-3 rounded-xl font-bold text-xs shadow-xs"
                >
                  {isProcessingPayment ? "Processing..." : "PAY NOW VIA RAZORPAY"}
                </button>
              )}

              {order.status === "pending" && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>{isCancelling ? "Cancelling..." : "Cancel Order"}</span>
                </button>
              )}

              {order.status === "delivered" && (
                <button
                  onClick={handleRefundOrder}
                  disabled={isRefunding}
                  className="w-full border border-[#0D2619] text-[#0D2619] hover:bg-[#E8F5E9] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>{isRefunding ? "Submitting..." : "Request Return / Refund (7 Days)"}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
