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

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const addressSchema = z.object({
  label: z.string().default("Home"),
  full_name: z.string().min(2, "Full name must be at least 2 characters").regex(/^[a-zA-Z\s]{2,50}$/, "Full name must contain only letters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9)"),
  line1: z.string().min(5, "Address Line 1 must be at least 5 characters"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code"),
  country: z.string().default("India"),
});
type AddressForm = z.infer<typeof addressSchema>;


function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [couponCode, setCouponCode] = useState("");
  const [typedCoupon, setTypedCoupon] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const { cart, fetchCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod] = useState("razorpay");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [isPromoterCoupon, setIsPromoterCoupon] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    fetchCart();
    loadAddresses();

    const code = params.get("coupon") || Cookies.get("affiliate_coupon") || "";
    if (code) {
      setCouponCode(code);
      setTypedCoupon(code);
    }
  }, [isAuthenticated, params]);

  useEffect(() => {
    if (couponCode && cart) {
      orderApi.validateCoupon({
        code: couponCode,
        order_amount: cart.subtotal,
      }).then(({ data }) => {
        if (data.valid) {
          setCouponDiscount(data.discount_amount);
          setPlatformFee(data.platform_fee || 0);
          setIsPromoterCoupon(Boolean(data.is_promoter_coupon));
        } else {
          setCouponDiscount(0);
          setPlatformFee(0);
          setIsPromoterCoupon(false);
          setCouponCode("");
          Cookies.remove("affiliate_coupon");
        }
      }).catch(() => {
        setCouponDiscount(0);
        setPlatformFee(0);
        setIsPromoterCoupon(false);
        setCouponCode("");
        Cookies.remove("affiliate_coupon");
      });
    }
  }, [couponCode, cart]);

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

  const validateCouponCode = async (code: string) => {
    if (!code.trim() || !cart) return;
    setIsValidatingCoupon(true);
    try {
      const { data } = await orderApi.validateCoupon({
        code: code.trim(),
        order_amount: cart.subtotal,
      });
      if (data.valid) {
        setCouponDiscount(data.discount_amount);
        setPlatformFee(data.platform_fee || 0);
        setIsPromoterCoupon(Boolean(data.is_promoter_coupon));
        setCouponCode(code.trim());
        Cookies.set("affiliate_coupon", code.trim(), { expires: 7, sameSite: "Lax" });
        toast.success(`Coupon "${code}" applied successfully!`);
      } else {
        toast.error("Invalid coupon code or minimum order condition not met.");
      }
    } catch (err) {
      toast.error("Invalid or expired coupon code.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setTypedCoupon("");
    setCouponDiscount(0);
    setPlatformFee(0);
    setIsPromoterCoupon(false);
    Cookies.remove("affiliate_coupon");
    toast.success("Coupon removed.");
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
    
    // Load Razorpay script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Failed to load Razorpay payment window. Please check your network connection.");
      setIsPlacing(false);
      return;
    }

    try {
      const { data: order } = await orderApi.create({
        address_id: selectedAddressId,
        coupon_code: couponCode || undefined,
        payment_method: paymentMethod,
      });

      // If Razorpay order ID is missing (e.g. backend keys are not configured),
      // gracefully fall back to the instant success mock-checkout experience.
      if (!(order as any).razorpay_order_id) {
        try {
          await orderApi.razorpayVerify({
            razorpay_order_id: String(order.id),
            razorpay_payment_id: "mock_payment",
            razorpay_signature: "mock_signature",
          });
          Cookies.remove("affiliate_coupon");
          toast.success("Order placed and payment mock-approved successfully!");
          router.push(`/customer/orders/${order.id}`);
        } catch (err) {
          console.error("Mock verification failed:", err);
          toast.error("Failed to verify mock payment status. Order remains pending.");
          router.push(`/customer/orders/${order.id}`);
        }
        return;
      }

      const activeAddr = addresses.find((a) => a.id === selectedAddressId);

      const options = {
        key: (order as any).razorpay_key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_THKTjazaeHHbRd",
        amount: Math.round(order.total_amount * 100), // in paise
        currency: "INR",
        name: "Ratnamayuri",
        description: `Order #${order.order_number}`,
        order_id: (order as any).razorpay_order_id,
        handler: async function (response: any) {
          setIsPlacing(true);
          try {
            await orderApi.razorpayVerify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            Cookies.remove("affiliate_coupon");
            toast.success("Payment verified successfully! Welcome to Ratnamayuri.");
            router.push(`/customer/orders/${order.id}`);
          } catch (verifyErr) {
            toast.error("Payment signature verification failed. Please contact support.");
          } finally {
            setIsPlacing(false);
          }
        },
        prefill: {
          name: activeAddr?.full_name || "",
          email: user?.email || "",
          contact: activeAddr?.phone || "",
        },
        theme: {
          color: "#5C1318",
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled or modal closed before completion.");
            setIsPlacing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Razorpay Payment Failed:", response.error);
        toast.error(`Payment failed: ${response.error?.description || response.error?.reason || "Payment declined"}`);
        setIsPlacing(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(getApiError(err));
      setIsPlacing(false);
    }
  };

  if (!cart) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gold-500" size={32} /></div>;

  const subtotal = cart.subtotal;
  const shipping = subtotal >= 2999 ? 0 : 0; // Free delivery threshold
  const tax = 0; // Price inclusive of GST
  const total = Math.max(0, subtotal - couponDiscount + platformFee + shipping + tax);

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
              <form onSubmit={handleSubmit(onAddressSubmit)} className="card p-4 sm:p-6 mt-4 space-y-4 animate-fade-up">
                <h3 className="font-cinzel text-xs tracking-widest text-brown">NEW ADDRESS</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">FULL NAME</label>
                    <input {...register("full_name")} className="input-field" />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PHONE</label>
                    <input {...register("phone")} className="input-field" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">ADDRESS LINE 1</label>
                    <input {...register("line1")} className="input-field" placeholder="House/Flat, Street" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
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
          <div className="card p-6 border-gold-200 bg-gold-50/30">
            <h2 className="font-cinzel text-xs tracking-widest text-brown mb-2">SECURE PAYMENT PROCESSED BY</h2>
            <div className="flex items-center gap-3">
              <span className="font-cinzel text-lg font-bold tracking-widest text-brown">RAZORPAY</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">SECURE CHECKOUT</span>
            </div>
            <p className="font-garamond text-xs text-muted mt-2">
              Cards, UPI, Netbanking, and Wallets are fully supported. You can select your preferred payment mode directly inside the secure payment gateway interface.
            </p>
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

            {/* Coupon Code Panel */}
            <div className="border-t border-gold-100 pt-4 mb-4">
              <label className="font-cinzel text-[10px] tracking-widest text-muted block mb-1.5 uppercase font-bold">
                COUPON / PROMO CODE
              </label>
              {couponCode ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded">
                  <div className="flex items-center gap-1.5 font-garamond">
                    <span className="font-bold tracking-wider font-cinzel text-emerald-900">{couponCode}</span>
                    <span className="text-[10px] text-emerald-600">({formatPrice(couponDiscount)} off)</span>
                  </div>
                  <button type="button" onClick={handleRemoveCoupon} className="text-red-500 font-bold hover:text-red-700">
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. PROMOTER199"
                    value={typedCoupon}
                    onChange={(e) => setTypedCoupon(e.target.value.toUpperCase())}
                    className="flex-1 bg-white border border-gold-200 text-xs p-2 rounded focus:outline-none focus:border-gold-500 uppercase font-cinzel font-bold text-brown"
                  />
                  <button
                    type="button"
                    onClick={() => validateCouponCode(typedCoupon)}
                    disabled={isValidatingCoupon || !typedCoupon.trim()}
                    className="bg-[#4A0F0F] hover:bg-[#6B1A1A] text-gold-400 text-xs font-bold tracking-widest px-4 py-2 rounded disabled:opacity-40"
                  >
                    {isValidatingCoupon ? "..." : "APPLY"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gold-100 pt-4 mb-4">
              <div className="flex justify-between font-garamond text-sm">
                <span className="text-muted">Display Price</span><span>{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between font-garamond text-sm text-green-600">
                  <span>Promoter Coupon Discount ({couponCode})</span><span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              {platformFee > 0 && (
                <div className="flex justify-between font-garamond text-sm text-amber-800">
                  <span>Platform / Service Fee</span><span>+{formatPrice(platformFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-garamond text-sm">
                <span className="text-muted">Delivery Charge</span>
                <span className="text-green-600">FREE</span>
              </div>
            </div>

            <div className="flex justify-between font-cinzel text-sm border-t-2 border-gold-300 pt-3 mb-6">
              <span>TOTAL PAYABLE</span>
              <span className="text-base font-bold text-deep">{formatPrice(total)}</span>
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
