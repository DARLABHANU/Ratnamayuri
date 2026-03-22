import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="min-h-[92vh] grid lg:grid-cols-2">
          <div className="flex flex-col justify-center px-8 lg:px-20 py-20">
            <span className="section-tag">✦ NEW COLLECTION 2025 ✦</span>
            <h1 className="font-cormorant text-5xl lg:text-7xl font-light text-brown leading-tight mb-6">
              Where <em className="italic text-gold-700">Heritage</em><br />
              Meets Elegance
            </h1>
            <p className="font-garamond text-lg text-muted leading-relaxed max-w-lg mb-10">
              Handcrafted jewellery and hand-woven silk sarees — each piece a testament to
              centuries-old Indian artisanship, made for the woman who carries tradition with grace.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/customer/products" className="btn-primary">EXPLORE COLLECTION</Link>
              <Link href="/auth/signup" className="btn-outline">JOIN US</Link>
            </div>
          </div>

          <div className="hidden lg:flex bg-gradient-to-br from-gold-100 to-gold-200 items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 500 600" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M15 0 L30 15 L15 30 L0 15 Z" fill="none" stroke="#C9A96E" strokeWidth="0.5" opacity="0.4"/>
                </pattern>
              </defs>
              <rect width="500" height="600" fill="url(#hero-pattern)"/>
              <g transform="translate(250,300)">
                <circle r="160" fill="none" stroke="#C9A96E" strokeWidth="1" opacity="0.3"/>
                <circle r="120" fill="none" stroke="#C9A96E" strokeWidth="0.5" opacity="0.4"/>
                {[0,45,90,135,180,225,270,315].map((a,i) => (
                  <ellipse key={i} cx="0" cy="-130" rx="14" ry="35"
                    fill="#9B7940" opacity="0.25" transform={`rotate(${a})`}/>
                ))}
                <circle r="40" fill="#C9A96E" opacity="0.3"/>
                <circle r="20" fill="#9B7940" opacity="0.5"/>
                <circle r="8" fill="#C9A96E" opacity="0.8"/>
              </g>
              <text x="250" y="540" textAnchor="middle" fontFamily="serif"
                fontSize="11" fill="#9B7940" letterSpacing="4" opacity="0.7">
                RATNAMAYURI
              </text>
            </svg>
            <div className="absolute bottom-10 right-10 bg-deep text-center p-5">
              <p className="font-cinzel text-3xl text-gold-400">500+</p>
              <p className="font-garamond text-xs tracking-widest text-gold-300 mt-1">HAPPY BRIDES</p>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="bg-deep py-3 overflow-hidden border-y border-gold-800">
          <div className="flex gap-16 whitespace-nowrap animate-marquee">
            {Array(3).fill(["HANDCRAFTED JEWELLERY","✦","PURE KANJIVARAM SILK","✦","BANARASI SAREES",
              "✦","BRIDAL COLLECTIONS","✦","CERTIFIED GOLD","✦","FREE SHIPPING ₹2999+","✦"]).flat()
              .map((item, i) => (
                <span key={i} className={`font-cinzel text-xs tracking-widest flex-shrink-0
                  ${item === "✦" ? "text-gold-500" : "text-gold-300"}`}>
                  {item}
                </span>
              ))}
          </div>
        </div>

        {/* Categories */}
        <section className="py-20 px-4 lg:px-20 bg-cream">
          <div className="text-center mb-12">
            <span className="section-tag">✦ EXPLORE ✦</span>
            <h2 className="section-title">Shop by <em className="italic">Category</em></h2>
            <div className="divider-gold" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Silk Sarees", sub: "Kanjivaram · Banarasi", bg: "from-red-900 to-purple-900", icon: "🥻" },
              { label: "Gold Jewellery", sub: "Necklaces · Earrings", bg: "from-yellow-900 to-brown", icon: "💛" },
              { label: "Kundan & Polki", sub: "Bridal Sets · Tikka", bg: "from-green-900 to-teal-900", icon: "💎" },
              { label: "Bangles & Kadas", sub: "Gold · Silver · Lac", bg: "from-blue-900 to-indigo-900", icon: "⭕" },
            ].map((cat) => (
              <Link key={cat.label} href="/customer/products"
                className={`group relative h-56 lg:h-72 bg-gradient-to-br ${cat.bg}
                  overflow-hidden flex flex-col justify-end p-6 hover:scale-[1.02] transition-transform duration-300`}>
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full flex items-center justify-center text-8xl opacity-30">
                    {cat.icon}
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="font-cinzel text-sm tracking-widest text-gold-300 mb-1">{cat.label}</p>
                  <p className="font-garamond text-xs text-gold-400 mb-2">{cat.sub}</p>
                  <span className="font-cinzel text-xs text-gold-500 border-b border-gold-500 pb-0.5">
                    SHOP NOW →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products placeholder */}
        <section className="py-20 px-4 lg:px-20 bg-ivory">
          <div className="text-center mb-12">
            <span className="section-tag">✦ BESTSELLERS ✦</span>
            <h2 className="section-title">Our Most <em className="italic">Loved</em> Pieces</h2>
            <div className="divider-gold" />
          </div>
          <div className="text-center">
            <Link href="/customer/products" className="btn-primary">BROWSE ALL PRODUCTS</Link>
          </div>
        </section>

        {/* Bridal banner */}
        <section className="grid lg:grid-cols-2 bg-deep min-h-80">
          <div className="flex flex-col justify-center p-12 lg:p-20">
            <span className="font-cinzel text-xs tracking-widest text-gold-500 mb-4">✦ BRIDAL SEASON 2025 ✦</span>
            <h2 className="font-cormorant text-4xl lg:text-5xl font-light text-cream leading-tight mb-4">
              Dress the Bride in <em className="italic text-gold-400">Pure Gold</em> & Silk
            </h2>
            <p className="font-garamond text-gold-300/70 leading-relaxed mb-8 max-w-md">
              Complete bridal trousseau curated for you — from the first mehendi to the vidaai.
            </p>
            <Link href="/customer/products?category=bridal" className="btn-primary self-start">
              EXPLORE BRIDAL
            </Link>
          </div>
          <div className="hidden lg:flex items-center justify-center bg-brown/20 relative overflow-hidden">
            <svg viewBox="0 0 400 400" className="w-72 h-72 opacity-60" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(200,200)" stroke="#C9A96E" fill="none">
                <circle r="160" strokeWidth="0.5"/>
                <circle r="120" strokeWidth="1"/>
                <circle r="80" strokeWidth="0.5"/>
                {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=>(
                  <ellipse key={i} cx="0" cy="-100" rx="10" ry="25" fill="#C9A96E"
                    opacity="0.2" transform={`rotate(${a})`}/>
                ))}
                <circle r="20" fill="#C9A96E" opacity="0.3"/>
                <circle r="8" fill="#C9A96E" opacity="0.6"/>
              </g>
            </svg>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 lg:px-20 bg-ivory">
          <div className="text-center mb-12">
            <span className="section-tag">✦ REVIEWS ✦</span>
            <h2 className="section-title">Words from Our <em className="italic">Beloved</em> Customers</h2>
            <div className="divider-gold" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Priya V.", loc: "Chennai", text: "The Kanjivaram saree was breathtaking. Exquisite zari work and such a luxurious drape. Every guest complimented me!", initial: "P" },
              { name: "Sunita A.", loc: "Jaipur", text: "Ordered the Kundan bridal set for my daughter's wedding. The craftsmanship is unparalleled — looks like heirloom jewellery.", initial: "S" },
              { name: "Ananya K.", loc: "Bengaluru", text: "Sceptical about buying jewellery online, but Ratnamayuri changed my mind. Hallmark certificate, fast delivery, warm service.", initial: "A" },
            ].map((t) => (
              <div key={t.name} className="card p-8 relative">
                <div className="font-cormorant text-7xl text-gold-200 absolute top-2 left-4 leading-none">"</div>
                <div className="text-gold-500 text-sm mb-3">★★★★★</div>
                <p className="font-garamond text-base text-brown leading-relaxed mb-6 pt-4">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-200 to-gold-500
                    flex items-center justify-center font-cinzel text-deep">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-cinzel text-xs tracking-wide text-brown">{t.name}</p>
                    <p className="font-garamond text-xs text-muted">{t.loc} · Verified Buyer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
