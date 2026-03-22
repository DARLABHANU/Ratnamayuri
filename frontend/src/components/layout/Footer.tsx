import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-deep text-gold-300">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-cinzel text-lg tracking-[0.3em] text-gold-300 mb-1">RATNAMAYURI</h3>
            <p className="font-garamond text-xs tracking-[0.3em] text-gold-500 mb-4">
              LUXURY JEWELLERY & SAREES
            </p>
            <p className="font-garamond text-sm text-gold-400 leading-relaxed">
              Celebrating the timeless beauty of Indian craftsmanship. Every piece tells a story
              of heritage, artistry, and devotion.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-cinzel text-xs tracking-widest text-gold-500 mb-4">SHOP</h4>
            <ul className="space-y-2">
              {["New Arrivals", "Silk Sarees", "Gold Jewellery", "Kundan & Polki", "Bridal Collection", "Sale"].map((item) => (
                <li key={item}>
                  <Link href="/customer/products"
                    className="font-garamond text-sm text-gold-400 hover:text-gold-200 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-cinzel text-xs tracking-widest text-gold-500 mb-4">HELP</h4>
            <ul className="space-y-2">
              {["Track Order", "Returns & Exchanges", "Size Guide", "Care Guide", "Contact Us", "FAQs"].map((item) => (
                <li key={item}>
                  <Link href="#"
                    className="font-garamond text-sm text-gold-400 hover:text-gold-200 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-cinzel text-xs tracking-widest text-gold-500 mb-4">COMPANY</h4>
            <ul className="space-y-2">
              {["Our Story", "Artisans", "Sustainability", "Press", "Careers", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link href="#"
                    className="font-garamond text-sm text-gold-400 hover:text-gold-200 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 border-y border-gold-800 mb-8">
          {[
            { icon: "🚚", title: "FREE SHIPPING", desc: "On orders above ₹2,999" },
            { icon: "🏆", title: "HALLMARKED GOLD", desc: "BIS certified 22K & 18K" },
            { icon: "🔄", title: "EASY RETURNS", desc: "7-day hassle-free policy" },
            { icon: "🛡️", title: "SECURE PAYMENT", desc: "UPI · Cards · Net Banking" },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-cinzel text-xs tracking-widest text-gold-400 mb-1">{item.title}</p>
              <p className="font-garamond text-xs text-gold-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <p className="font-garamond text-xs text-gold-500">
            © 2025 Ratnamayuri. Made with ♡ in India.
          </p>
          <div className="flex gap-4">
            {["📸", "📘", "📌", "▶"].map((icon, i) => (
              <a key={i} href="#"
                className="w-8 h-8 border border-gold-700 rounded-full flex items-center justify-center
                  text-gold-500 hover:bg-gold-500 hover:text-deep transition-all text-sm">
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
