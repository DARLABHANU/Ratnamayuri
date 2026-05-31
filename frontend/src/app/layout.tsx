import type { Metadata } from "next";
import { Playfair_Display, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
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
  title: "Ratnamayuri | Luxury Jewellery & Silk Sarees",
  description:
    "Handcrafted jewellery and hand-woven silk sarees — celebrating the timeless beauty of Indian craftsmanship.",
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


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cinzel.variable} ${garamond.variable}`}>
      <body className="bg-cream font-garamond text-brown antialiased">
        {/* Rehydrates auth session from cookies on every page load */}
        <AuthInitializer />
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
        {children}
      </body>
    </html>
  );
}
