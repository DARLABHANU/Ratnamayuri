export default function TermsPage() {
  return (
    <div className="min-h-[80vh] bg-ivory/10 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-gold-150 p-8 md:p-12 shadow-md animate-fade-up">
        {/* Header decoration */}
        <div className="text-center space-y-4 mb-12">
          <span className="font-cinzel text-[10px] tracking-widest text-gold-600 block">LEGAL DOCUMENTATION</span>
          <h1 className="font-cormorant text-4xl text-brown italic">Terms & Conditions</h1>
          <p className="font-garamond text-xs text-muted">Last Updated: May 24, 2026</p>
          <div className="w-12 h-[1px] bg-gold-400 mx-auto mt-4" />
        </div>

        {/* Legal Text content */}
        <div className="font-garamond text-brown/90 leading-relaxed space-y-8 text-sm md:text-base">
          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">1. ACCEPTANCE OF TERMS</h2>
            <p>
              Welcome to Ratnamayuri. By accessing our platform, browsing our collection, purchasing items, or engaging with our services, you agree to comply with and be bound by the following Terms and Conditions. Please review them carefully. If you do not agree to these terms, you should not access or use this website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">2. PLATFORM SERVICES & ACCOUNTS</h2>
            <p>
              Our platform operates as a luxury e-commerce service connecting discerning customers with Silk Sarees, Bridal collections, and Fine Jewellery. 
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are solely responsible for maintaining the confidentiality of your account credentials and passwords.</li>
              <li>Any unauthorized account usage or security breach must be reported immediately to our support services.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">3. PRICING & PAYMENT</h2>
            <p>
              All prices shown on the website are in Indian Rupees (₹) unless explicitly stated otherwise. We reserve the right to modify prices, descriptions, and availability without prior notice. Payments are secured through state-of-the-art payment gateways, protecting your financial data at every step.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">4. RETURN & REFUND POLICY</h2>
            <p>
              Due to the bespoke and luxury nature of Silk Sarees, custom Bridal ensembles, and fine Gold/Jewellery, returns are subject to strict quality assessments. Jewellery items cannot be returned once security tags are removed. Sarees must be returned in original, unworn foldings within 7 days of delivery.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">5. INTELLECTUAL PROPERTY</h2>
            <p>
              The names, designs, logos, images, software codes, and layouts used on Ratnamayuri represent protected intellectual assets. Unauthorized copying, downloading, distributing, or commercial usage of our design system, custom components, or brand images is strictly prohibited under international copyright conventions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-xs tracking-wider text-brown font-semibold">6. LIMITATION OF LIABILITY</h2>
            <p>
              Ratnamayuri shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or the inability to use our platform services or purchased items.
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
