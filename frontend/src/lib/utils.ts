import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "!bg-amber-600 !text-white font-semibold",
  confirmed: "!bg-blue-600 !text-white font-semibold",
  processing: "!bg-purple-600 !text-white font-semibold",
  shipped: "!bg-indigo-600 !text-white font-semibold",
  out_for_delivery: "!bg-orange-600 !text-white font-semibold",
  delivered: "!bg-emerald-700 !text-white font-semibold",
  cancelled: "!bg-red-700 !text-white font-semibold",
  refunded: "!bg-slate-600 !text-white font-semibold",
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered",
];

export function getStatusStepIndex(status: OrderStatus): number {
  return ORDER_STATUS_STEPS.indexOf(status);
}

export function getApiError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { detail?: string | { msg: string }[] } } }).response;
    const detail = res?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  }
  return "Something went wrong. Please try again.";
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + "..." : str;
}

export function getProductImage(images?: string[]): string {
  if (images && images.length > 0) return images[0];
  return "/placeholder-product.svg";
}
