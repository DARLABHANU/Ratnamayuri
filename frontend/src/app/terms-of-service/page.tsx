"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EE]">
      <Navbar />
      <main className="flex-1 bg-[#FAF6EE] py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white border border-[#E8D5B0] p-8 md:p-12 shadow-sm rounded-lg animate-fade-up">
          <div className="text-center space-y-4 mb-12">
            <span className="font-cinzel text-[10px] tracking-widest text-[#C9973E] block font-bold">LEGAL DOCUMENTATION</span>
            <h1 className="font-cormorant text-4xl text-[#5A1212] italic">Terms of Service</h1>
            <p className="font-garamond text-xs text-[#6B7280]">Last Updated: June 02, 2026</p>
            <div className="w-12 h-[1px] bg-[#C9973E] mx-auto mt-4" />
          </div>

          <div className="font-garamond text-[#5A1212]/95 leading-relaxed space-y-8 text-sm md:text-base">
            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">1. ACCEPTANCE OF TERMS</h2>
              <p>
                By accessing, browsing, or utilizing the Ratnamayuri platform, you signify your unreserved agreement to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and Ratnamayuri Jewellery &amp; Sarees. If you do not agree to these terms, please refrain from using our digital boutique.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">2. PRODUCT AUTHENTICITY &amp; CRAFTSMANSHIP</h2>
              <p>
                Ratnamayuri is committed to delivering unparalleled authenticity.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Fine Jewellery</strong>: All sterling silver jewellery items are crafted with premium 925 silver, hallmarked to ensure compliance with quality guidelines. Detailed gemological certifications are provided where explicitly indicated.</li>
                <li><strong>Sarees &amp; Textiles</strong>: Handloom silk, georgette, and organza sarees are sourced directly from traditional artisans and weavers, ensuring genuine weave structures and premium silk mark equivalents.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">3. PURCHASES, PRICING &amp; PAYMENT TERMS</h2>
              <p>
                All prices listed on the site are in Indian Rupees (INR) and are inclusive of relevant taxes unless stated otherwise.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>We reserve the right to correct pricing errors, alter product descriptions, or cancel orders arising from listing discrepancies.</li>
                <li>Secure payments are processed through integrated gateways supporting leading credit/debit cards, Net Banking, UPI, and authorized mobile wallets.</li>
                <li>Ratnamayuri does not store complete payment credentials on our servers. All transactions are securely routed through PCI-DSS compliant partner networks.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">4. INTELLECTUAL PROPERTY RIGHTS</h2>
              <p>
                The Ratnamayuri brand, logo, typography, designs, high-resolution catalog imagery, custom web interfaces, and backend codebases are the exclusive intellectual property of Ratnamayuri. Any unauthorized duplication, reproduction, hotlinking, or distribution of these assets for commercial purposes is strictly prohibited and subject to legal action.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">5. USER CONDUCT &amp; ACCOUNTS</h2>
              <p>
                When creating an account or initiating a passwordless login sequence:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You agree to provide true, accurate, and current information.</li>
                <li>You are solely responsible for safeguarding the secure links and OTP tokens transmitted to your email or mobile device.</li>
                <li>Any attempts to breach platform security, inject malicious scripts, or scrape product details will result in immediate termination of service access and referral to cyber authorities.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">6. LIMITATION OF LIABILITY &amp; GOVERNING LAW</h2>
              <p>
                Ratnamayuri shall not be held liable for indirect, incidental, or consequential damages resulting from product use or digital downtime. These terms are governed by and construed in accordance with the laws of India, and all disputes shall be subject to the exclusive jurisdiction of the competent courts in India.
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
