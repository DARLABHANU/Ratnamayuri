import type { Metadata } from "next";
import { Playfair_Display, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Sparkles, Clock } from "lucide-react";
import "./globals.css";
import AuthInitializer from "@/components/AuthInitializer";

const cormorant = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const cinzel = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cinzel",
});

const garamond = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
});

export const metadata: Metadata = {
  title: "Ratnamayuri | Undergoing Maintenance",
  description:
    "Handcrafted jewellery and hand-woven silk sarees — celebrating the timeless beauty of Indian craftsmanship. We will be back online shortly.",
  keywords: ["jewellery", "silk sarees", "kanjivaram", "banarasi", "kundan", "gold"],
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

// ==========================================
// MAINTENANCE MODE TOGGLE
// Set to true to enable the maintenance screen.
// Set to false to restore the normal website.
// ==========================================
const MAINTENANCE_MODE = false;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cinzel.variable} ${garamond.variable}`}>
      <body className="bg-cream font-garamond text-brown antialiased">
        {!MAINTENANCE_MODE && <AuthInitializer />}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-garamond), sans-serif",
              background: "#4A0F0F",
              color: "#FAF6EE",
              border: "1px solid #C9973E",
            },
            success: { iconTheme: { primary: "#C9973E", secondary: "#4A0F0F" } },
          }}
        />
        
        {MAINTENANCE_MODE ? (
          <div className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden bg-gradient-to-b from-[#3d0b0b] to-[#260505] text-[#FAF6EE] selection:bg-[#C9973E] selection:text-[#4A0F0F]">
            {/* Elegant Background Patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,62,0.12),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/royal-feather.png')]" />

            {/* Top Border / Accent */}
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between border-b border-[#C9973E]/20 pb-6 relative z-10">
              <span className="font-cinzel text-xs tracking-[0.25em] text-[#C9973E]/80 font-medium uppercase">Est. 2026</span>
              <span className="font-cinzel text-xs tracking-[0.25em] text-[#C9973E]/80 font-medium uppercase">Luxury Collections</span>
            </div>

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center relative z-10 my-12 animate-fade-up">
              {/* Premium Luxury Gold Crest / Logo Wrapper */}
              <div className="relative mb-8 group">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C9973E] to-[#FAF6EE] opacity-20 blur-lg group-hover:opacity-40 transition duration-1000" />
                <div className="relative bg-[#4A0F0F]/60 border border-[#C9973E]/40 p-6 rounded-full inline-flex items-center justify-center w-24 h-24 shadow-2xl backdrop-blur-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/logo.png" 
                    alt="Ratnamayuri Logo" 
                    className="w-14 h-14 object-contain filter brightness-110 drop-shadow-[0_2px_8px_rgba(201,151,62,0.4)]"
                  />
                </div>
              </div>

              {/* Title & Brand */}
              <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.2em] text-[#FAF6EE] mb-4 drop-shadow-md">
                RATNAMAYURI
              </h1>
              <div className="h-[1px] w-40 bg-gradient-to-r from-transparent via-[#C9973E]/60 to-transparent mx-auto mb-8" />

              {/* Status Message */}
              <h2 className="font-cinzel text-lg md:text-xl font-light tracking-[0.3em] text-[#C9973E] mb-6 uppercase flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9973E] animate-pulse" />
                We'll Be Right Back
                <Sparkles className="w-4 h-4 text-[#C9973E] animate-pulse" />
              </h2>
              <p className="font-garamond text-base md:text-lg text-[#FAF6EE]/80 font-light leading-relaxed mb-8 max-w-lg mx-auto">
                Our online boutique is currently undergoing scheduled refinement and system upgrades. We are crafting an even more exquisite experience to showcase our fine jewellery and hand-woven silk sarees.
              </p>

              {/* Decorative Luxury Divider */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-12 h-[1px] bg-[#C9973E]/30" />
                <div className="w-2 h-2 rotate-45 border border-[#C9973E] bg-transparent" />
                <div className="w-12 h-[1px] bg-[#C9973E]/30" />
              </div>

              {/* Notice / Secondary Message */}
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#C9973E]/10 bg-[#4A0F0F]/30 backdrop-blur-sm rounded-full text-xs tracking-wider text-[#C9973E] font-medium uppercase">
                <Clock className="w-3.5 h-3.5" />
                Scheduled Brief Maintenance
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="w-full max-w-6xl mx-auto border-t border-[#C9973E]/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 text-[10px] tracking-[0.15em] font-medium text-[#FAF6EE]/60 uppercase font-cinzel">
              <p>
                &copy; {new Date().getFullYear()} Ratnamayuri. All Rights Reserved.
              </p>
              <p className="normal-case font-garamond text-xs tracking-wide">
                For urgent inquiries: <a href="mailto:support@ratnamayuri.com" className="text-[#C9973E] underline hover:text-[#FAF6EE] transition-colors">support@ratnamayuri.com</a>
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}

