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

// ── Validation Regex Patterns ──────────────────────────────────────────
export const REGEX_INDIAN_PHONE = /^[6-9]\d{9}$/;
export const REGEX_INDIAN_PINCODE = /^[1-9][0-9]{5}$/;
export const REGEX_BANK_ACCOUNT = /^\d{9,18}$/;
export const REGEX_IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const REGEX_UPI_ID = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2-64}$/;
export const REGEX_GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const REGEX_COUPON = /^[A-Z0-9]{3,15}$/;
export const REGEX_STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// ── Estimated delivery date helper ───────────────────────────────────────────
export function getEstimatedDelivery(pincode: string | undefined): string {
  if (!pincode || pincode.length !== 6) return "";

  const now = new Date();
  // Same-day / Express cities (major metros)
  const expressPincodes = ["110", "400", "560", "600", "700", "500"]; // Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad
  const prefix = pincode.slice(0, 3);
  const isExpress = expressPincodes.includes(prefix);

  // Metro pincode prefixes (2-4 days)
  const metroPrefixes = ["122", "302", "380", "641", "411", "462", "226", "208"];
  const isMetro = metroPrefixes.includes(prefix);

  const daysToAdd = isExpress ? 2 : isMetro ? 4 : 7;
  const deliveryDate = new Date(now);
  deliveryDate.setDate(now.getDate() + daysToAdd);

  // Skip Sundays
  if (deliveryDate.getDay() === 0) deliveryDate.setDate(deliveryDate.getDate() + 1);

  const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" };
  return deliveryDate.toLocaleDateString("en-IN", options);
}
