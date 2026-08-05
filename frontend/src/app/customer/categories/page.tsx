"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, ChevronRight } from "lucide-react";
import { productApi } from "@/lib/api";

const DEFAULT_CATEGORIES = [
  {
    name: "Jewellery",
    sub: "Shine in Every Style",
    img: "/design/cat_jewellery.png",
    href: "/customer/products?category=jewellery",
    bg: "#FBF7F0",
  },
  {
    name: "Sarees",
    sub: "Grace in Every Drape",
    img: "/design/cat_sarees.png",
    href: "/customer/products?category=sarees",
    bg: "#FBF7F0",
  },
  {
    name: "Dresses",
    sub: "Style for Every You",
    img: "/design/cat_dresses.png",
    href: "/customer/products?category=dresses",
    bg: "#FBF7F0",
  },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    productApi.categories().then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((cat: any) => ({
          name: cat.name,
          sub: cat.description || (cat.slug === "jewellery" ? "Shine in Every Style" : cat.slug === "sarees" ? "Grace in Every Drape" : "Style for Every You"),
          img: cat.image_url || (cat.slug === "jewellery" ? "/design/cat_jewellery.png" : cat.slug === "sarees" ? "/design/cat_sarees.png" : "/design/cat_dresses.png"),
          href: `/customer/products?category=${cat.slug}`,
          bg: "#FBF7F0",
        }));
        setCategories(mapped);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">

      {/* ══════════════════════════════════════════════
          DESKTOP: page heading (Navbar comes from layout)
         ══════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-8 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-2">
          BROWSE
        </span>
        <h1 className="font-cormorant text-3xl font-bold text-[#1C2E24]">Shop by Category</h1>
        <p className="font-garamond text-sm text-[#556B5D] mt-1">
          Handpicked collections curated just for you
        </p>
        <div className="w-12 h-0.5 bg-[#0D2619] mt-3" />
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">

        {/* ── Hero Banner ── */}
        <section
          className="rounded-2xl overflow-hidden relative flex items-center justify-between min-h-[118px] md:min-h-[150px]"
          style={{
            background: "linear-gradient(125deg, #0C3D1E 0%, #1A5C32 55%, #0D3218 100%)",
          }}
        >
          {/* Decorative leaves – left */}
          <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none overflow-hidden opacity-40">
            <svg viewBox="0 0 80 130" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M-10 65 Q25 5 60 -5 Q42 35 38 65 Q42 95 60 135 Q25 125 -10 65Z" fill="#5CB85C" />
              <path d="M-10 65 L38 65" stroke="#4CAF50" strokeWidth="0.8" strokeDasharray="3,4" />
              <path d="M10 30 Q35 15 55 10" stroke="#4CAF50" strokeWidth="0.7" strokeDasharray="2,3" />
              <path d="M10 100 Q35 115 55 120" stroke="#4CAF50" strokeWidth="0.7" strokeDasharray="2,3" />
            </svg>
          </div>

          {/* Text */}
          <div className="relative z-10 pl-6 py-5 flex-1">
            <h2 className="font-cormorant text-[22px] md:text-[28px] font-bold text-white leading-[1.2]">
              Handpicked Collections<br />
              <span className="text-[#F5D78E]">Just for You</span>{" "}
              <span className="text-[20px]">✨</span>
            </h2>
          </div>

          {/* Jewellery image */}
          <div className="relative z-10 flex-shrink-0 w-[130px] md:w-[160px] h-[118px] md:h-[150px] flex items-end justify-end overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/cat_jewellery.png"
              alt="Jewellery Collections"
              className="w-full h-full object-contain object-right-bottom"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
            />
          </div>
        </section>

        {/* ── Category Cards ── */}
        {categories.map((cat, i) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="block rounded-2xl overflow-hidden border border-[#EAE4D9] shadow-xs hover:shadow-md active:scale-[0.99] transition-all duration-300 group"
            style={{ background: cat.bg }}
          >
            <div className="flex items-center justify-between px-5 md:px-7 py-4 md:py-5">
              {/* Left: text */}
              <div className="space-y-1 flex-1">
                <h3 className="font-cormorant text-[24px] md:text-[28px] font-bold text-[#1C2E24] leading-none group-hover:text-[#1E3A2B] transition-colors">
                  {cat.name}
                </h3>
                <p className="font-garamond text-sm text-[#7A6E5D]">{cat.sub}</p>
                {/* Desktop explore link */}
                <div className="hidden md:flex items-center gap-1 font-garamond text-xs font-semibold text-[#1E3A2B] mt-2 group-hover:underline">
                  Explore Now
                  <ChevronRight size={13} />
                </div>
              </div>

              {/* Right: product image */}
              <div
                className="flex-shrink-0 flex items-center justify-end overflow-hidden"
                style={{ width: i === 0 ? 120 : i === 1 ? 130 : 110, height: i === 0 ? 120 : i === 1 ? 110 : 130 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.1))" }}
                />
              </div>
            </div>
          </Link>
        ))}

        {/* ── View All Products CTA (desktop only) ── */}
        <div className="hidden md:flex justify-center pt-4">
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white font-garamond text-sm font-bold px-8 py-3.5 rounded-xl transition-all shadow-sm"
          >
            View All Products
            <ChevronRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}
