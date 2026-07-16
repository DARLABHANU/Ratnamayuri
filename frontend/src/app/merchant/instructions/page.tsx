"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, HelpCircle, Key, LineChart, Package, 
  Truck, Wallet, AlertCircle, Store 
} from "lucide-react";

const SECTIONS = [
  { id: "login", label: "1. Portal Access", icon: Key },
  { id: "dashboard", label: "2. Business Overview", icon: LineChart },
  { id: "profile", label: "3. Store Profile Setup", icon: AlertCircle },
  { id: "products", label: "4. Catalog Management", icon: Package },
  { id: "logistics", label: "5. Logistics Workflow", icon: Truck },
  { id: "wallet", label: "6. Wallet & Withdrawals", icon: Wallet },
];

function ScreenshotBox({ src, alt, placeholderText }: { src: string; alt: string; placeholderText: string }) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (hasError) {
    return (
      <div className="border border-dashed border-gold-300 bg-gold-50/10 p-12 text-center rounded">
        <p className="font-cinzel text-xs tracking-wider text-gold-700 uppercase font-semibold">{placeholderText}</p>
        <p className="font-garamond text-xs text-muted mt-1.5 italic">
          (To show your screenshot here automatically, save your image file as <span className="font-mono bg-gold-100/50 px-1 py-0.5 border border-gold-200/50 text-gold-800 text-[10px] rounded">public{src}</span>)
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gold-200 overflow-hidden rounded shadow-sm bg-ivory relative min-h-[100px]">
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-auto object-cover border-b border-gold-100 transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0 absolute"
        }`}
      />
      {!loaded && (
        <div className="p-12 text-center">
          <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="font-garamond text-xs text-muted">Loading screenshot...</p>
        </div>
      )}
      {loaded && (
        <div className="p-3 bg-white">
          <p className="font-garamond text-xs text-muted italic text-center">{alt}</p>
        </div>
      )}
    </div>
  );
}

export default function MerchantInstructionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <span className="section-tag">HELP & SUPPORT</span>
        <h1 className="section-title">Merchant <em className="italic">Operations Manual</em></h1>
        <p className="font-garamond text-xs md:text-sm text-muted mt-1 max-w-2xl leading-relaxed">
          Operational guide and step-by-step documentation for merchants. Review portal usage instructions below.
        </p>
        <div className="divider-gold mx-0 mt-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar List */}
        <div className="md:col-span-1 space-y-1 bg-white/50 border border-gold-200/50 p-2 rounded">
          {SECTIONS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-left font-cinzel text-xs tracking-wider transition-all rounded-sm
                  ${activeTab === tab.id 
                    ? "bg-deep text-gold-400 font-semibold shadow-sm" 
                    : "text-brown hover:bg-gold-50/50 hover:text-gold-700"}`}
              >
                <Icon size={14} className={activeTab === tab.id ? "text-gold-400" : "text-gold-600"} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Details Area */}
        <div className="md:col-span-3 card p-6 bg-white border-gold-200/60 shadow-sm animate-fade-in min-h-[500px]">
          {activeTab === "login" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-cinzel text-sm tracking-widest text-brown border-b border-gold-100 pb-2 uppercase flex items-center gap-2">
                  <Key size={16} className="text-gold-600" /> Portal Access &amp; Authentication
                </h2>
                <p className="font-garamond text-sm text-muted mt-3 leading-relaxed">
                  Authentication is required to log in to your merchant console. Ensure you use the seller dashboard account details.
                </p>
              </div>

              <div className="space-y-3 font-garamond text-sm text-deep">
                <h3 className="font-cinzel text-xs tracking-wider text-brown font-semibold">Step-by-Step Log In:</h3>
                <ol className="list-decimal list-inside space-y-2 pl-1 leading-relaxed">
                  <li>Visit the portal login URL: <span className="font-mono text-xs bg-gold-50/80 px-1.5 py-0.5 border border-gold-100/50 text-gold-800 rounded">https://ratnamayuri.me/auth/login</span></li>
                  <li>Enter your registered seller email address (e.g., <span className="font-medium text-brown">appzonix@gmail.com</span>).</li>
                  <li>Type your secure merchant password credentials.</li>
                  <li>Click on the <span className="font-semibold text-brown">"SIGN IN"</span> button.</li>
                  <li>The platform will automatically verify details and direct you to `/merchant/dashboard`.</li>
                </ol>
              </div>

              <ScreenshotBox 
                src="/images/login_page.png"
                alt="Figure 1.1: Portal Access Sign-In Interface"
                placeholderText="[login_page_screenshot]"
              />
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-cinzel text-sm tracking-widest text-brown border-b border-gold-100 pb-2 uppercase flex items-center gap-2">
                  <LineChart size={16} className="text-gold-600" /> Business Overview &amp; Analytics
                </h2>
                <p className="font-garamond text-sm text-muted mt-3 leading-relaxed">
                  The dashboard gives you a high-level summary of your storefront's health, inventory volumes, sales aggregates, and payment schedules.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "TOTAL SALES", desc: "Gross product revenue generated by your store listings since registration." },
                  { label: "ORDERS COUNT", desc: "Total customer order packages containing one or more of your items." },
                  { label: "WALLET BALANCE", desc: "Real-time earnings summary showing funds currently held vs. ready to withdraw." },
                  { label: "COMMISSION RATE", desc: "The platform's operating fee percentage deduction configured for your store." }
                ].map((item, idx) => (
                  <div key={idx} className="bg-ivory/40 p-4 border border-gold-100 rounded">
                    <p className="font-cinzel text-[10px] tracking-wider text-gold-700 font-semibold mb-1">{item.label}</p>
                    <p className="font-garamond text-xs text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <ScreenshotBox 
                src="/images/dashboard.png"
                alt="Figure 2.1: Merchant Performance Dashboard"
                placeholderText="[merchant_dashboard_screenshot]"
              />
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-cinzel text-sm tracking-widest text-brown border-b border-gold-100 pb-2 uppercase flex items-center gap-2">
                  <AlertCircle size={16} className="text-gold-600" /> Store Profile Setup (Mandatory)
                </h2>
                <p className="font-garamond text-sm text-muted mt-3 leading-relaxed">
                  To protect our catalog credibility, <strong>merchants must first create and set up their Store Profile details</strong> before they can add or manage products.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 text-xs font-garamond rounded space-y-1.5">
                <p className="font-cinzel font-semibold text-amber-800 tracking-wider">⚠️ MANDATORY PROFILE STAGE</p>
                <p className="text-amber-700 leading-relaxed">
                  If you attempt to view or add products before saving your profile, the catalog tab will lock automatically. You will see a profile requirement notification directing you to fill out your details.
                </p>
              </div>

              <div className="space-y-2 font-garamond text-sm text-deep">
                <h3 className="font-cinzel text-xs tracking-wider text-brown font-semibold">Store Fields Required:</h3>
                <ul className="list-disc list-inside space-y-1.5 pl-1 leading-relaxed">
                  <li><strong className="text-brown">Store / Business Name:</strong> The public shop name displayed on your items.</li>
                  <li><strong className="text-brown">Description:</strong> A summary of your designer collections.</li>
                  <li><strong className="text-brown">GSTIN:</strong> Your tax registration identification number.</li>
                  <li><strong className="text-brown">Bank details:</strong> Settlement account name, bank name, account number, and IFSC code.</li>
                </ul>
              </div>

              <ScreenshotBox 
                src="/images/profile.png"
                alt="Figure 3.1: Store Profile Settings panel"
                placeholderText="[merchant_profile_screenshot]"
              />
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-cinzel text-sm tracking-widest text-brown border-b border-gold-100 pb-2 uppercase flex items-center gap-2">
                  <Package size={16} className="text-gold-600" /> Catalog &amp; Product Management
                </h2>
                <p className="font-garamond text-sm text-muted mt-3 leading-relaxed">
                  Manage inventory levels, specify product categorization, weights, Compare Prices (strike-through discounts), and stock alerts.
                </p>
              </div>

              <div className="space-y-3 font-garamond text-sm text-deep">
                <h3 className="font-cinzel text-xs tracking-wider text-gold-700 font-semibold uppercase">Multi-Angle Image Slide Requirements:</h3>
                <p className="leading-relaxed text-xs text-muted">
                  To match the platform's luxury experience, the catalog supports up to <strong>5 detailed images per item</strong>. 
                  Adding exactly 5 images activates a clean swipeable carousel detail viewer for customer browsers.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-xs text-muted leading-relaxed">
                  <li>Image 1: Hero Front View / Showcase</li>
                  <li>Image 2: Reverse side details</li>
                  <li>Image 3: Texture/weaving magnification zoom</li>
                  <li>Image 4: Alternate mannequin styling perspective</li>
                  <li>Image 5: Model close-up or jewelry accessory lockup details</li>
                </ul>
              </div>

              <ScreenshotBox 
                src="/images/products_list.png"
                alt="Figure 4.1: Product Catalogue List View"
                placeholderText="[merchant_products_list_screenshot]"
              />

              <ScreenshotBox 
                src="/images/add_product_form.png"
                alt="Figure 4.2: Add Product Specification Form"
                placeholderText="[merchant_add_product_form_screenshot]"
              />
            </div>
          )}

          {activeTab === "logistics" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-cinzel text-sm tracking-widest text-brown border-b border-gold-100 pb-2 uppercase flex items-center gap-2">
                  <Truck size={16} className="text-gold-600" /> Logistics &amp; Fulfillment Workflow
                </h2>
                <p className="font-garamond text-sm text-muted mt-3 leading-relaxed">
                  Sellers handle logistics step-by-step directly from their console. Follow this operations path for every order:
                </p>
              </div>

              <div className="relative border-l border-gold-200 ml-3 pl-6 space-y-6">
                {[
                  { title: "1. Confirm Order", desc: "Click 'CONFIRM PAYMENT & ORDER' to accept payment and confirm stock availability." },
                  { title: "2. Pack & Prepare", desc: "Wrap the items and click 'START PACKING / PROCESS' to set the order in processing stage." },
                  { title: "3. Handover & Ship", desc: "Specify Courier (Delhivery, Blue Dart, etc.) and add the AWB Tracking Number to lock in the shipment." },
                  { title: "4. Out For Delivery", desc: "Mark the package 'DISPATCH OUT FOR DELIVERY' when the delivery driver starts final route dispatch." },
                  { title: "5. Mark Delivered", desc: "Select 'CONFIRM DELIVERY SUCCESS' to close logistics. This triggers the 7-day payment escrow hold window." }
                ].map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-9 top-1 w-5 h-5 bg-deep border border-gold-400 rounded-full flex items-center justify-center text-[10px] text-gold-400 font-cinzel font-bold">
                      {idx + 1}
                    </div>
                    <h4 className="font-cinzel text-xs font-semibold text-brown">{step.title}</h4>
                    <p className="font-garamond text-xs text-muted mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>

              <ScreenshotBox 
                src="/images/orders_list.png"
                alt="Figure 5.1: Incoming Orders Fulfillment Panel"
                placeholderText="[merchant_orders_list_screenshot]"
              />
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-cinzel text-sm tracking-widest text-brown border-b border-gold-100 pb-2 uppercase flex items-center gap-2">
                  <Wallet size={16} className="text-gold-600" /> Wallet Earnings &amp; Payout Withdrawals
                </h2>
                <p className="font-garamond text-sm text-muted mt-3 leading-relaxed">
                  Manage withdrawal requests, configure target settlement details, and monitor buyer protection holding schedules.
                </p>
              </div>

              <div className="space-y-3 font-garamond text-sm text-deep">
                <h3 className="font-cinzel text-xs tracking-wider text-gold-700 font-semibold uppercase">Escrow Observation Window:</h3>
                <p className="leading-relaxed text-xs text-muted">
                  Revenues from successfully delivered order items enter a <strong>7-day escrow hold</strong>. This protects the marketplace from dispute resolutions. Once released by the server, the balance moves to "Available to Withdraw" automatically.
                </p>
              </div>

              <div className="space-y-3 font-garamond text-sm text-deep">
                <h3 className="font-cinzel text-xs tracking-wider text-gold-700 font-semibold uppercase">Requesting Payout Transfers:</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted pl-1 leading-relaxed">
                  <li>Verify you have funds in your <strong className="text-brown">Available Balance</strong>.</li>
                  <li>Under <strong className="text-brown">Payout Settings</strong>, select Bank Transfer or UPI ID and save.</li>
                  <li>Go to the <strong className="text-brown">Request Withdrawal</strong> widget, enter the payout value, and submit.</li>
                  <li>Withdrawal requests are processed by platform administrators to bank accounts within 24 to 48 hours.</li>
                </ol>
              </div>

              <ScreenshotBox 
                src="/images/wallet.png"
                alt="Figure 6.1: Wallet Balance & Payout Settings"
                placeholderText="[merchant_wallet_screenshot]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
