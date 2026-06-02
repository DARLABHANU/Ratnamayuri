"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EE]">
      <Navbar />
      <main className="flex-1 bg-[#FAF6EE] py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white border border-[#E8D5B0] p-8 md:p-12 shadow-sm rounded-lg animate-fade-up">
          <div className="text-center space-y-4 mb-12">
            <span className="font-cinzel text-[10px] tracking-widest text-[#C9973E] block font-bold">LEGAL DOCUMENTATION</span>
            <h1 className="font-cormorant text-4xl text-[#5A1212] italic">Privacy Policy</h1>
            <p className="font-garamond text-xs text-[#6B7280]">Last Updated: June 02, 2026</p>
            <div className="w-12 h-[1px] bg-[#C9973E] mx-auto mt-4" />
          </div>

          <div className="font-garamond text-[#5A1212]/95 leading-relaxed space-y-8 text-sm md:text-base">
            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">1. DATA WE COLLECT</h2>
              <p>
                At Ratnamayuri, we value your privacy above all. To provide our luxury shopping experience, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Personal details</strong>: Name, email address, phone number, and mailing address to complete registrations and secure deliveries.</li>
                <li><strong>Transaction metadata</strong>: Cart lists, coupon logs, and order histories to fulfill purchases.</li>
                <li><strong>Technical traces</strong>: IP addresses and browser logs to ensure platform integrity and performance.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">2. HOW WE USE YOUR DATA</h2>
              <p>
                Your personal information is handled exclusively to optimize your interaction with our store. We process it to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Process and ship orders, including sending transactional order receipt emails.</li>
                <li>Authenticate your account via secure one-time-passwords (OTP) and passwordless magic links.</li>
                <li>Enhance platform security, audit transactions, and prevent fraudulent claims.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">3. COOKIE POLICY &amp; LOCAL STORAGE</h2>
              <p>
                We utilize browser cookies to handle user sessions, maintain authorization tokens securely, and keep your shopping cart state synchronized. These cookies are set dynamically with secure settings, preventing cross-site scripting (XSS) vulnerabilities.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">4. SECURITY &amp; PROTECTION</h2>
              <p>
                Your security is our absolute priority. We implement state-of-the-art encryption protocols to safeguard all data transfers. High-severity data transfers are handled through protected server environments, and database accesses are strictly audited using built-in system logging to keep your information safe.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold">5. DATA SHARING &amp; THIRD PARTIES</h2>
              <p>
                We do not sell, rent, or trade your personal information with external brokers. Data is shared only with certified courier partners to fulfill shipping dispatches, or when legally compelled by regulatory audits.
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
