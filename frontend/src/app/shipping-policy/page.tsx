"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ShippingPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EE]">
      <Navbar />
      <main className="flex-1 bg-[#FAF6EE] py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white border border-[#E8D5B0] p-8 md:p-12 shadow-sm rounded-lg animate-fade-up">
          <div className="text-center space-y-4 mb-12">
            <span className="font-cinzel text-[10px] tracking-widest text-[#C9973E] block font-bold">LEGAL DOCUMENTATION</span>
            <h1 className="font-cormorant text-4xl text-[#5A1212] italic">Shipping &amp; Delivery Policy</h1>
            <p className="font-garamond text-xs text-[#6B7280]">Last Updated: June 02, 2026</p>
            <div className="w-12 h-[1px] bg-[#C9973E] mx-auto mt-4" />
          </div>

          <div className="font-garamond text-[#5A1212]/95 leading-relaxed space-y-8 text-sm md:text-base">
            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">1. PAN-INDIA COMPLIMENTARY SECURE TRANSIT</h2>
              <p>
                At Ratnamayuri, we understand the precious nature of the treasures you acquire. We are pleased to provide:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Free Shipping</strong>: Complimentary delivery on all prepaid orders exceeding ₹1,999 across India.</li>
                <li><strong>Standard Rates</strong>: Flat fee of ₹150 applies to orders below ₹1,999 to cover high-grade protective packaging and certified dispatch costs.</li>
                <li><strong>Transit Insurance</strong>: Every package is fully insured from our vault to your door. You bear absolutely zero risk during transit.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">2. PROCESSING &amp; DISPATCH TIMELINES</h2>
              <p>
                To maintain the integrity of our hand-loomed and fine artisan goods, our standard timelines are structured as follows:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Ready-to-Ship Items</strong>: Dispatched within 24 to 48 business hours from our central warehouse.</li>
                <li><strong>Bespoke / Custom Orders</strong>: Silver jewellery resizing, custom bridal sarees, and personalized embellishments require between 7 to 15 business days for bespoke craftsmanship before shipment.</li>
                <li><strong>Handloom Sarees</strong>: High-value designer sarees are thoroughly steam-pressed, double-checked for weaving perfection, and secured in luxury heirloom cases prior to shipping.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">3. DELIVERY ESTIMATES</h2>
              <p>
                Once dispatched, domestic shipments generally arrive within:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Metro Cities</strong>: 2 to 4 business days.</li>
                <li><strong>Rest of India</strong>: 4 to 7 business days depending on location accessibility.</li>
                <li>Please note that national holidays, severe weather conditions, and extreme logistics delays are exempt from standard delivery timelines.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">4. CARRIERS &amp; REAL-TIME TRACKING</h2>
              <p>
                We partner exclusively with premium secure-shipping logistics networks such as Blue Dart, Sequel Logistics, and Delhivery. 
              </p>
              <p>
                Upon dispatch, a unique Tracking ID and direct tracking URL will be sent to your registered email address and phone number, allowing you to follow your package in real-time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">5. VERIFIED DELIVERY SECURE OTP</h2>
              <p>
                Due to the premium value of Ratnamayuri shipments, **all deliveries require a signature or secure OTP validation upon receipt**. Packages cannot be left unattended on porches or with neighbors unless explicitly authorized by the recipient via our logistics partner's dashboard.
              </p>
            </section>
          </div>

          <div className="border-t border-[#FAF6EE] mt-12 pt-8 text-center">
            <p className="font-cinzel text-[10px] tracking-widest text-[#6B7280]">
              RATNAMAYURI LUXURY SERVICES © 2026
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
