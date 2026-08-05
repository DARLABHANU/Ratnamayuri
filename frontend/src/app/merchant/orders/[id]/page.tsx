"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  Printer,
  PhoneCall,
  Save,
  Loader2,
  FileText,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

export default function MerchantOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form fields for tracking update
  const [status, setStatus] = useState("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
      return;
    }
    loadOrderDetails();
  }, [params.id, isAuthenticated, role]);

  const loadOrderDetails = async () => {
    setIsLoading(true);
    try {
      if (params.id) {
        const { data } = await orderApi.get(Number(params.id));
        setOrder(data);
        if (data) {
          setStatus(data.status || "pending");
          setTrackingNumber(data.tracking_number || "");
          setCurrentLocation(data.current_location || "");
        }
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsUpdating(true);
    try {
      await orderApi.updateStatus(order.id, {
        status,
        tracking_number: trackingNumber || undefined,
        current_location: currentLocation || undefined,
        notes: notes || undefined
      });

      toast.success("Order tracking and status updated successfully!");
      setNotes("");
      loadOrderDetails();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch ((st || "").toLowerCase()) {
      case "delivered":
        return "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]";
      case "shipped":
      case "out_for_delivery":
        return "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]";
      case "processing":
      case "confirmed":
        return "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-[#F3E5F5] text-[#7B1FA2] border-[#E1BEE7]";
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0D2619]" size={36} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 text-[#1C2E24] font-garamond">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full border border-[#E5E0D5] bg-white flex items-center justify-center text-[#1C2E24] hover:bg-[#FAF8F3] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-cormorant text-2xl font-bold">Order Not Found</h1>
        </div>
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-8 text-center text-[#8C9890]">
          The requested order could not be found or you do not have permission to view it.
        </div>
      </div>
    );
  }

  const shippingAddr = order.shipping_address || (order as any).address || {};
  const customerName = shippingAddr.full_name || order.user?.full_name || "Customer";

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond pb-12">
      
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full border border-[#E5E0D5] bg-white flex items-center justify-center text-[#1C2E24] hover:bg-[#FAF8F3] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">
                Order {order.order_number || `#ORD${order.id}`}
              </h1>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadge(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-[#8C9890]">Placed on {formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-white border border-[#E5E0D5] hover:bg-[#FAF8F3] text-[#1C2E24] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Printer size={14} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* ── Main 2 Columns Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Tracking Update & Order Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Update Shipment & Tracking Details Form */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
              <Truck size={18} className="text-[#0D2619]" />
              <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Update Tracking &amp; Shipment Details</h3>
            </div>

            <form onSubmit={handleUpdateTracking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Order Status Selector */}
                <div>
                  <label className="font-bold text-[#1C2E24] block mb-1">Fulfillment Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                    required
                  >
                    {ORDER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tracking Number / AWB */}
                <div>
                  <label className="font-bold text-[#1C2E24] block mb-1">Tracking Number / AWB Code</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BLUEDART987654321"
                    className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                  />
                </div>

              </div>

              {/* Courier Name & Location */}
              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Courier Partner / Current Hub Location</label>
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g. BlueDart Express - Dispatched from Guntur Sorting Hub"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                />
              </div>

              {/* Shipping Note */}
              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Shipping Log Note (Visible to Customer)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Package handed over to BlueDart courier agent. Estimated delivery in 2 business days."
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-3 font-garamond text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save &amp; Update Tracking</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Order Items */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#0D2619]" />
                <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Order Items</h3>
              </div>
              <span className="text-xs text-[#8C9890] font-semibold">{order.items?.length || 0} Products</span>
            </div>

            <div className="divide-y divide-[#F0ECE1]">
              {(order.items || []).map((item: any, idx: number) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product_image || (item.product?.images?.[0]) || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop"}
                      alt={item.product_name || "Product"}
                      className="w-14 h-14 rounded-xl object-cover border border-[#E5E0D5] bg-[#FAF8F3]"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-[#1C2E24] line-clamp-1">{item.product_name || item.product?.name || "Jewellery Product"}</h4>
                      <p className="text-[11px] text-[#8C9890] mt-0.5">
                        Qty: <span className="font-bold text-[#1C2E24]">{item.quantity}</span> × {formatPrice(item.unit_price || item.total_price / item.quantity)}
                      </p>
                      {item.merchant_payout !== undefined && (
                        <p className="text-[10px] text-[#2E7D32] font-semibold mt-0.5">
                          Merchant Payout: {formatPrice(item.merchant_payout)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-cormorant text-base font-extrabold text-[#1C2E24] block">
                      {formatPrice(item.total_price || item.unit_price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Tracking History & Event Timeline */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
                <Clock size={18} className="text-[#0D2619]" />
                <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Tracking &amp; Status History</h3>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E0D5]">
                {order.status_history.map((hist: any, hIdx: number) => (
                  <div key={hIdx} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[#0D2619] border-2 border-white ring-2 ring-[#E5E0D5]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#1C2E24] capitalize">{hist.status}</span>
                        <span className="text-[10px] text-[#8C9890]">
                          {hist.timestamp ? formatDate(hist.timestamp) : ""}
                        </span>
                      </div>
                      {hist.note && (
                        <p className="text-[11px] text-[#556B5D] mt-0.5">{hist.note}</p>
                      )}
                      {hist.tracking_number && (
                        <p className="text-[10px] text-[#0D2619] font-bold mt-0.5">
                          AWB: {hist.tracking_number}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Customer & Payment Summary */}
        <div className="space-y-6">
          
          {/* Customer & Delivery Address Card */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-cormorant text-lg font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">
              Customer &amp; Shipping
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-[#8C9890] block">Customer Name</span>
                <span className="font-bold text-[#1C2E24] text-sm">{customerName}</span>
              </div>

              {shippingAddr.phone && (
                <div>
                  <span className="text-[11px] text-[#8C9890] block">Phone Number</span>
                  <span className="font-semibold text-[#1C2E24]">{shippingAddr.phone}</span>
                </div>
              )}

              {shippingAddr.address_line1 && (
                <div>
                  <span className="text-[11px] text-[#8C9890] block">Shipping Address</span>
                  <p className="font-garamond text-xs text-[#556B5D] leading-relaxed mt-0.5">
                    {shippingAddr.address_line1}
                    {shippingAddr.address_line2 ? `, ${shippingAddr.address_line2}` : ""}
                    <br />
                    {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.postal_code}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Price Summary Card */}
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-cormorant text-lg font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">
              Payment Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#6B7A70]">
                <span>Payment Status</span>
                <span className="font-bold text-[#2E7D32] capitalize">{order.payment_status || "Paid"}</span>
              </div>

              <div className="flex justify-between text-[#6B7A70]">
                <span>Payment Method</span>
                <span className="font-semibold text-[#1C2E24] uppercase">{order.payment_method || "Online"}</span>
              </div>

              <div className="flex justify-between text-[#6B7A70]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1C2E24]">{formatPrice(order.subtotal || order.total_amount)}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[#2E7D32]">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatPrice(order.discount_amount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#F0ECE1] flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#1C2E24]">Total Amount</span>
                <span className="font-cormorant text-xl font-extrabold text-[#0D2619]">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
