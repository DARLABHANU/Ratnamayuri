"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ShippingPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F3] font-garamond text-[#1C2E24]">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white border border-[#E5E0D5] p-8 md:p-12 rounded-3xl shadow-xs space-y-8">
          <div className="text-center space-y-2 border-b border-[#F0ECE1] pb-6">
            <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block">
              LEGAL DOCUMENTATION
            </span>
            <h1 className="font-cormorant text-3xl md:text-4xl font-bold text-[#1C2E24]">Shipping &amp; Delivery Policy</h1>
            <p className="text-xs text-[#8C9890]">Last Updated: August 2026</p>
          </div>

          <div className="space-y-8 text-xs md:text-sm text-[#556B5D] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">1. Pan-India Complimentary Secure Transit</h2>
              <p>
                At Ratnamayuri, we understand the precious nature of the treasures you acquire. We are pleased to provide:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Free Shipping</strong>: Complimentary delivery on all prepaid orders exceeding ₹1,999 across India.</li>
                <li><strong>Standard Rates</strong>: Flat fee of ₹150 applies to orders below ₹1,999 to cover high-grade protective packaging and certified dispatch costs.</li>
                <li><strong>Transit Insurance</strong>: Every package is fully insured from our vault to your door. You bear zero risk during transit.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">2. Processing &amp; Dispatch Timelines</h2>
              <p>
                To maintain the integrity of our hand-loomed and fine artisan goods, our standard timelines are structured as follows:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Ready-to-Ship Items</strong>: Dispatched within 24 to 48 business hours from our central warehouse.</li>
                <li><strong>Bespoke / Custom Orders</strong>: Silver jewellery resizing, custom bridal sarees, and personalized embellishments require between 7 to 15 business days for bespoke craftsmanship before shipment.</li>
                <li><strong>Handloom Sarees</strong>: High-value designer sarees are thoroughly steam-pressed, double-checked for weaving perfection, and secured in luxury heirloom cases prior to shipping.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">3. Delivery Estimates</h2>
              <p>
                Once dispatched, domestic shipments generally arrive within:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Metro Cities</strong>: 2 to 4 business days.</li>
                <li><strong>Rest of India</strong>: 4 to 7 business days depending on location accessibility.</li>
                <li>Please note that national holidays, severe weather conditions, and extreme logistics delays are exempt from standard delivery timelines.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">4. Carriers &amp; Real-Time Tracking</h2>
              <p>
                We partner exclusively with premium secure-shipping logistics networks such as Blue Dart, Sequel Logistics, and Delhivery.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
