"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Plus, MapPin } from "lucide-react";
import { orderApi, addressApi } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Address } from "@/types";
import { formatPrice, getApiError } from "@/lib/utils";
import Cookies from "js-cookie";

const addressSchema = z.object({
  label: z.string().default("Home"),
  full_name: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6),
  country: z.string().default("India"),
});
type AddressForm = z.infer<typeof addressSchema>;

const PAYMENT_METHODS = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Credit / Debit Card" },
  { value: "netbanking", label: "Net Banking" },
];

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const couponCode = params.get("coupon") || Cookies.get("affiliate_coupon") || "";
  const { cart, fetchCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    fetchCart();
    loadAddresses();
    if (couponCode) validateCoupon();
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const { data } = await addressApi.list();
      setAddresses(data);
      const def = data.find((a: Address) => a.is_default);
      if (def) setSelectedAddressId(def.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
      else setShowNewAddress(true);
    } catch {}
  };

  const validateCoupon = async () => {
    if (!couponCode || !cart) return;
    try {
      const { data } = await orderApi.validateCoupon({
        code: couponCode,
        order_amount: cart.subtotal,
      });
      if (data.valid) setCouponDiscount(data.discount_amount);
    } catch {}
  };

  const onAddressSubmit = async (data: AddressForm) => {
    try {
      const { data: newAddr } = await addressApi.create(data);
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setShowNewAddress(false);
      toast.success("Address saved!");
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { toast.error("Please select a delivery address"); return; }
    if (!cart || cart.items.length === 0) { toast.error("Your cart is empty"); return; }

    setIsPlacing(true);
    try {
      const { data: order } = await orderApi.create({
        address_id: selectedAddressId,
        coupon_code: couponCode || undefined,
        payment_method: paymentMethod,
      });
      // Clear affiliate coupon cookie after successful use — prevents it
      // from silently applying to every future order the customer places.
      Cookies.remove("affiliate_coupon");
      toast.success("Order placed successfully!");
      router.push(`/customer/orders/${order.id}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsPlacing(false);
    }
  };

  if (!cart) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gold-500" size={32} /></div>;

  const subtotal = cart.subtotal;
  const shipping = subtotal >= 2999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal - couponDiscount + shipping + tax;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-8">
        <span className="section-tag">FINAL STEP</span>
        <h1 className="section-title">Checkout</h1>
        <div className="divider-gold mx-0 mt-4" />
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Delivery address */}
          <div>
            <h2 className="font-cinzel text-sm tracking-widest text-brown mb-4 flex items-center gap-2">
              <MapPin size={14} className="text-gold-500" /> DELIVERY ADDRESS
            </h2>

            {addresses.length > 0 && (
              <div className="space-y-3 mb-4">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`flex gap-3 card p-4 cursor-pointer transition-all
                    ${selectedAddressId === addr.id ? "border-gold-500 bg-gold-50" : "hover:border-gold-300"}`}>
                    <input type="radio" name="address" value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-gold-500" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-cinzel text-xs tracking-wide bg-deep text-gold-400 px-2 py-0.5">
                          {addr.label}
                        </span>
                        {addr.is_default && (
                          <span className="font-cinzel text-xs text-gold-600">DEFAULT</span>
                        )}
                      </div>
                      <p className="font-garamond text-sm text-brown font-medium">{addr.full_name}</p>
                      <p className="font-garamond text-sm text-muted">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="font-garamond text-sm text-muted">📞 {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button onClick={() => setShowNewAddress(!showNewAddress)}
              className="flex items-center gap-2 font-cinzel text-xs tracking-wide text-gold-600 hover:text-gold-500 transition-colors">
              <Plus size={12} /> ADD NEW ADDRESS
            </button>

            {showNewAddress && (
              <form onSubmit={handleSubmit(onAddressSubmit)} className="card p-6 mt-4 space-y-4 animate-fade-up">
                <h3 className="font-cinzel text-xs tracking-widest text-brown">NEW ADDRESS</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">FULL NAME</label>
                    <input {...register("full_name")} className="input-field" />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PHONE</label>
                    <input {...register("phone")} className="input-field" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">ADDRESS LINE 1</label>
                    <input {...register("line1")} className="input-field" placeholder="House/Flat, Street" />
                  </div>
                  <div className="col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">ADDRESS LINE 2</label>
                    <input {...register("line2")} className="input-field" placeholder="Area, Landmark (optional)" />
                  </div>
                  <div>
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">CITY</label>
                    <input {...register("city")} className="input-field" />
                  </div>
                  <div>
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">STATE</label>
                    <input {...register("state")} className="input-field" />
                  </div>
                  <div>
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PINCODE</label>
                    <input {...register("pincode")} className="input-field" maxLength={6} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary px-6 py-2">SAVE ADDRESS</button>
                  <button type="button" onClick={() => setShowNewAddress(false)} className="btn-ghost">Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* Payment method */}
          <div>
            <h2 className="font-cinzel text-sm tracking-widest text-brown mb-4">PAYMENT METHOD</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((pm) => (
                <label key={pm.value} className={`flex items-center gap-3 card p-4 cursor-pointer transition-all
                  ${paymentMethod === pm.value ? "border-gold-500 bg-gold-50" : "hover:border-gold-300"}`}>
                  <input type="radio" name="payment" value={pm.value}
                    checked={paymentMethod === pm.value}
                    onChange={() => setPaymentMethod(pm.value)}
                    className="accent-gold-500" />
                  <span className="font-garamond text-sm text-brown">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-cinzel text-sm tracking-widest text-brown mb-4">ORDER SUMMARY</h2>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm gap-2">
                  <span className="font-garamond text-muted truncate">{item.product.name} × {item.quantity}</span>
                  <span className="font-garamond text-brown flex-shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-gold-100 pt-4 mb-4">
              <div className="flex justify-between font-garamond text-sm">
                <span className="text-muted">Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between font-garamond text-sm text-green-600">
                  <span>Coupon ({couponCode})</span><span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-garamond text-sm">
                <span className="text-muted">Shipping</span>
                <span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-garamond text-sm">
                <span className="text-muted">GST (18%)</span><span>{formatPrice(tax)}</span>
              </div>
            </div>

            <div className="flex justify-between font-cinzel text-sm border-t-2 border-gold-300 pt-3 mb-6">
              <span>TOTAL</span>
              <span className="text-base">{formatPrice(total)}</span>
            </div>

            <button onClick={handlePlaceOrder} disabled={isPlacing || !selectedAddressId}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {isPlacing && <Loader2 size={14} className="animate-spin" />}
              {isPlacing ? "PLACING ORDER..." : "PLACE ORDER"}
            </button>

            <p className="font-garamond text-xs text-muted text-center mt-3">
              🔒 Secured with 256-bit SSL encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gold-500" size={32} /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
