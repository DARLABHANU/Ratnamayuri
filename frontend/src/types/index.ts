// ─── Enums ────────────────────────────────────────────────────────────────────
export type UserRole = "customer" | "merchant" | "admin" | "support";
export type OrderStatus =
  | "pending" | "confirmed" | "processing"
  | "shipped" | "out_for_delivery" | "delivered"
  | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type CommissionStatus = "pending" | "approved" | "paid" | "rejected";

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  account_number: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
  is_promoter?: boolean;
}

export interface Address {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: UserRole;
  user_id: number;
  is_first_login: boolean;
  requires_otp: boolean;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  base_price?: number;
  compare_price?: number;
  sku?: string;
  stock_quantity: number;
  images?: string[];
  tags?: string[];
  attributes?: Record<string, string>;
  is_active: boolean;
  is_approved: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  total_sold: number;
  low_stock_threshold: number;
  weight_grams?: number;
  category_id?: number | null;
  category?: Category;
  subcategory?: string;
  subcategory_slug?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_reference?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  razorpay_key_id?: string;
  tracking_number?: string;
  current_location?: string;
  notes?: string;
  status_history?: StatusHistoryEntry[];
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note: string;
  updated_by?: number;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────
export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_amount: number;
  promoter_commission: number;
  platform_profit: number;
  min_order_amount: number;
  max_uses?: number;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
}

// ─── Commission ───────────────────────────────────────────────────────────────
export interface Commission {
  id: number;
  order_id: number;
  coupon_id: number;
  promoter_id: number;
  amount: number;
  status: CommissionStatus;
  notes?: string;
  paid_at?: string;
  created_at: string;
  promoter?: {
    id: number;
    email: string;
    full_name: string;
    payout_bank_name?: string;
    payout_account_number?: string;
    payout_ifsc_code?: string;
    payout_account_holder_name?: string;
    payout_upi_id?: string;
  };
}

// ─── Merchant ─────────────────────────────────────────────────────────────────
export interface MerchantProfile {
  id: number;
  user_id: number;
  business_name: string;
  business_description?: string;
  gstin?: string;
  commission_rate: number;
  is_approved: boolean;
  logo_url?: string;
  created_at: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminDashboard {
  total_users: number;
  total_merchants: number;
  total_orders: number;
  total_revenue: number;
  total_profit: number;
  pending_orders: number;
  active_coupons: number;
  recent_orders: Order[];
}

// ─── Support ──────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: number;
  performed_by: number;
  target_user_id?: number;
  action: string;
  description?: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ─── Main Category & Subcategory Taxonomy ──────────────────────────────────────
export const CATEGORY_TAXONOMY: Record<string, string[]> = {
  "Sarees": [
    "Silk Sarees",
    "Kanchipuram Sarees",
    "Banarasi Sarees",
    "Cotton Sarees",
    "Mysore Silk",
    "Linen Sarees",
    "Party Wear Sarees",
    "Bridal Sarees"
  ],
  "Jewellery": [
    "Temple Gold",
    "Kundan Jewellery",
    "Polki Jewellery",
    "Necklaces",
    "Chains",
    "Earrings",
    "Bangles",
    "Bracelets",
    "Rings",
    "Anklets",
    "Pendants"
  ],
  "Bridal Collection": [
    "Bridal Jewellery",
    "Bridal Sarees",
    "Wedding Accessories"
  ],
  "New Arrivals": [
    "Latest Jewellery",
    "Latest Sarees"
  ],
  "Best Sellers": [
    "Trending Products",
    "Customer Favorites"
  ],
  "Gift Collection": [
    "Gift Sets",
    "Jewellery Gifts",
    "Saree Gift Boxes"
  ],
  "Festival Collection": [
    "Diwali",
    "Ugadi",
    "Sankranti",
    "Wedding Special Collections"
  ],
  "Offers": [
    "Combo Offers",
    "Discount Deals",
    "Clearance Sale"
  ],
  "All Collections": [
    "View All Products"
  ]
};
