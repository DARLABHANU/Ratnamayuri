"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F3] font-garamond text-[#1C2E24]">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white border border-[#E5E0D5] p-8 md:p-12 rounded-3xl shadow-xs space-y-8">
          <div className="text-center space-y-2 border-b border-[#F0ECE1] pb-6">
            <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block">
              LEGAL DOCUMENTATION
            </span>
            <h1 className="font-cormorant text-3xl md:text-4xl font-bold text-[#1C2E24]">Cancellation &amp; Refund Policy</h1>
            <p className="text-xs text-[#8C9890]">Last Updated: August 2026</p>
          </div>

          <div className="space-y-8 text-xs md:text-sm text-[#556B5D] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">1. 7-Day Secure Return &amp; Exchange Window</h2>
              <p>
                At Ratnamayuri, your absolute satisfaction is our commitment. If your order does not meet your luxury standards, we provide a secure <strong>7-day return and exchange window</strong> from the date of delivery.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>To initiate a return or exchange, please reach out to our Concierge Team at <strong>support@ratnamayuri.com</strong> with your Order ID.</li>
                <li>Returns initiated after the 7-day period will not be accepted.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">2. Return Eligibility &amp; Conditions</h2>
              <p>
                To qualify for a refund or exchange, returned items must be verified by our Quality Assurance vault against the following terms:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Condition</strong>: Items must be entirely unworn, unused, unwashed, and in pristine condition with all security seals intact.</li>
                <li><strong>Packaging</strong>: The item must be returned in its original luxury case, including jewelry boxes, protective pouches, security tags, silk weave tags, and certificates of authenticity.</li>
                <li><strong>Exclusion Signs</strong>: Any sign of wear, perfume traces, makeup smudges, saree pleat deformations, or alterations will result in immediate disqualification of the return request.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">3. Non-Returnable &amp; Non-Refundable Products</h2>
              <p>
                Certain categories of products are meticulously tailored or sanitized and are therefore exempt from standard returns:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Customized &amp; Bespoke Pieces</strong>: Custom jewelry sizes, custom-engraved silver products, and personalized bridal sarees.</li>
                <li><strong>Sarees with Stitching Services</strong>: Sarees ordered with pre-stitched blouses, custom falls, or tailored edgings.</li>
                <li><strong>Gift Cards &amp; Store Credits</strong>: E-gift cards are non-refundable and cannot be redeemed for cash.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">4. Cancellation Policy</h2>
              <p>
                We believe in flexible shopping. However, because our artisan weavers and craftsmen begin preparing orders immediately, cancellation parameters apply:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Orders can be cancelled free of charge within 12 hours of placement or prior to dispatch.</li>
                <li>Once dispatched, cancellations are treated as returns subject to return shipping deductions.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
