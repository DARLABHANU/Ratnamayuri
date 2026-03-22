export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Decorative panel */}
      <div className="hidden lg:flex flex-col justify-between bg-deep p-16 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="#C9A96E" strokeWidth="0.5" />
                <circle cx="30" cy="30" r="3" fill="#C9A96E" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-pattern)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <h1 className="font-cinzel text-2xl tracking-[0.3em] text-gold-300">RATNAMAYURI</h1>
          <p className="font-garamond text-xs tracking-[0.4em] text-gold-500 mt-1">
            LUXURY JEWELLERY &amp; SILK SAREES
          </p>
        </div>

        {/* Center decorative */}
        <div className="relative z-10 text-center">
          <svg viewBox="0 0 300 300" className="w-64 h-64 mx-auto opacity-70" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(150,150)" stroke="#C9A96E" fill="none">
              <circle r="120" strokeWidth="0.5" opacity="0.4"/>
              <circle r="90" strokeWidth="0.5" opacity="0.5"/>
              <circle r="60" strokeWidth="1" opacity="0.6"/>
              {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => (
                <ellipse key={i} cx="0" cy="-80" rx="12" ry="28"
                  fill="#C9A96E" opacity="0.2"
                  transform={`rotate(${angle})`} />
              ))}
              <circle r="25" fill="#C9A96E" opacity="0.3"/>
              <circle r="12" fill="#C9A96E" opacity="0.5"/>
            </g>
          </svg>
          <blockquote className="font-cormorant text-xl italic text-gold-300 mt-6 leading-relaxed">
            "Where every piece tells a story<br />of heritage and grace."
          </blockquote>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="font-garamond text-xs text-gold-600">
            © 2025 Ratnamayuri. Made with ♡ in India.
          </p>
        </div>
      </div>

      {/* Right: Form area */}
      <div className="flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-cinzel text-xl tracking-[0.3em] text-brown">RATNAMAYURI</h1>
            <p className="font-garamond text-xs tracking-[0.3em] text-gold-500 mt-1">
              LUXURY JEWELLERY &amp; SILK SAREES
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
