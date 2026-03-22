from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re
from app.models.models import UserRole, OrderStatus, PaymentStatus, CommissionStatus


# ─── Base ─────────────────────────────────────────────────────────────────────

class BaseResponse(BaseModel):
    model_config = {"from_attributes": True}


# ─── Auth ─────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.customer

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: str = "email_verification"


class OTPResendRequest(BaseModel):
    email: EmailStr
    purpose: str = "email_verification"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    is_first_login: bool = False
    requires_otp: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


# ─── User ─────────────────────────────────────────────────────────────────────

class UserBase(BaseResponse):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    account_number: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str]
    created_at: datetime


class UserPublic(BaseResponse):
    id: int
    full_name: str
    email: str
    role: UserRole
    account_number: str
    is_verified: bool
    avatar_url: Optional[str]


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


# ─── Address ──────────────────────────────────────────────────────────────────

class AddressCreate(BaseModel):
    label: str = "Home"
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: str = "India"
    is_default: bool = False


class AddressResponse(BaseResponse):
    id: int
    label: str
    full_name: str
    phone: str
    line1: str
    line2: Optional[str]
    city: str
    state: str
    pincode: str
    country: str
    is_default: bool


# ─── Merchant ─────────────────────────────────────────────────────────────────

class MerchantProfileCreate(BaseModel):
    business_name: str
    business_description: Optional[str] = None
    gstin: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None


class MerchantProfileResponse(BaseResponse):
    id: int
    user_id: int
    business_name: str
    business_description: Optional[str]
    gstin: Optional[str]
    commission_rate: float
    is_approved: bool
    logo_url: Optional[str]
    created_at: datetime


# ─── Product ──────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    stock_quantity: int = 0
    low_stock_threshold: int = 5
    weight_grams: Optional[float] = None
    images: List[str] = []
    tags: List[str] = []
    attributes: dict = {}
    category_id: Optional[int] = None
    is_active: bool = True
    is_featured: bool = False

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    images: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    attributes: Optional[dict] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class CategoryInfo(BaseResponse):
    id: int
    name: str
    slug: str


class ProductResponse(BaseResponse):
    id: int
    name: str
    slug: str
    description: Optional[str]
    short_description: Optional[str]
    price: float
    compare_price: Optional[float]
    sku: Optional[str]
    stock_quantity: int
    images: Optional[List[str]]
    tags: Optional[List[str]]
    attributes: Optional[dict]
    is_active: bool
    is_featured: bool
    rating_avg: float
    rating_count: int
    total_sold: int
    category: Optional[CategoryInfo]
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ─── Cart ─────────────────────────────────────────────────────────────────────

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v):
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class CartItemResponse(BaseResponse):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse


class CartResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
    item_count: int


# ─── Coupon ───────────────────────────────────────────────────────────────────

class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_amount: float = 200.0
    promoter_commission: float = 100.0
    platform_profit: float = 100.0
    promoter_id: Optional[int] = None
    min_order_amount: float = 0.0
    max_uses: Optional[int] = None
    valid_until: Optional[datetime] = None


class CouponValidate(BaseModel):
    code: str
    order_amount: float


class CouponResponse(BaseResponse):
    id: int
    code: str
    description: Optional[str]
    discount_amount: float
    promoter_commission: float
    platform_profit: float
    min_order_amount: float
    max_uses: Optional[int]
    used_count: int
    is_active: bool
    valid_from: datetime
    valid_until: Optional[datetime]


class CouponValidateResponse(BaseModel):
    valid: bool
    discount_amount: float
    message: str


# ─── Order ────────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    address_id: int
    coupon_code: Optional[str] = None
    payment_method: str = "cod"
    notes: Optional[str] = None


class OrderItemResponse(BaseResponse):
    id: int
    product_id: int
    product_name: str
    product_image: Optional[str]
    quantity: int
    unit_price: float
    total_price: float


class OrderResponse(BaseResponse):
    id: int
    order_number: str
    subtotal: float
    discount_amount: float
    shipping_amount: float
    tax_amount: float
    total_amount: float
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: Optional[str]
    tracking_number: Optional[str]
    notes: Optional[str]
    status_history: Optional[List[Any]]
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime
    delivered_at: Optional[datetime]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    tracking_number: Optional[str] = None
    notes: Optional[str] = None


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ─── Commission ───────────────────────────────────────────────────────────────

class CommissionResponse(BaseResponse):
    id: int
    order_id: int
    coupon_id: int
    promoter_id: int
    amount: float
    status: CommissionStatus
    notes: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime


# ─── Admin ────────────────────────────────────────────────────────────────────

class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    role: Optional[UserRole] = None


class MerchantApproval(BaseModel):
    is_approved: bool
    commission_rate: Optional[float] = None


# ─── Support ──────────────────────────────────────────────────────────────────

class SupportLookupRequest(BaseModel):
    account_number: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None


class ImpersonateRequest(BaseModel):
    target_user_id: int
    reason: str


class ImpersonateResponse(BaseModel):
    impersonation_token: str
    target_user: UserPublic
    audit_log_id: int
    expires_in_seconds: int = 7200


# ─── Analytics ────────────────────────────────────────────────────────────────

class SalesAnalytics(BaseModel):
    total_revenue: float
    total_orders: int
    total_products: int
    avg_order_value: float
    orders_by_status: dict
    revenue_by_day: List[dict]
    top_products: List[dict]


class AdminDashboard(BaseModel):
    total_users: int
    total_merchants: int
    total_orders: int
    total_revenue: float
    pending_orders: int
    active_coupons: int
    recent_orders: List[OrderResponse]
