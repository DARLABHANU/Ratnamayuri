export default function PrivacyPage() {
  return (
    <div className="min-h-[80vh] bg-ivory/10 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-gold-150 p-8 md:p-12 shadow-md animate-fade-up">
        {/* Header decoration */}
        <div className="text-center space-y-4 mb-12">
          <span className="font-cinzel text-[10px] tracking-widest text-gold-600 block">LEGAL DOCUMENTATION</span>
          <h1 className="font-cormorant text-4xl text-brown italic">Privacy Policy</h1>
          <p className="font-garamond text-xs text-muted">Last Updated: May 24, 2026</p>
          <div className="w-12 h-[1px] bg-gold-400 mx-auto mt-4" />
        </div>

        {/* Legal Text content */}
        <div className="font-garamond text-brown/90 leading-relaxed space-y-8 text-sm md:text-base">
          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">1. DATA WE COLLECT</h2>
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
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">2. HOW WE USE YOUR DATA</h2>
            <p>
              Your personal information is handled exclusively to optimize your interaction with our store. We process it to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Process and ship orders, including sending transactional order receipt emails.</li>
              <li>Authenticate your account via secure one-time-passwords (OTP).</li>
              <li>Enhance platform security, audit transactions, and prevent fraudulent claims.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">3. COOKIE POLICY & LOCAL STORAGE</h2>
            <p>
              We utilize browser cookies to handle user sessions, maintain authorization tokens securely, and keep your shopping cart state synchronized. These cookies are set dynamically with secure settings, preventing cross-site scripting (XSS) vulnerabilities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">4. SECURITY & PROTECTION</h2>
            <p>
              Your security is our absolute priority. We implement state-of-the-art encryption protocols to safeguard all data transfers. High-severity data transfers are handled through protected server environments, and database accesses are strictly audited using built-in system logging to keep your information safe.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">5. DATA SHARING & THIRD PARTIES</h2>
            <p>
              We do not sell, rent, or trade your personal information with external brokers. Data is shared only with certified courier partners to fulfill shipping dispatches, or when legally compelled by regulatory audits.
            </p>
          </section>
        </div>

        {/* Footer legal signature */}
        <div className="border-t border-gold-100 mt-12 pt-8 text-center">
          <p className="font-cinzel text-[10px] tracking-widest text-muted">
            RATNAMAYURI LUXURY SERVICES © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
