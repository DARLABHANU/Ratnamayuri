"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  Banknote,
  Headphones,
  Mail, 
  Phone, 
  MapPin, 
  Instagram,
  Facebook,
  Youtube,
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
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success("Thank you for subscribing to Ratnamayuri!");
    setEmail("");
    setSubmitting(false);
  };

  return (
    <footer className="hidden md:block bg-[#14281E] text-[#E2EBE4] border-t border-[#1E3A2B]">
      
      {/* ── 1. Trust Badges Banner ── */}
      <div className="bg-[#1E3A2B] border-b border-[#2A4D3B] py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="flex flex-col items-center">
            <Truck size={24} className="text-emerald-300 mb-2" />
            <h4 className="font-garamond text-xs font-bold text-white uppercase">Free Delivery</h4>
            <p className="font-garamond text-[11px] text-emerald-200/80 mt-0.5">On orders above ₹999</p>
          </div>
          <div className="flex flex-col items-center">
            <RotateCcw size={24} className="text-emerald-300 mb-2" />
            <h4 className="font-garamond text-xs font-bold text-white uppercase">Easy Returns</h4>
            <p className="font-garamond text-[11px] text-emerald-200/80 mt-0.5">Hassle-free returns</p>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck size={24} className="text-emerald-300 mb-2" />
            <h4 className="font-garamond text-xs font-bold text-white uppercase">Secure Payments</h4>
            <p className="font-garamond text-[11px] text-emerald-200/80 mt-0.5">100% Safe &amp; Secure</p>
          </div>
          <div className="flex flex-col items-center">
            <Banknote size={24} className="text-emerald-300 mb-2" />
            <h4 className="font-garamond text-xs font-bold text-white uppercase">Cash on Delivery</h4>
            <p className="font-garamond text-[11px] text-emerald-200/80 mt-0.5">Available across India</p>
          </div>
          <div className="flex flex-col items-center col-span-2 md:col-span-1">
            <Headphones size={24} className="text-emerald-300 mb-2" />
            <h4 className="font-garamond text-xs font-bold text-white uppercase">Dedicated Support</h4>
            <p className="font-garamond text-[11px] text-emerald-200/80 mt-0.5">We're here to help</p>
          </div>
        </div>
      </div>

      {/* ── 2. Links Directory ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E3A2B] border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4C10 7.5 7 9 4 9C4 13 7 16 12 19C17 16 20 13 20 9C17 9 14 7.5 12 4Z" fill="#C9973E" fillOpacity="0.3" stroke="#C9973E" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M12 7C10.8 9.5 8.5 10.5 6 10.5C6 13.5 8.5 15.5 12 17.5C15.5 15.5 18 13.5 18 10.5C15.5 10.5 13.2 9.5 12 7Z" stroke="#B58A46" strokeWidth="1.2"/>
                </svg>
              </div>
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-white leading-none">Ratnamayuri</h3>
                <p className="font-garamond text-[11px] text-emerald-300 mt-0.5">Handmade with Love 💕</p>
              </div>
            </div>
            <p className="font-garamond text-xs text-emerald-100/70 leading-relaxed">
              Crafted with love. Inspired by nature. Bringing you authentic handmade jewellery, silk sarees, and handcrafted ethnic wear directly from skilled local artisans.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-[#1E3A2B] flex items-center justify-center text-emerald-300 hover:bg-emerald-700 hover:text-white transition-colors">
                <Instagram size={15} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#1E3A2B] flex items-center justify-center text-emerald-300 hover:bg-emerald-700 hover:text-white transition-colors">
                <Facebook size={15} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#1E3A2B] flex items-center justify-center text-emerald-300 hover:bg-emerald-700 hover:text-white transition-colors">
                <Youtube size={15} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-garamond text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-[#1E3A2B] pb-2">Shop Categories</h4>
            <ul className="space-y-2.5 font-garamond text-xs text-emerald-100/80">
              <li><Link href="/customer/products?category=jewellery" className="hover:text-white transition-colors">Handmade Jewellery</Link></li>
              <li><Link href="/customer/products?category=sarees" className="hover:text-white transition-colors">Handloom Silk Sarees</Link></li>
              <li><Link href="/customer/products?category=dresses" className="hover:text-white transition-colors">Ethnic Anarkali &amp; Dresses</Link></li>
              <li><Link href="/customer/products?is_featured=true" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/customer/products?sort_by=total_sold" className="hover:text-white transition-colors">Bestsellers</Link></li>
              <li><Link href="/customer/products?sort_by=price" className="hover:text-white transition-colors">Special Offers</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-garamond text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-[#1E3A2B] pb-2">Customer Care</h4>
            <ul className="space-y-2.5 font-garamond text-xs text-emerald-100/80">
              <li><Link href="/customer/orders" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link href="/customer/support" className="hover:text-white transition-colors">Help &amp; Support</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping &amp; Delivery Policy</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Return &amp; Refund Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 font-garamond text-xs text-emerald-100/80">
            <h4 className="font-garamond text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-[#1E3A2B] pb-2">Contact Us</h4>
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-emerald-300 flex-shrink-0 mt-0.5" />
              <span>Guntur, Andhra Pradesh, India — 522002</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={16} className="text-emerald-300 flex-shrink-0" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-emerald-300 flex-shrink-0" />
              <span>support@ratnamayuri.com</span>
            </div>
          </div>

        </div>

        {/* ── 3. Bottom Rights ── */}
        <div className="mt-12 pt-6 border-t border-[#1E3A2B] flex flex-col sm:flex-row items-center justify-between gap-4 font-garamond text-xs text-emerald-200/60">
          <p>© {new Date().getFullYear()} Ratnamayuri. All rights reserved. Handcrafted with love.</p>
          <p>Eco-Friendly &amp; Sustainable Indian Craftsmanship</p>
        </div>
      </div>
    </footer>
  );
}
