"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Star, Heart, ArrowRight, ShieldCheck, Truck,
  RefreshCw, Banknote, Headphones, MapPin, ChevronDown, Tag,
} from "lucide-react";
import { productApi } from "@/lib/api";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { getProductImage } from "@/lib/utils";

export default function HomePage() {
  useRouter(); // keep for future use
  const { wishlistIds, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);

  useEffect(() => {
    productApi.list({ page_size: 8 })
      .then((res) => setProducts(res.data.items || []))
      .catch(() => {});
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    toast.success("Thank you for subscribing to Ratnamayuri newsletter!");
    setNewsletterEmail("");
  };

  const handleApplyCoupon = () => {
    if (appliedCoupon) { toast.error("Coupon already applied!"); return; }
    setAppliedCoupon(true);
    toast.success("Coupon RATNA10 applied! 10% discount activated.");
  };

  // Demo products (used when DB is empty/loading)
  const demoTrending = [
    { id: 1, name: "Gold Plated Chain", rating: 4.8, reviews: 128, price: 699, originalPrice: 999, discount: "30% OFF", img: "/design/prod_chain.png" },
    { id: 2, name: "Classic Bangles Set", rating: 4.7, reviews: 97, price: 499, originalPrice: 699, discount: "28% OFF", img: "/design/prod_bangles.png" },
    { id: 3, name: "Silk Saree (Pink)", rating: 4.9, reviews: 156, price: 1299, originalPrice: 1999, discount: "35% OFF", img: "/design/prod_saree.png" },
    { id: 4, name: "Floral Anarkali Dress", rating: 4.7, reviews: 88, price: 1499, originalPrice: 1999, discount: "25% OFF", img: "/design/prod_dress.png" },
  ];

  const displayProducts = products.length >= 4
    ? products.slice(0, 4).map((p, idx) => ({
        id: p.id,
        name: p.name,
        rating: 4.7 + (idx % 3) * 0.1,
        reviews: 80 + idx * 25,
        price: p.price,
        originalPrice: p.price + 300,
        discount: `${Math.round((300 / (p.price + 300)) * 100)}% OFF`,
        img: getProductImage(p.images),
      }))
    : demoTrending;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C2E24] font-garamond">
      <Navbar />

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  MOBILE HOME SCREEN — exact design match                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden bg-[#FAF8F3]">

        {/* ── Delivery Location Row ── */}
        <div className="bg-white border-b border-[#F0ECE1] px-4 py-2.5">
          <button className="flex items-center gap-2 text-xs font-garamond w-full text-left">
            <MapPin size={14} className="text-[#1E3A2B] flex-shrink-0" />
            <span className="text-[#556B5D]">Deliver to:</span>
            <span className="font-bold text-[#1C2E24]">Guntur, Andhra Pradesh</span>
            <ChevronDown size={13} className="text-[#556B5D] ml-auto flex-shrink-0" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">

          {/* ── Hero Banner ── */}
          <section
            className="rounded-2xl overflow-hidden relative flex items-center min-h-[175px]"
            style={{ background: "linear-gradient(135deg, #EDE8DC 0%, #E8E0CE 100%)" }}
          >
            {/* Left Text */}
            <div className="flex-1 p-5 space-y-2 z-10 self-center">
              <h1 className="font-cormorant text-[28px] font-bold leading-[1.1] text-[#1C2E24]">
                Timeless<br />Handmade<br />Beauty
              </h1>
              <p className="font-garamond text-[11px] text-[#556B5D] leading-snug">Made for You, With Love.</p>
              <Link
                href="/customer/products"
                className="inline-block bg-[#1E3A2B] hover:bg-[#2A4D3B] text-white text-[11px] font-bold font-garamond tracking-wider px-5 py-2.5 rounded-xl mt-1.5 transition-all shadow-sm"
              >
                SHOP NOW
              </Link>
            </div>

            {/* Right Image */}
            <div className="w-[155px] h-[175px] flex-shrink-0 self-end overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/cat_jewellery.png"
                alt="Handmade Jewellery"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </section>

          {/* ── Trust Badges (3 col) ── */}
          <div className="grid grid-cols-3 gap-1 py-1">
            {[
              { icon: <Truck size={17} />, label: "Free Delivery", sub: "On orders above ₹999" },
              { icon: <Heart size={17} />, label: "Handmade", sub: "Unique & Exclusive" },
              { icon: <ShieldCheck size={17} />, label: "Secure Payment", sub: "100% Safe Checkout" },
            ].map((badge) => (
              <div key={badge.label} className="flex flex-col items-center text-center gap-1.5 px-1">
                <div className="w-9 h-9 rounded-full bg-[#F0EBE3] flex items-center justify-center text-[#1E3A2B]">
                  {badge.icon}
                </div>
                <span className="font-garamond text-[10px] font-bold text-[#1C2E24] leading-tight">{badge.label}</span>
                <span className="font-garamond text-[9px] text-[#7A6E5D] leading-tight">{badge.sub}</span>
              </div>
            ))}
          </div>

          {/* ── Shop by Category ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-cormorant text-[19px] font-bold text-[#1C2E24]">Shop by Category</h2>
              <Link
                href="/customer/products"
                className="text-xs text-[#556B5D] hover:text-[#1E3A2B] font-garamond font-semibold transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: "Jewellery", img: "/design/cat_jewellery.png", href: "/customer/products?category=jewellery" },
                { name: "Sarees", img: "/design/cat_sarees.png", href: "/customer/products?category=sarees" },
                { name: "Dresses", img: "/design/cat_dresses.png", href: "/customer/products?category=dresses" },
              ].map((cat) => (
                <Link key={cat.name} href={cat.href} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square rounded-full bg-[#F0EBE3] overflow-hidden border-2 border-[#E5E0D5] group-hover:border-[#1E3A2B] transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="font-garamond text-xs font-bold text-[#1C2E24] text-center">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Coupon Banner ── */}
          <section
            className="rounded-2xl overflow-hidden flex items-center justify-between p-5"
            style={{ background: "linear-gradient(135deg, #EDE8DC 0%, #E4DBCA 100%)" }}
          >
            <div className="space-y-1.5">
              <h3 className="font-cormorant text-[22px] font-bold text-[#1C2E24] leading-tight">Flat 10% OFF</h3>
              <p className="font-garamond text-[11px] text-[#556B5D]">Use Code: <span className="font-bold text-[#1C2E24]">RATNA10</span></p>
              <button
                onClick={handleApplyCoupon}
                className="inline-flex items-center gap-1.5 bg-[#1E3A2B] hover:bg-[#2A4D3B] text-white text-[11px] font-bold font-garamond tracking-wider px-5 py-2.5 rounded-xl mt-1 transition-all shadow-sm"
              >
                {appliedCoupon ? (
                  <><Tag size={12} /> APPLIED!</>
                ) : (
                  "APPLY COUPON"
                )}
              </button>
            </div>
            <div className="w-28 h-28 flex items-center justify-center text-7xl flex-shrink-0">
              🎁
            </div>
          </section>

          {/* ── Trending Now ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-cormorant text-[19px] font-bold text-[#1C2E24]">Trending Now</h2>
              <Link
                href="/customer/products"
                className="text-xs text-[#556B5D] hover:text-[#1E3A2B] font-garamond font-semibold transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {displayProducts.map((item) => {
                const isWished = wishlistIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E5E0D5] rounded-2xl overflow-hidden shadow-xs"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-[#F8F5EE]">
                      {/* Discount Badge */}
                      <span className="absolute top-2 left-2 bg-[#E07830] text-white font-garamond text-[9.5px] font-bold px-2 py-0.5 rounded-md z-10">
                        {item.discount}
                      </span>
                      {/* Wishlist Button */}
                      <button
                        onClick={() => toggleWishlist(item.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center z-10 shadow-xs"
                        aria-label="Toggle wishlist"
                      >
                        <Heart size={12} className={isWished ? "fill-red-500 text-red-500" : "text-[#8C8273]"} />
                      </button>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="p-2.5 space-y-1">
                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="font-garamond text-[9px] text-[#7A6E5D]">{item.rating.toFixed(1)}</span>
                      </div>
                      {/* Name */}
                      <h3 className="font-garamond text-[11.5px] font-bold text-[#1C2E24] line-clamp-1 leading-snug">
                        {item.name}
                      </h3>
                      {/* Price */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-garamond text-sm font-bold text-[#1C2E24]">₹{item.price.toLocaleString()}</span>
                        <span className="font-garamond text-[10px] text-[#8C8273] line-through">₹{item.originalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
      {/* ── END MOBILE ── */}


      {/* ══════════════════════════════════════════════════════════ */}
      {/*  DESKTOP HOME SCREEN                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <main className="hidden md:block max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-10">

        {/* ── 1. Hero Banner (full image from design) ── */}
        <section className="relative rounded-2xl overflow-hidden border border-[#E5E0D5] shadow-xs group bg-[#FAF8F3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/hero_full_banner.png"
            alt="Timeless Handmade Beauty - Ratnamayuri"
            className="w-full h-auto object-cover block"
          />
          <Link
            href="/customer/products"
            className="absolute left-[10.5%] top-[62%] w-[9%] h-[17%] rounded-full cursor-pointer z-20 hover:ring-2 hover:ring-[#1E3A2B]/40 transition-all"
            title="Shop Now"
            aria-label="Shop Now"
          />
          <button
            onClick={handleApplyCoupon}
            className="absolute left-[70%] top-[49.5%] w-[7.8%] h-[14.5%] rounded-full cursor-pointer z-20 hover:ring-2 hover:ring-[#1E3A2B]/40 transition-all"
            title="Apply Coupon RATNA10"
            aria-label="Apply Coupon"
          />
        </section>

        {/* ── 2. Category Banners (3 col) ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Jewellery", sub: "Shine in Every Style", img: "/design/cat_jewellery.png", href: "/customer/products?category=jewellery" },
            { name: "Sarees", sub: "Grace in Every Drape", img: "/design/cat_sarees.png", href: "/customer/products?category=sarees" },
            { name: "Dresses", sub: "Style for Every You", img: "/design/cat_dresses.png", href: "/customer/products?category=dresses" },
          ].map((cat) => (
            <div
              key={cat.name}
              className="bg-[#EFECE3] border border-[#E5E0D5] rounded-2xl p-6 relative overflow-hidden flex items-center justify-between group hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-2 z-10 max-w-[60%]">
                <h3 className="font-cormorant text-2xl font-bold text-[#1C2E24]">{cat.name}</h3>
                <p className="font-garamond text-xs text-[#556B5D]">{cat.sub}</p>
                <Link
                  href={cat.href}
                  className="inline-flex items-center gap-1.5 font-garamond text-xs font-semibold text-[#1E3A2B] hover:text-[#2A4D3B] pt-2 group-hover:underline"
                >
                  <span>Explore Now</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
              <div className="w-32 h-32 flex-shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-xl shadow-xs transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          ))}
        </section>

        {/* ── 3. Trending Now + Side Panel ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Product Grid */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌿</span>
                <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Trending Now</h2>
              </div>
              <Link href="/customer/products" className="font-garamond text-xs font-semibold text-[#556B5D] hover:text-[#1E3A2B] transition-colors">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {displayProducts.map((item) => {
                const isWished = wishlistIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E5E0D5] rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="relative aspect-square bg-[#FAF8F3] overflow-hidden">
                      <span className="absolute top-2 left-2 bg-[#B9381E] text-white font-garamond text-[10px] font-bold px-2 py-0.5 rounded-md z-10">
                        {item.discount}
                      </span>
                      <button
                        onClick={() => toggleWishlist(item.id)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-xs rounded-full flex items-center justify-center text-[#1C2E24] hover:bg-white shadow-xs z-10 transition-colors"
                        aria-label="Wishlist"
                      >
                        <Heart size={14} className={isWished ? "fill-red-500 text-red-500" : ""} />
                      </button>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-garamond text-xs font-bold text-[#1C2E24] line-clamp-1 group-hover:text-[#1E3A2B] transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex text-amber-500">
                            {Array(5).fill(0).map((_, i) => (
                              <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="font-garamond text-[10px] text-[#7A6E5D]">{item.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between">
                        <div>
                          <span className="font-garamond text-sm font-bold text-[#1C2E24]">₹{item.price.toLocaleString()}</span>
                          <span className="font-garamond text-[11px] text-[#8C8273] line-through ml-1.5">₹{item.originalPrice.toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => { addItem(item.id, 1); toast.success(`Added to cart!`); }}
                          className="bg-[#1E3A2B] hover:bg-[#2A4D3B] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Info Cards */}
          <div className="lg:col-span-4 space-y-6">
            {/* Why Choose Card */}
            <div className="bg-[#1E3A2B] text-white rounded-2xl p-6 relative overflow-hidden space-y-5 shadow-sm">
              <div className="space-y-1 relative z-10">
                <h3 className="font-cormorant text-2xl font-bold">Why Choose Ratnamayuri?</h3>
                <div className="w-12 h-0.5 bg-[#C9973E]" />
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10 font-garamond">
                {[
                  { icon: "🌸", label: "Handmade with Love" },
                  { icon: "🌿", label: "Eco-friendly Products" },
                  { icon: "🤝", label: "Support Local Artisans" },
                  { icon: "🏆", label: "Premium Quality" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center text-center p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-xl mb-1">{item.icon}</span>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Card */}
            <div className="bg-[#EFECE3] border border-[#E5E0D5] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="space-y-1 relative z-10 max-w-[70%]">
                <h3 className="font-cormorant text-2xl font-bold text-[#1C2E24]">Stay Connected with Nature &amp; Style</h3>
                <p className="font-garamond text-xs text-[#556B5D]">Join our newsletter for exclusive offers &amp; new arrivals.</p>
              </div>
              <div className="absolute right-2 bottom-2 w-20 h-24 pointer-events-none opacity-90">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/design/newsletter_plant.png" alt="Plant" className="w-full h-full object-contain" />
              </div>
              <form onSubmit={handleSubscribe} className="flex gap-2 relative z-10">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white border border-[#D8D2C5] px-3 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C8273] rounded-lg focus:outline-none focus:border-[#1E3A2B]"
                />
                <button
                  type="submit"
                  className="bg-[#1E3A2B] hover:bg-[#2A4D3B] text-white font-garamond text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ── 4. Trust Badges ── */}
        <section className="bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center font-garamond">
            {[
              { icon: <Truck size={20} />, label: "Free Delivery", sub: "On orders above ₹999" },
              { icon: <RefreshCw size={20} />, label: "Easy Returns", sub: "Hassle-free returns" },
              { icon: <ShieldCheck size={20} />, label: "Secure Payments", sub: "100% Safe & Secure" },
              { icon: <Banknote size={20} />, label: "Cash on Delivery", sub: "Available" },
              { icon: <Headphones size={20} />, label: "Dedicated Support", sub: "We're here to help", span: true },
            ].map((badge, i) => (
              <div key={i} className={`flex items-center gap-3 justify-center md:justify-start ${badge.span ? "col-span-2 md:col-span-1" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-[#EFECE3] flex items-center justify-center text-[#1E3A2B] flex-shrink-0">
                  {badge.icon}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-[#1C2E24]">{badge.label}</h4>
                  <p className="text-[11px] text-[#7A6E5D]">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer (desktop only) */}
      <Footer />
    </div>
  );
}
