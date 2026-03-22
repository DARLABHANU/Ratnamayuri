"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, Plus, Minus, Tag, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { orderApi } from "@/lib/api";
import { formatPrice, getProductImage, getApiError } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { cart, fetchCart, removeItem, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
    else router.push("/auth/login");
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

  if (!isAuthenticated) return null;

  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 2999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal - couponDiscount + shipping + tax;

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-8">
        <span className="section-tag">YOUR BAG</span>
        <h1 className="section-title">Shopping <em className="italic">Cart</em></h1>
        <div className="divider-gold mx-0 mt-4" />
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="text-gold-300 mx-auto mb-4" />
          <h2 className="font-cormorant text-2xl text-brown mb-2">Your bag is empty</h2>
          <p className="font-garamond text-muted mb-6">Discover our exquisite collection</p>
          <Link href="/customer/products" className="btn-primary">CONTINUE SHOPPING</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="card p-4 flex gap-4">
                <Link href={`/customer/products/${item.product_id}`}
                  className="w-24 h-28 flex-shrink-0 overflow-hidden bg-ivory">
                  <img src={getProductImage(item.product.images)}
                    alt={item.product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = getProductImage([]); }} />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      {item.product.category && (
                        <p className="font-cinzel text-xs tracking-widest text-gold-500 mb-0.5">
                          {item.product.category.name}
                        </p>
                      )}
                      <h3 className="font-cormorant text-lg font-medium text-brown leading-tight">
                        {item.product.name}
                      </h3>
                    </div>
                    <button onClick={() => removeItem(item.id)}
                      className="text-muted hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gold-200">
                      <button onClick={() => item.quantity > 1
                        ? useCartStore.getState().addItem(item.product_id, item.quantity - 1)
                        : removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-muted hover:text-brown">
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-cinzel text-xs text-brown">{item.quantity}</span>
                      <button onClick={() => useCartStore.getState().addItem(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock_quantity}
                        className="w-8 h-8 flex items-center justify-center text-muted hover:text-brown disabled:opacity-40">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-cinzel text-sm text-brown">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <Link href="/customer/products"
              className="font-cinzel text-xs tracking-widest text-gold-600 hover:text-gold-500 transition-colors flex items-center gap-1 mt-4">
              ← CONTINUE SHOPPING
            </Link>
          </div>

          {/* Summary */}
          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="font-cinzel text-sm tracking-widest text-brown mb-6">ORDER SUMMARY</h2>

              {/* Coupon */}
              <div className="mb-6">
                <label className="font-cinzel text-xs tracking-widest text-muted block mb-2">
                  COUPON CODE
                </label>
                {couponDiscount > 0 ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-green-600" />
                      <span className="font-cinzel text-xs text-green-700">{couponCode.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-cinzel text-xs text-green-700">-{formatPrice(couponDiscount)}</span>
                      <button onClick={removeCoupon} className="text-muted hover:text-red-500">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter code" className="input-field flex-1 py-2 text-sm" />
                    <button onClick={handleValidateCoupon} disabled={isValidating || !couponCode}
                      className="btn-outline px-3 py-2 text-xs disabled:opacity-40">
                      {isValidating ? <Loader2 size={12} className="animate-spin" /> : "APPLY"}
                    </button>
                  </div>
                )}
                {couponMsg && !couponDiscount && (
                  <p className="font-garamond text-xs text-red-500 mt-1">{couponMsg}</p>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-3 border-t border-gold-100 pt-4 mb-4">
                <div className="flex justify-between font-garamond text-sm">
                  <span className="text-muted">Subtotal ({cart.item_count} items)</span>
                  <span className="text-brown">{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between font-garamond text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-garamond text-sm">
                  <span className="text-muted">Shipping</span>
                  <span className={shipping === 0 ? "text-green-600" : "text-brown"}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-garamond text-sm">
                  <span className="text-muted">GST (18%)</span>
                  <span className="text-brown">{formatPrice(tax)}</span>
                </div>
              </div>

              <div className="flex justify-between font-cinzel text-sm border-t-2 border-gold-300 pt-4 mb-6">
                <span className="text-brown">TOTAL</span>
                <span className="text-brown text-base">{formatPrice(total)}</span>
              </div>

              {shipping > 0 && (
                <p className="font-garamond text-xs text-muted mb-4 text-center">
                  Add {formatPrice(2999 - subtotal)} more for FREE shipping
                </p>
              )}

              <Link href={`/customer/orders/checkout?coupon=${encodeURIComponent(couponCode)}`}
                className="btn-primary w-full flex items-center justify-center gap-2">
                PROCEED TO CHECKOUT <ArrowRight size={14} />
              </Link>

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {["🔒 Secure Payment", "🚚 Fast Delivery", "🔄 Easy Returns", "🏆 Genuine Products"].map((t) => (
                  <p key={t} className="font-garamond text-xs text-muted text-center">{t}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
