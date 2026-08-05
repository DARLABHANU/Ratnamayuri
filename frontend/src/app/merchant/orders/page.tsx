"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Search,
  Download,
  Eye,
  Truck,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Package
} from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Order } from "@/types";
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
  const [totalPages, setTotalPages] = useState(1);

  // Quick Tracking Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState("pending");
  const [modalTrackingNumber, setModalTrackingNumber] = useState("");
  const [modalCurrentLocation, setModalCurrentLocation] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);

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
      if (data && data.items) {
        setOrders(data.items);
        setTotalOrders(data.total || data.items.length);
        setTotalPages(data.pages || 1);

        let delivered = 0;
        let shipped = 0;
        let processing = 0;
        data.items.forEach((o: any) => {
          if (o.status === "delivered") delivered++;
          else if (o.status === "shipped" || o.status === "out_for_delivery") shipped++;
          else if (o.status === "processing" || o.status === "confirmed") processing++;
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

  const handleOpenTrackingModal = (ord: any) => {
    setSelectedOrder(ord);
    setModalStatus(ord.status || "pending");
    setModalTrackingNumber(ord.tracking_number || "");
    setModalCurrentLocation(ord.current_location || "");
    setModalNotes("");
    setModalOpen(true);
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsSubmittingTracking(true);
    try {
      await orderApi.updateStatus(selectedOrder.id, {
        status: modalStatus,
        tracking_number: modalTrackingNumber || undefined,
        current_location: modalCurrentLocation || undefined,
        notes: modalNotes || undefined
      });

      toast.success("Shipment tracking details updated!");
      setModalOpen(false);
      loadOrders();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const handleExportCSV = () => {
    toast.success("Exporting Store Orders CSV...");
  };

  const filteredOrders = orders.filter((o) => {
    const orderNo = (o.order_number || `BNC${o.id}`).toLowerCase();
    const custName = ((o as any).shipping_address?.full_name || (o as any).user?.full_name || "").toLowerCase();
    const trackNo = (o.tracking_number || "").toLowerCase();
    const searchLower = search.toLowerCase();
    return orderNo.includes(searchLower) || custName.includes(searchLower) || trackNo.includes(searchLower);
  });

  const displayList = filteredOrders.map((o) => ({
    id: o.id,
    order_number: o.order_number || `ORD#${o.id}`,
    customer_name: (o as any).shipping_address?.full_name || (o as any).user?.full_name || "Customer",
    price: o.total_amount,
    status: o.status,
    tracking_number: o.tracking_number || "Not assigned",
    current_location: o.current_location || "Processing",
    date: formatDate(o.created_at || new Date().toISOString()),
    raw: o
  }));

  const getStatusBadge = (statusStr: string) => {
    switch ((statusStr || "").toLowerCase()) {
      case "delivered":
        return "bg-[#E8F5E9] text-[#2E7D32]";
      case "shipped":
      case "out_for_delivery":
        return "bg-[#E3F2FD] text-[#1565C0]";
      case "processing":
      case "confirmed":
        return "bg-[#FFF3E0] text-[#E65100]";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-[#F3E5F5] text-[#7B1FA2]";
    }
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Store Orders &amp; Fulfillment</h1>
          <p className="text-xs text-[#8C9890] mt-0.5">Manage customer orders and update shipment tracking details</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Top Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Orders</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalOrders}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Delivered</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{deliveredCount}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Shipped &amp; In-Transit</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#1565C0]">{shippedCount}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Processing / Pending</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#E65100]">{processingCount}</span>
          </div>
        </div>

        {/* ── 2. Search & Filter Controls ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
            <input
              type="text"
              placeholder="Search by Order #, Customer, AWB tracking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative border border-[#E5E0D5] rounded-xl px-3 py-2 bg-[#FAF8F3]">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs font-semibold text-[#1C2E24] bg-transparent appearance-none pr-6 focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Download size={14} />
              <span>Export CSV</span>
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
                  <th className="pb-3 px-3">Tracking AWB</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8C9890]">No orders found</td>
                  </tr>
                ) : (
                  displayList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#1C2E24]">
                        <Link href={`/merchant/orders/${item.id}`} className="hover:underline text-[#0D2619]">
                          {item.order_number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-[#1C2E24]">{item.customer_name}</td>
                      <td className="py-3.5 px-3 font-extrabold text-[#2E7D32]">{formatPrice(item.price)}</td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block uppercase ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[#556B5D] font-semibold">
                        {item.tracking_number !== "Not assigned" ? (
                          <span className="font-mono text-[11px] text-[#0D2619] bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-emerald-200">
                            {item.tracking_number}
                          </span>
                        ) : (
                          <span className="text-[#8C9890] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-[#556B5D] font-medium">{item.date}</td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenTrackingModal(item.raw)}
                            className="inline-flex items-center gap-1 bg-[#0D2619] hover:bg-[#19402B] text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                            title="Update Tracking & Status"
                          >
                            <Truck size={13} />
                            <span className="hidden sm:inline">Track</span>
                          </button>

                          <Link
                            href={`/merchant/orders/${item.id}`}
                            className="p-1.5 text-[#6B7A70] hover:text-[#0D2619] hover:bg-[#FAF8F3] rounded-lg transition-colors inline-block"
                            title="View Full Details"
                          >
                            <Eye size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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

      {/* ── 4. Quick Update Tracking Modal ── */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
              <div>
                <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">
                  Update Order {selectedOrder.order_number || `#ORD${selectedOrder.id}`}
                </h3>
                <p className="text-[11px] text-[#8C9890]">Enter shipment AWB tracking number and update fulfillment status</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-[#8C9890] hover:text-[#1C2E24]">
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTracking} className="space-y-4 text-xs">
              
              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Order Status *</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
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

              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Tracking Number / AWB Code</label>
                <input
                  type="text"
                  value={modalTrackingNumber}
                  onChange={(e) => setModalTrackingNumber(e.target.value)}
                  placeholder="e.g. BLUEDART-98765432"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Courier Partner / Location Update</label>
                <input
                  type="text"
                  value={modalCurrentLocation}
                  onChange={(e) => setModalCurrentLocation(e.target.value)}
                  placeholder="e.g. BlueDart Express - Dispatched from Guntur Sorting Hub"
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C2E24] block mb-1">Log Note / Shipping Instructions</label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Handed over package to logistics agent."
                  className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-3 font-garamond text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E5E0D5] text-[#556B5D] hover:bg-[#FAF8F3]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingTracking}
                  className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmittingTracking ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save Tracking</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

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
