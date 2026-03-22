import type { Metadata } from "next";
import { Cormorant_Garamond, Cinzel, EB_Garamond } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
});

export const metadata: Metadata = {
  title: "Ratnamayuri | Luxury Jewellery & Silk Sarees",
  description:
    "Handcrafted jewellery and hand-woven silk sarees — celebrating the timeless beauty of Indian craftsmanship.",
  keywords: ["jewellery", "silk sarees", "kanjivaram", "banarasi", "kundan", "gold"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cinzel.variable} ${garamond.variable}`}>
      <body className="bg-cream font-garamond text-brown antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-garamond), serif",
              background: "#1A0E05",
              color: "#E8D5A3",
              border: "1px solid #C9A96E",
            },
            success: { iconTheme: { primary: "#C9A96E", secondary: "#1A0E05" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
