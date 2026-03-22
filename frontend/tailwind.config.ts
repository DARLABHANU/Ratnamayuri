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
          50:  "#fdf8ee",
          100: "#f9edce",
          200: "#f2d898",
          300: "#e8c05e",
          400: "#dda83a",
          500: "#c9a96e",
          600: "#9b7940",
          700: "#7a5e30",
          800: "#5c4524",
          900: "#3d2e18",
        },
        cream: "#FAF6F0",
        ivory: "#F5EFE6",
        deep:  "#1A0E05",
        brown: "#3D2314",
        muted: "#7A6355",
      },
      fontFamily: {
        cinzel:    ["var(--font-cinzel)", "serif"],
        cormorant: ["var(--font-cormorant)", "serif"],
        garamond:  ["var(--font-garamond)", "serif"],
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
