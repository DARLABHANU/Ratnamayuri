import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  "#FAF6EE",
          100: "#F5E6D3",
          200: "#E8D5B0",
          300: "#E8D5B0",
          400: "#C9973E",
          500: "#C9973E",
          600: "#6B1A1A",
          700: "#5A1212",
          800: "#4A0F0F",
          900: "#4A0F0F",
        },
        cream: "#FAF6EE",
        ivory: "#FAF0E4",
        deep:  "#4A0F0F",
        brown: "#5A1212",
        muted: "#6B7280",
      },
      fontFamily: {
        cinzel:    ["var(--font-cinzel)", "sans-serif"],
        cormorant: ["var(--font-cormorant)", "serif"],
        garamond:  ["var(--font-garamond)", "sans-serif"],
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease both",
        "fade-in":    "fadeIn 0.4s ease both",
        "slide-in":   "slideIn 0.3s ease both",
        "spin-slow":  "spin 3s linear infinite",
      },
      keyframes: {
        fadeUp:  { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
export default config;
