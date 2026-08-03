export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FAF8F3] font-garamond text-[#1C2E24]">
      {/* Left: Decorative Dark Forest Green Panel matching Admin Panel Theme */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0D2619] p-16 relative overflow-hidden text-emerald-100">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="admin-auth-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="#A3E635" strokeWidth="0.5" />
                <circle cx="30" cy="30" r="3" fill="#A3E635" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#admin-auth-pattern)" />
          </svg>
        </div>

        {/* Logo Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#19402B] border border-emerald-700/50 flex items-center justify-center text-emerald-300 font-cormorant font-bold text-xl">
              R
            </div>
            <div>
              <h1 className="font-cormorant text-2xl font-bold tracking-widest text-white">RATNAMAYURI</h1>
              <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">
                HANDCRAFTED JEWELLERY &amp; SILK SAREES
              </p>
            </div>
          </div>
        </div>

        {/* Center Quotation / Illustration */}
        <div className="relative z-10 text-center space-y-4">
          <div className="w-48 h-48 mx-auto rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center p-6 shadow-2xl">
            <div className="w-36 h-36 rounded-full border border-emerald-700/50 flex items-center justify-center">
              <span className="font-cormorant text-4xl font-extrabold text-emerald-200">✦</span>
            </div>
          </div>
          <blockquote className="font-cormorant text-2xl italic text-emerald-100 max-w-sm mx-auto leading-relaxed">
            &ldquo;Where timeless Indian heritage meets modern elegance.&rdquo;
          </blockquote>
        </div>

        {/* Footer info */}
        <div className="relative z-10">
          <p className="text-xs text-emerald-400/80">
            © 2025 Ratnamayuri Management System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right: Form area with Admin Panel Card Styling — perfectly centered for mobile */}
      <div className="flex items-center justify-center p-4 sm:p-8 md:p-12 bg-[#FAF8F3] min-h-screen">
        <div className="w-full max-w-md bg-white border border-[#E5E0D5] rounded-3xl p-5 sm:p-8 shadow-xs">
          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0D2619] text-white flex items-center justify-center font-cormorant font-bold text-2xl mx-auto mb-2 shadow-sm">
              R
            </div>
            <h1 className="font-cormorant text-2xl font-bold text-[#1C2E24] tracking-widest">RATNAMAYURI</h1>
            <p className="text-[10px] font-bold text-[#8C9890] tracking-widest mt-0.5 uppercase">
              AUTHENTICATION PORTAL
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
