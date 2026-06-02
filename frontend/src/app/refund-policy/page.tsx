"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EE]">
      <Navbar />
      <main className="flex-1 bg-[#FAF6EE] py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white border border-[#E8D5B0] p-8 md:p-12 shadow-sm rounded-lg animate-fade-up">
          <div className="text-center space-y-4 mb-12">
            <span className="font-cinzel text-[10px] tracking-widest text-[#C9973E] block font-bold">LEGAL DOCUMENTATION</span>
            <h1 className="font-cormorant text-4xl text-[#5A1212] italic">Cancellation &amp; Refund Policy</h1>
            <p className="font-garamond text-xs text-[#6B7280]">Last Updated: June 02, 2026</p>
            <div className="w-12 h-[1px] bg-[#C9973E] mx-auto mt-4" />
          </div>

          <div className="font-garamond text-[#5A1212]/95 leading-relaxed space-y-8 text-sm md:text-base">
            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">1. 7-DAY SECURE RETURN &amp; EXCHANGE WINDOW</h2>
              <p>
                At Ratnamayuri, your absolute satisfaction is our commitment. If your order does not meet your luxury standards, we provide a secure **7-day return and exchange window** from the date of delivery.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To initiate a return or exchange, please reach out to our Concierge Team at **support@ratnamayuri.com** with your Order ID.</li>
                <li>Returns initiated after the 7-day period will not be accepted.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">2. RETURN ELIGIBILITY &amp; CONDITIONS</h2>
              <p>
                To qualify for a refund or exchange, returned items must be verified by our Quality Assurance vault against the following terms:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Condition</strong>: Items must be entirely unworn, unused, unwashed, and in pristine condition with all security seals intact.</li>
                <li><strong>Packaging</strong>: The item must be returned in its original luxury case, including jewelry boxes, protective pouches, security tags, silk weave tags, and certificates of authenticity.</li>
                <li><strong>Exclusion Signs</strong>: Any sign of wear, perfume traces, makeup smudges, saree pleat deformations, or alterations will result in immediate disqualification of the return request.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">3. NON-RETURNABLE &amp; NON-REFUNDABLE PRODUCTS</h2>
              <p>
                Certain categories of products are meticulously tailored or sanitized and are therefore exempt from standard returns:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Customized &amp; Bespoke Pieces</strong>: Custom jewelry sizes, custom-engraved silver products, and personalized bridal sarees.</li>
                <li><strong>Sarees with Stitching Services</strong>: Sarees ordered with pre-stitched blouses, custom falls, or tailored edgings.</li>
                <li><strong>Gift Cards &amp; Store Credits</strong>: E-gift cards are non-refundable and cannot be redeemed for cash.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">4. CANCELLATION POLICY</h2>
              <p>
                We believe in flexible shopping. However, because our artisan weavers and craftsmen begin preparing orders immediately, cancellation parameters apply:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Orders can be cancelled free of charge within **12 hours** of placement, or prior to dispatch (whichever is earlier).</li>
                <li>Once an order is handed over to our transit courier partner, cancellation is no longer possible. In such cases, please receive the package and follow the standard 7-day return procedure.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">5. REFUND PROCESSING TIMELINES</h2>
              <p>
                Once your returned package is delivered back to our vault:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Our Quality Assurance vault will inspect the item within **48 hours**.</li>
                <li>Upon approval, a refund will be initiated immediately to your original payment method (Credit/Debit Card, Net Banking, UPI, or Wallet).</li>
                <li>The refunded amount typically reflects in your bank statement within **5 to 7 business days**, subject to your financial institution's processing cycles.</li>
              </ul>
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
