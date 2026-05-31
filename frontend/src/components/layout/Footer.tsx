"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Truck, 
  Award, 
  RotateCcw, 
  ShieldCheck, 
  Facebook, 
  Instagram, 
  Youtube, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  Gem,
  Send,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    // Simulate premium API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success("Thank you for subscribing to Ratnamayuri private previews!");
    setEmail("");
    setSubmitting(false);
  };

  return (
    <footer className="bg-[#4A0F0F] text-[#E8D5B0] border-t border-[#5A1212]">
      {/* ── 1. Premium Newsletter & Preview Subscription ── */}
      <div className="border-b border-[#5A1212] py-12 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <h3 className="font-cinzel text-sm lg:text-base tracking-[0.25em] text-[#C9973E] font-bold mb-2">
              SUBSCRIBE TO PRIVATE PREVIEWS
            </h3>
            <p className="font-garamond text-xs lg:text-sm text-[#d4b896] leading-relaxed">
              Be the first to receive exclusive previews of our hand-woven silk collections, seasonal bridal edits, and members-only loyalty invitations.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row gap-2.5">
            <div className="relative">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:w-80 bg-[#3D0C0C] border border-[#5A1212] text-[#E8D5B0] placeholder-[#9a7070]
                  px-4 py-3 text-xs tracking-wider focus:outline-none focus:border-[#C9973E] focus:ring-1 focus:ring-[#C9973E]
                  transition-all duration-300 rounded-md"
              />
            </div>
            <button 
              type="submit"
              disabled={submitting}
              className="bg-[#C9973E] hover:bg-[#B8842A] text-white px-6 py-3 font-cinzel text-xs font-bold
                tracking-widest flex items-center justify-center gap-2 transition-all duration-300 rounded-md
                hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>
                  SUBSCRIBE <Send size={12} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        {/* ── 2. Brand Identity & Footer Directory Columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Identity & Contact Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 border border-[#C9973E] rounded-full flex items-center justify-center
                text-[#C9973E] font-bold text-base" style={{ fontFamily: "Georgia, serif" }}>R</div>
              <div className="flex flex-col">
                <span className="text-[#FAF6EE] font-extrabold text-base tracking-[0.15em] leading-none" style={{ fontFamily: "Georgia, serif" }}>
                  RATNAMAYURI
                </span>
                <span className="text-[#C9973E] text-[8px] tracking-[0.2em] font-bold mt-1">
                  JEWELLERY & SAREES
                </span>
              </div>
            </div>
            <p className="font-garamond text-xs lg:text-sm text-[#d4b896] leading-relaxed">
              Celebrating the absolute pinnacle of Indian craftsmanship. Every hand-woven weave and hand-polished jewel is a testament to timeless heritage, devotion, and sheer luxury.
            </p>
            <div className="space-y-2.5 text-xs text-[#d4b896] font-garamond pt-2">
              <p className="flex items-center gap-2">
                <Phone size={13} className="text-[#C9973E] flex-shrink-0" />
                <span>+91 83318 10689</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={13} className="text-[#C9973E] flex-shrink-0" />
                <span>ratnamayurii@gmail.com</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={13} className="text-[#C9973E] flex-shrink-0" />
                <span>Indiranagar Double Road, Bengaluru, KA</span>
              </p>
            </div>
          </div>

          {/* Shop Directory */}
          <div>
            <h4 className="font-cinzel text-xs tracking-widest text-[#C9973E] font-bold mb-6">COLLECTIONS</h4>
            <ul className="space-y-3.5 font-garamond text-xs lg:text-sm">
              {[
                { label: "New Arrivals", href: "/customer/products" },
                { label: "Luxury Jewellery", href: "/customer/products?category=jewellery" },
                { label: "Silk Handlooms", href: "/customer/products?category=sarees" },
                { label: "Bridal Masterpieces", href: "/customer/products?category=bridal" },
                { label: "Bespoke Custom Orders", href: "/customer/products?is_featured=true" },
                { label: "Exclusive Offers", href: "/customer/products?discount_min=10" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-[#d4b896] hover:text-[#FAF6EE] hover:translate-x-1 inline-block transition-all duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-cinzel text-xs tracking-widest text-[#C9973E] font-bold mb-6">CUSTOMER CARE</h4>
            <ul className="space-y-3.5 font-garamond text-xs lg:text-sm">
              {[
                { label: "Track Live Delivery", href: "/customer/orders" },
                { label: "Returns & Exchanges", href: "/customer/orders" },
                { label: "My Shopping Bag", href: "/customer/cart" },
                { label: "Saved Wishlist", href: "/customer/wishlist" },
                { label: "Customer Profile", href: "/customer/profile" },
                { label: "Help & Support Desk", href: "/customer/dashboard" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-[#d4b896] hover:text-[#FAF6EE] hover:translate-x-1 inline-block transition-all duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partner & Corporate */}
          <div>
            <h4 className="font-cinzel text-xs tracking-widest text-[#C9973E] font-bold mb-6">OUR BRAND</h4>
            <ul className="space-y-3.5 font-garamond text-xs lg:text-sm">
              {[
                { label: "Our Heritage Story", href: "/customer/products" },
                { label: "Authenticity & Seals", href: "/customer/products" },
                { label: "Sustainability & Ethics", href: "/customer/products" },
                { label: "Corporate Careers", href: "/customer/products" },
                { label: "Partner Merchant Portal", href: "/merchant/dashboard" },
                { label: "Affiliate Promoter Program", href: "/promoter/dashboard" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-[#d4b896] hover:text-[#FAF6EE] hover:translate-x-1 inline-block transition-all duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── 3. High-Fidelity Trust & Quality Seals ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-10 border-y border-[#5A1212]/50 mb-10">
          {[
            { 
              icon: <Award className="text-[#C9973E] w-6 h-6 flex-shrink-0" />, 
              title: "100% BIS HALLMARKED", 
              desc: "Certified 22K & 18K absolute pure gold jewellery." 
            },
            { 
              icon: <Gem className="text-[#C9973E] w-6 h-6 flex-shrink-0" />, 
              title: "SILK MARK CERTIFIED", 
              desc: "Genuine handcrafted handlooms from local weavers." 
            },
            { 
              icon: <Truck className="text-[#C9973E] w-6 h-6 flex-shrink-0" />, 
              title: "PAN-INDIA SECURE TRANSIT", 
              desc: "Complimentary fully insured delivery directly to your door." 
            },
            { 
              icon: <RotateCcw className="text-[#C9973E] w-6 h-6 flex-shrink-0" />, 
              title: "7-DAY SECURE RETURNS", 
              desc: "No questions asked easy refunds and exchange policy." 
            },
          ].map((badge, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5">
              <div className="p-2.5 bg-[#3D0C0C] rounded-full border border-[#5A1212]">
                {badge.icon}
              </div>
              <div className="min-w-0">
                <p className="font-cinzel text-[10px] tracking-widest text-[#FAF6EE] font-bold mb-1">{badge.title}</p>
                <p className="font-garamond text-xs text-[#d4b896] leading-snug">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 4. Legal, Copyright, & Verified Payment Badges ── */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-6 text-center sm:text-left">
            <p className="font-garamond text-xs text-[#9a7070]">
              © 2026 Ratnamayuri Jewellery & Sarees. All Rights Reserved. Crafted with absolute devotion to Indian Craftsmanship.
            </p>
            <div className="flex items-center gap-4 text-xs font-garamond">
              <Link href="/terms" className="text-[#9a7070] hover:text-[#E8D5B0] transition-colors">Terms of Service</Link>
              <span className="text-[#5A1212]">|</span>
              <Link href="/privacy" className="text-[#9a7070] hover:text-[#E8D5B0] transition-colors">Privacy Policy</Link>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-4">
            {/* Payment logs */}
            <div className="flex items-center gap-1.5 bg-[#3D0C0C] border border-[#5A1212] px-3.5 py-1.5 rounded-md">
              {["VISA", "MASTERCARD", "RUPAY", "UPI", "NETBANKING"].map((method) => (
                <span key={method} className="font-cinzel text-[8px] font-extrabold tracking-widest text-[#C9973E] px-1 border-r border-[#5A1212] last:border-r-0">
                  {method}
                </span>
              ))}
            </div>

            {/* Social handles */}
            <div className="flex gap-2">
              {[
                { icon: <Instagram size={14} />, href: "https://instagram.com" },
                { icon: <Facebook size={14} />, href: "https://facebook.com" },
                { icon: <Youtube size={14} />, href: "https://youtube.com" },
                { icon: <Twitter size={14} />, href: "https://twitter.com" },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 border border-[#5A1212] bg-[#3D0C0C] rounded-full flex items-center justify-center
                    text-[#d4b896] hover:border-[#C9973E] hover:text-[#FAF6EE] hover:scale-105 transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
