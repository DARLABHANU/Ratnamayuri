import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// In production (Vercel), the frontend and backend share the same domain,
// so /api/v1 routes correctly through vercel.json without any CORS issues.
// In local development, override via NEXT_PUBLIC_API_URL in .env.local.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";


export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Request interceptor: attach token ─────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ─────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get("refresh_token");
      if (!refreshToken) {
        clearAuth();
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        setAuthCookies(data.access_token, data.refresh_token);
        processQueue(null, data.access_token);
        if (original.headers) original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function setAuthCookies(accessToken: string, refreshToken: string) {
  Cookies.set("access_token", accessToken, { expires: 1, sameSite: "Lax" });
  Cookies.set("refresh_token", refreshToken, { expires: 30, sameSite: "Lax" });
}

export function clearAuth() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("user_role");
  Cookies.remove("user_id");
}

// ── Typed API helpers ─────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: object) => api.post("/auth/signup", data),
  login: (data: object) => api.post("/auth/login", data),
  verifyOtp: (data: object) => api.post("/auth/verify-otp", data),
  resendOtp: (data: object) => api.post("/auth/resend-otp", data),
  refresh: (data: object) => api.post("/auth/refresh", data),
  me: () => api.get("/auth/me"),
  changePassword: (data: object) => api.post("/auth/change-password", data),
  forgotPassword: (data: object) => api.post("/auth/forgot-password", data),
  resetPassword: (data: object) => api.post("/auth/reset-password", data),
};

export const productApi = {
  list: (params?: object) => api.get("/products", { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: object) => api.post("/products", data),
  update: (id: number, data: object) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  myProducts: (params?: object) => api.get("/products/merchant/my-products", { params }),
  upload: (data: { filename: string; base64: string }) => api.post("/upload", data),
  categories: () => api.get("/products/categories/all"),
};

export const cartApi = {
  get: () => api.get("/cart"),
  add: (data: object) => api.post("/cart/add", data),
  remove: (itemId: number) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete("/cart"),
};

export const orderApi = {
  list: (params?: object) => api.get("/orders", { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  create: (data: object) => api.post("/orders", data),
  validateCoupon: (data: object) => api.post("/orders/validate-coupon", data),
  updateStatus: (id: number, data: object) => api.patch(`/orders/${id}/status`, data),
  merchantOrders: (params?: object) => api.get("/orders/merchant/incoming", { params }),
};

export const merchantApi = {
  createProfile: (data: object) => api.post("/merchant/profile", data),
  getProfile: () => api.get("/merchant/profile"),
  updateProfile: (data: object) => api.put("/merchant/profile", data),
  analytics: (days?: number) => api.get("/merchant/analytics", { params: { days } }),
  commissions: () => api.get("/merchant/commissions"),
  wallet: () => api.get("/merchant/wallet"),
  requestWithdrawal: (data: object) => api.post("/merchant/withdraw", data),
};

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  users: (params?: object) => api.get("/admin/users", { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  updateUser: (id: number, data: object) => api.patch(`/admin/users/${id}`, data),
  createUser: (data: object) => api.post("/admin/users", data),
  merchants: (params?: object) => api.get("/admin/merchants", { params }),
  approveMerchant: (id: number, data: object) =>
    api.patch(`/admin/merchants/${id}/approval`, data),
  orders: (params?: object) => api.get("/admin/orders", { params }),
  coupons: () => api.get("/admin/coupons"),
  createCoupon: (data: object) => api.post("/admin/coupons", data),
  updateCoupon: (id: number, data: object) => api.patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id: number) => api.delete(`/admin/coupons/${id}`),
  commissions: (params?: object) => api.get("/admin/commissions", { params }),
  payCommission: (id: number) => api.patch(`/admin/commissions/${id}/pay`),
  salesAnalytics: (days?: number) => api.get("/admin/analytics/sales", { params: { days } }),
  products: (params?: object) => api.get("/admin/products", { params }),
  approveProduct: (id: number, data: { is_approved: boolean }) => api.patch(`/admin/products/${id}/approve`, data),
  withdrawals: (params?: object) => api.get("/admin/withdrawals", { params }),
  approveWithdrawal: (id: number, data: { status: "approved" | "rejected" }) =>
    api.patch(`/admin/withdrawals/${id}/approval`, data),
};

export const supportApi = {
  lookup: (data: object) => api.post("/support/lookup", data),
  impersonate: (data: object) => api.post("/support/impersonate", data),
  endImpersonation: (auditLogId: number) =>
    api.post(`/support/impersonate/end/${auditLogId}`),
  auditLogs: (params?: object) => api.get("/support/audit-logs", { params }),
  userOrders: (userId: number) => api.get(`/support/user/${userId}/orders`),
  resetPassword: (userId: number, data: object) =>
    api.patch(`/support/user/${userId}/reset-password`, data),
};

export const addressApi = {
  list: () => api.get("/addresses"),
  create: (data: object) => api.post("/addresses", data),
  update: (id: number, data: object) => api.put(`/addresses/${id}`, data),
  delete: (id: number) => api.delete(`/addresses/${id}`),
};

export const wishlistApi = {
  get: () => api.get("/wishlist"),
  toggle: (productId: number) => api.post("/wishlist/toggle", { product_id: productId }),
};

export const promoterApi = {
  commissions: () => api.get("/promoter/commissions"),
  coupons: () => api.get("/promoter/coupons"),
  analytics: () => api.get("/promoter/analytics"),
};
