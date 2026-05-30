# DESIGN SYSTEM SPECIFICATION: RATNAMAYURI
## Theme: Royal Peacock & Polished Platinum (Heritage Luxury Reimagined)
## Version: 2.0 (Google Stitch AI-Canvas Compatible)

> This document defines the visual system, design tokens, component specifications, and page-by-page layout guidelines to completely redesign the **Ratnamayuri** e-commerce platform.
> 
> **CRITICAL REQUIREMENT:** All original backend capabilities, schemas, features, and route structures remain exactly the same. The visual identity is completely overhauled by replacing the old gold-and-brown palette with a premium, high-contrast, jewel-toned palette inspired by Indian royalty: **Royal Peacock Blue**, **Imperial Emerald**, and **Polished Platinum**.

---

## 1. Brand Identity & Design System Persona

| Attribute | Old Brand System | New Brand System |
|---|---|---|
| **Tone** | Classic, Warm Heritage, Antique | Regal, Contemporary Luxury, Heirloom |
| **Primary Accent** | Gold (`#C9A96E`) | **Royal Peacock Blue** (`#0C2337`) |
| **Secondary Accent** | Gold Light / Dark | **Imperial Emerald** (`#0B3B36`) |
| **Backgrounds** | Warm Cream & Ivory | **Alabaster Silk** (`#FAF9F6`) & **Obsidian Dark** |
| **Borders / Dividers** | Gold-tinged borders | **Satin Silver / Platinum** (`#DDE1E6`) |
| **Typography** | Cormorant & Cinzel | **Playfair Display** (Serif) & **Plus Jakarta Sans** (Sans) |

---

## 2. Color Palette & Tailwind Extensions

This color palette represents premium luxury. It completely eliminates gold tones in favor of royal blues, deep emeralds, satin silvers, and pearl-white surfaces.

```json
{
  "colors": {
    "peacock": {
      "50":  "#f0f5fa",
      "100": "#dce8f4",
      "200": "#c0d7eb",
      "300": "#96bee0",
      "400": "#659ed0",
      "500": "#417ebc",
      "600": "#30649c",
      "700": "#28517e",
      "800": "#1b334f",
      "950": "#0c2337"
    },
    "emerald": {
      "50":  "#f1f8f7",
      "100": "#dbeefc",
      "200": "#b9deda",
      "300": "#8bc9c2",
      "400": "#5faaa3",
      "500": "#448f88",
      "600": "#34716c",
      "700": "#2a5c57",
      "800": "#234a47",
      "950": "#0b3b36"
    },
    "platinum": {
      "50":  "#fafafb",
      "100": "#f3f4f6",
      "200": "#e5e7eb",
      "300": "#d1d5db",
      "400": "#9ca3af",
      "500": "#6b7280",
      "600": "#4b5563",
      "700": "#374151",
      "800": "#1f2937",
      "900": "#111827",
      "950": "#0a0d14"
    },
    "ruby": {
      "950": "#5b0c24"
    },
    "alabaster": "#FAF9F6",
    "obsidian": "#0A0D10",
    "silver": "#DDE1E6"
  }
}
```

### Global HSL Theme Tokens (for `globals.css`)
```css
:root {
  --primary-peacock: 208deg 64% 13%;    /* #0C2337 */
  --secondary-emerald: 174deg 68% 14%;  /* #0B3B36 */
  --accent-ruby: 342deg 77% 20%;        /* #5B0C24 */
  --background-silk: 45deg 17% 98%;     /* #FAF9F6 */
  --border-silver: 210deg 11% 88%;      /* #DDE1E6 */
  --text-obsidian: 210deg 24% 8%;       /* #0A0D10 */
  --text-muted: 215deg 16% 47%;         /* #6B7280 */
}
```

---

## 3. Typography System

The redesigned interface uses high-contrast typography designed for luxury digital shopping:

*   **Primary Heading Serif: `Playfair Display`**
    *   *Usage:* Main page titles, headings, and romantic emphasis text.
    *   *Aesthetic:* Deep, classical high-contrast strokes that evoke heritage.
*   **Secondary Interactive Display: `Outfit`**
    *   *Usage:* Buttons, sidebar links, numbers, price tags, badges, and progress bar labels.
    *   *Aesthetic:* Sleek, geometric, high-fashion branding, extremely premium and modern.
*   **Body & Interface Text: `Plus Jakarta Sans`**
    *   *Usage:* General paragraphs, product descriptions, input fields, forms, metadata, and tables.
    *   *Aesthetic:* Crisp, wide-tracking, contemporary, maximizing legibility on dark or light interfaces.

---

## 4. UI Components Specification (Tailwind + CSS Mapping)

To apply the redesigned system, we mapped the original styling classes to the new premium components:

### 4.1 Buttons & Inputs
*   **Primary Button (`.btn-primary`):**
    *   *Old:* Brown/deep color with gold text, sharp borders.
    *   *New:* Deep Royal Peacock (`bg-peacock-950`) base with platinum-silver text (`text-platinum-100`), styled with modern geometric lines. Subtle emerald gradient on hover (`hover:bg-emerald-950`) and a thin platinum border to showcase high craftsmanship.
    *   *Tailwind:* `bg-peacock-950 text-white font-outfit text-xs tracking-widest px-8 py-3.5 border border-platinum-800 transition-all duration-300 hover:bg-emerald-950 hover:shadow-lg disabled:opacity-50;`
*   **Outline Button (`.btn-outline`):**
    *   *Old:* Sharp borders, gold outlines.
    *   *New:* Sleek transparent background with thin obsidian border, changing to emerald on hover.
    *   *Tailwind:* `bg-transparent text-peacock-950 font-outfit text-xs tracking-widest px-8 py-3.5 border border-platinum-300 transition-all duration-300 hover:border-peacock-950 hover:bg-platinum-50;`
*   **Ghost Button (`.btn-ghost`):**
    *   *Old:* Brownish text.
    *   *New:* Slate/Peacock-800 text with transparent hover states.
    *   *Tailwind:* `bg-transparent text-platinum-500 font-outfit text-xs tracking-widest px-4 py-2 transition-colors hover:text-peacock-950;`
*   **Input Fields (`.input-field`):**
    *   *Old:* Sharp gold-ring borders.
    *   *New:* Borderless sides with a solid base line in silver, or a minimal 1px platinum border with smooth transition focus ring of Emerald.
    *   *Tailwind:* `w-full border border-platinum-200 bg-white/70 px-4 py-3 font-sans text-base text-platinum-900 placeholder-platinum-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all duration-200 rounded-none;`

### 4.2 Surfaces & Dividers
*   **Cards (`.card`):**
    *   *Old:* Gold-shadowed white boxes.
    *   *New:* Glassmorphic premium feel on alabaster silk background. Pure white card with 1px border in Satin Silver (`border-silver`) and clean, elegant padding.
    *   *Tailwind:* `bg-white border border-platinum-200 shadow-sm hover:shadow-md transition-shadow duration-300;`
*   **Dividers (`.divider-platinum`):**
    *   *Old:* Gold line.
    *   *New:* Thin, elegant platinum/silver line.
    *   *Tailwind:* `w-16 h-0.5 bg-peacock-950 mx-auto my-4;`
*   **Badges (`.badge`):**
    *   *Old:* Gold badge.
    *   *New:* Obsidian Obsidian with Emerald accents, or Deep Peacock with silver highlights.
    *   *Tailwind:* `inline-flex items-center px-3 py-1 bg-peacock-950 text-platinum-100 font-outfit text-[10px] tracking-widest uppercase;`

---

## 5. Page-by-Page Redesign Blueprint

### 5.1 Main Layout (Navbar & Footer)
*   **Top Announcement Bar:** Transition from gold/deep background to Obsidian Dark (`bg-obsidian`) with shimmering silver text (`text-platinum-300`).
*   **Navbar:**
    *   *Background:* Cream background becomes Alabaster Silk (`bg-alabaster`), sticking with a modern backdrop filter blur.
    *   *Logo:* "RATNAMAYURI" in bold `Playfair Display` serif with wide letter spacing. The sub-tagline "LUXURY JEWELLERY & SAREES" is recolored to `text-emerald-700` and set in the crisp geometric `Outfit` font.
    *   *Navigation Links:* Elegant `Outfit` typeface in charcoal, transforming to rich emerald (`text-emerald-700`) on hover with a micro-animated underline.
    *   *User Account Dropdown:* Obsidian background, polished platinum border, red highlights.
*   **Footer:**
    *   *Background:* Jet Obsidian Black background (`bg-obsidian`).
    *   *Links:* Polished silver headers with ivory body items.
    *   *Newsletter:* Sleek input field with emerald-green submit buttons.

### 5.2 Homepage
*   **Hero Section:**
    *   *Left Side:* Modern asymmetric spacing. The heading swaps "Heritage" to `text-peacock-800` in deep italic serif.
    *   *Right Side:* The gold pattern canvas shifts to a luxury silk-shimmer peacock-gradient canvas (`from-peacock-950 to-emerald-950`). The vector shapes change to silver lines (`stroke-platinum-300`), creating a celestial, high-jewelry mandala.
*   **Marquee Banner:** Swaps to Obsidian (`bg-obsidian`) with platinum text and emerald star separators (`✦`).
*   **Category Grid:**
    *   The Silk Sarees card gets a deep Prussian Blue overlay (`bg-gradient-to-br from-peacock-950 to-platinum-950`).
    *   The Luxury Jewellery card gets an Imperial Emerald overlay (`bg-gradient-to-br from-emerald-950 to-platinum-950`).
    *   Bridal Collection card receives a deep Royal Amethyst overlay (`bg-gradient-to-br from-ruby-950 to-platinum-950`).
*   **Testimonial Cards:** White alabaster background, bold dark-teal decorative quote marks, and initial badges styled in emerald green gradients.

### 5.3 Customer Portal & Checkout Flow
*   **Product Browse Page (`/customer/products`):**
    *   Interactive filter bar uses clean platinum border inputs.
    *   The search button is primary peacock blue.
    *   The pagination buttons swap gold active states to solid Obsidian (`bg-obsidian`) with emerald text.
*   **Product Details Page (`/customer/products/[id]`):**
    *   Visual carousel with a soft platinum border.
    *   Color swatches remain active (Ruby, Emerald, Peacock, Midnight) and are displayed inside a platinum framing tray.
    *   "Add to Cart" button is styled as a large, bold peacock-blue banner with interactive hover micro-animations.
*   **Shopping Cart Page (`/customer/cart`):**
    *   Clean layout featuring modern item tables.
    *   Promo codes applied inside a platinum input, highlighting discount in a ruby color (`text-ruby-950`), demonstrating promoter-coupon benefits cleanly.
*   **Checkout & Shipping (`/customer/orders/checkout`):**
    *   Double-column dashboard. Shipping address cards are framed in light silver, highlighting the selected default address in deep peacock blue.
*   **Order Tracker Component (`OrderTracker.tsx`):**
    *   *Old:* Gold-dotted progress tracker.
    *   *New:* A premium vertical or horizontal timeline with glowing emerald-green dots for completed stages, and satin silver lines for pending stages.

### 5.4 Merchant Portal (`/merchant/*`)
*   **Navigation Sidebar:** Solid Obsidian Black background with sleek vertical lines. The active item displays a glowing teal/emerald indicator block on the side.
*   **Overview Stats Cards:** 4 premium cards styled with thin silver outlines, displaying large numbers in bold geometry (`Outfit` font) using custom shades of Peacock Blue and Emerald Green.
*   **Analytics Charts:** Custom Recharts configuration mapping sales data onto deep peacock area gradients (`from-peacock-500/20 to-transparent`) and silver-grey coordinate lines.

### 5.5 Admin Portal (`/admin/*`)
*   **Platform Dashboard:** Clean, professional ivory-platinum tables. Active coupons display a premium badge (`bg-emerald-50 text-emerald-800 border border-emerald-300`).
*   **Commissions Table:** Promoter payouts highlight pending status in rich grey-blue (`text-platinum-500 bg-platinum-100`), and paid commissions in solid green (`text-emerald-800 bg-emerald-50`). Payout action triggers have a clean obsidian outline button.

### 5.6 Support Portal (`/support/*`)
*   **Support Lookup Console:** Large, centered minimalist search input with clear placeholders. Impersonation alerts are displayed inside a soft red/plum banner (`bg-ruby-50 text-ruby-950 border border-ruby-200`) to highlight security and auditability.
*   **Audit Logs Timeline:** Clean chronological silver-grey list with exact timestamps in the modern sans-serif typeface, allowing the support staff to quickly identify events.

---

## 6. Implementation Checklist for Coding Agents

### Step 1: Update `globals.css`
Replace color variables inside `:root` (lines 5-14) with:
```css
:root {
  --peacock: #0C2337;
  --emerald: #0B3B36;
  --ruby: #5B0C24;
  --alabaster: #FAF9F6;
  --platinum: #F2F4F7;
  --silver: #DDE1E6;
  --obsidian: #0A0D10;
  --text-muted: #6B7280;
}
```
Update all `@layer components` definitions (lines 26-76) in `globals.css` to swap `gold` classes to `peacock`, `emerald`, and `platinum`.

### Step 2: Extend `tailwind.config.ts`
Replace the old `gold` object under `colors` with:
```typescript
peacock: {
  50:  "#f0f5fa",
  100: "#dce8f4",
  200: "#c0d7eb",
  300: "#96bee0",
  400: "#659ed0",
  500: "#417ebc",
  600: "#30649c",
  700: "#28517e",
  800: "#1b334f",
  950: "#0c2337",
},
emerald: {
  50:  "#f1f8f7",
  100: "#dbeefc",
  200: "#b9deda",
  300: "#8bc9c2",
  400: "#5faaa3",
  500: "#448f88",
  600: "#34716c",
  700: "#2a5c57",
  800: "#234a47",
  950: "#0b3b36",
},
platinum: {
  50:  "#fafafb",
  100: "#f3f4f6",
  200: "#e5e7eb",
  300: "#d1d5db",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
  950: "#0a0d14",
},
ruby: {
  950: "#5b0c24",
},
alabaster: "#FAF9F6",
obsidian: "#0A0D10",
silver: "#DDE1E6",
```
Update fonts to:
```typescript
fontFamily: {
  playfair: ["var(--font-playfair)", "serif"],
  outfit:   ["var(--font-outfit)", "sans-serif"],
  jakarta:  ["var(--font-jakarta)", "sans-serif"],
}
```

### Step 3: Global Font Ingestion in `layout.tsx`
Replace import statement for Google Fonts in `src/app/layout.tsx`:
```typescript
import { Playfair_Display, Outfit, Plus_Jakarta_Sans } from "next/font/google";
```
Instantiate variables and apply them to the top `<html>` wrapper to complete the aesthetic redesign.
