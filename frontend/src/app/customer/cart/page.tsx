"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, Plus, Minus, Loader2, ArrowRight, ChevronLeft, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { orderApi } from "@/lib/api";
import { formatPrice, getProductImage, getApiError } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { cart, fetchCart, removeItem, addItem, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    try {
      const { data } = await orderApi.validateCoupon({
        code: couponCode.trim(),
        order_amount: cart?.subtotal || 0,
      });
      if (data.valid) {
        setCouponDiscount(data.discount_amount);
        setCouponMsg(data.message);
        toast.success(data.message);
      } else {
        setCouponDiscount(0);
        setCouponMsg(data.message);
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => { setCouponCode(""); setCouponDiscount(0); setCouponMsg(""); };

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#0D2619]" size={32} />
      </div>
    );
  }

  // Not authenticated — prompt login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] text-[#1C2E24] font-garamond">
        <div className="md:hidden sticky top-0 z-40 bg-[#FAF8F3] border-b border-[#E5E0D5] shadow-xs">
          <div className="flex items-center justify-between px-4 py-3.5">
            <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F0ECE5] transition-colors" aria-label="Go back">
              <ChevronLeft size={22} className="text-[#1C2E24]" />
            </button>
            <h1 className="font-cormorant text-[20px] font-bold tracking-wide text-[#1C2E24]">My Cart</h1>
            <div className="w-9 h-9" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-5">
          <div className="w-20 h-20 bg-white border border-[#E5E0D5] rounded-full flex items-center justify-center text-[#8C9890] shadow-xs">
            <ShoppingBag size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Sign In to View Cart</h2>
            <p className="text-xs text-[#8C9890]">Please log in to view your shopping cart and saved items.</p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-7 py-3 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const itemsList = cart?.items || [];

  const handleQtyChange = (product_id: number, delta: number) => {
    if (delta < 0) {
      removeItem(product_id);
    } else {
      addItem(product_id, 1);
    }
  };

  const handleRemoveItem = (product_id: number) => {
    removeItem(product_id);
    toast.success("Item removed from cart");
  };

  // Subtotal & calculation
  const totalItemsCount = itemsList.reduce((acc, i) => acc + i.quantity, 0);
  const rawSubtotal = itemsList.reduce((acc, i) => acc + (i.product?.price || 0) * i.quantity, 0);
  const discountAmount = couponDiscount;
  const deliveryCharges = rawSubtotal >= 999 ? 0 : (rawSubtotal > 0 ? 99 : 0);
  const finalTotalAmount = Math.max(0, rawSubtotal - discountAmount + deliveryCharges);

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C2E24] font-garamond">

      {/* ══════════════════════════════════════════════
          MOBILE HEADER (<  My Cart  ⋮)
         ══════════════════════════════════════════════ */}
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
            My Cart
          </h1>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F0ECE5] transition-colors"
            aria-label="More options"
          >
            <MoreVertical size={20} className="text-[#1C2E24]" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP HEADER
         ══════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 pt-6 pb-2">
        <div className="border-b border-[#F0ECE1] pb-3 mb-4">
          <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">Your Shopping Bag</h1>
          <p className="text-xs text-[#8C9890] mt-0.5">{totalItemsCount} items • Review and proceed to checkout</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {itemsList.length === 0 ? (
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 bg-[#FAF8F3] rounded-full flex items-center justify-center mx-auto text-[#8C9890]">
              <ShoppingBag size={28} />
            </div>
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Your Cart is Empty</h2>
            <p className="text-xs text-[#8C9890]">Explore our handloom sarees and luxury jewellery to add items.</p>
            <Link
              href="/customer/products"
              className="inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span>EXPLORE CATALOG</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════
                MOBILE VIEW — Exact match to design screenshot
               ══════════════════════════════════════════════ */}
            <div className="md:hidden space-y-4">
              {/* 1. Items List Card */}
              <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl shadow-xs overflow-hidden divide-y divide-[#F2EFE9]">
                {itemsList.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center gap-3.5">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FAF8F3] border border-[#EAE6DD] flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProductImage(item.product.images)}
                        alt={item.product.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-garamond text-[15px] font-bold text-[#1C2E24] truncate">
                        {item.product.name}
                      </h3>
                      <p className="font-garamond text-base font-bold text-[#1C2E24]">
                        ₹{item.product.price.toLocaleString("en-IN")}
                      </p>

                      {/* Quantity Selector Box */}
                      <div className="inline-flex items-center border border-[#E0DBD0] rounded-lg overflow-hidden bg-white mt-1.5">
                        <button
                          onClick={() => handleQtyChange(item.product_id, -1)}
                          className="px-2.5 py-0.5 text-[#1C2E24] hover:bg-[#F5F2EA] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-3 py-0.5 font-garamond text-xs font-bold text-[#1C2E24] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQtyChange(item.product_id, 1)}
                          className="px-2.5 py-0.5 text-[#1C2E24] hover:bg-[#F5F2EA] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Right Delete Icon */}
                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="w-8 h-8 flex items-center justify-center text-[#8C8273] hover:text-red-600 transition-colors flex-shrink-0"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* 2. Price Details Card */}
              <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl p-4 shadow-xs space-y-2.5 font-garamond">
                <h3 className="font-garamond font-bold text-sm text-[#1C2E24] border-b border-[#F2EFE9] pb-2">
                  Price Details
                </h3>

                <div className="flex justify-between text-xs text-[#556B5D]">
                  <span>Total Items ({totalItemsCount})</span>
                  <span className="font-bold text-[#1C2E24]">₹{rawSubtotal.toLocaleString("en-IN")}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-[#556B5D]">
                    <span>Coupon Discount</span>
                    <span className="font-bold text-[#2E7D32]">- ₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-[#556B5D]">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-[#2E7D32]">
                    {deliveryCharges === 0 ? "FREE" : `₹${deliveryCharges}`}
                  </span>
                </div>

                <div className="border-t border-[#F2EFE9] pt-2.5 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#1C2E24]">Total Amount</span>
                  <span className="font-garamond text-lg font-bold text-[#1C2E24]">
                    ₹{finalTotalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* 3. Proceed to Checkout Button */}
              <Link
                href="/customer/payments"
                className="w-full bg-[#0D2619] hover:bg-[#19402B] active:scale-[0.99] text-white py-3.5 rounded-xl font-garamond font-bold text-sm text-center block transition-all shadow-sm"
              >
                Proceed to Checkout
              </Link>
            </div>

            {/* ══════════════════════════════════════════════
                DESKTOP VIEW — Grid layout with items + summary
               ══════════════════════════════════════════════ */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Items */}
              <div className="lg:col-span-2 space-y-3">
                {itemsList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProductImage(item.product.images)}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-[#E5E0D5] bg-[#FAF8F3]"
                      />
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-md uppercase inline-block">
                          {item.product.category?.name || "Handloom"}
                        </span>
                        <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">
                          {item.product.name}
                        </h3>
                        <p className="text-xs font-bold text-[#1C2E24]">
                          {formatPrice(item.product.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-[#E5E0D5] rounded-xl bg-[#FAF8F3]">
                        <button
                          onClick={() => handleQtyChange(item.product_id, -1)}
                          className="px-2.5 py-1 text-[#1C2E24] hover:bg-[#E5E0D5]/50 rounded-l-xl"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-[#1C2E24]">{item.quantity}</span>
                        <button
                          onClick={() => handleQtyChange(item.product_id, 1)}
                          className="px-2.5 py-1 text-[#1C2E24] hover:bg-[#E5E0D5]/50 rounded-r-xl"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="text-red-600 hover:text-red-800 p-2 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Order Summary */}
              <div className="space-y-6">
                <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-4 font-garamond">
                  <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">
                    Order Summary
                  </h2>

                  {/* Coupon Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#1C2E24] block">Promo Code / Voucher</label>
                    {couponDiscount > 0 ? (
                      <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl flex items-center justify-between text-xs text-[#2E7D32]">
                        <div>
                          <span className="font-bold block uppercase">{couponCode}</span>
                          <span className="text-[11px]">{couponMsg || "Discount Applied"}</span>
                        </div>
                        <button onClick={removeCoupon} className="text-red-600 font-bold hover:underline">Remove</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="ENTER COUPON CODE"
                          className="flex-1 bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs font-bold text-[#1C2E24] uppercase focus:outline-none focus:border-[#0D2619]"
                        />
                        <button
                          onClick={handleValidateCoupon}
                          disabled={isValidating || !couponCode.trim()}
                          className="bg-[#0D2619] hover:bg-[#19402B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isValidating ? <Loader2 size={12} className="animate-spin" /> : "APPLY"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-2.5 text-xs text-[#556B5D] pt-2 border-t border-[#F0ECE1]">
                    <div className="flex justify-between">
                      <span>Total Items ({totalItemsCount})</span>
                      <span className="font-bold text-[#1C2E24]">{formatPrice(rawSubtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#2E7D32]">
                        <span>Coupon Discount</span>
                        <span className="font-bold">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span className="font-bold text-[#2E7D32]">{deliveryCharges === 0 ? "FREE" : formatPrice(deliveryCharges)}</span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-[#1C2E24] border-t border-[#F0ECE1] pt-3">
                      <span>Total Amount</span>
                      <span className="font-cormorant text-xl text-[#0D2619] font-extrabold">{formatPrice(finalTotalAmount)}</span>
                    </div>
                  </div>

                  <Link
                    href="/customer/payments"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs block text-center"
                  >
                    <span>PROCEED TO CHECKOUT</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
