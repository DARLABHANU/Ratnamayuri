"use client";

import { useState } from "react";
import { 
  Key, LineChart, Package, 
  Truck, Wallet, AlertCircle 
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
      <div className="border border-dashed border-[#E5E0D5] bg-[#FAF8F3] p-8 text-center rounded-2xl">
        <p className="font-bold text-xs text-[#0D2619] uppercase">{placeholderText}</p>
        <p className="text-xs text-[#8C9890] mt-1.5 italic">
          (Save image as <span className="font-mono bg-white px-1.5 py-0.5 border border-[#E5E0D5] text-[#0D2619] text-[10px] rounded">public{src}</span>)
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E0D5] overflow-hidden rounded-2xl shadow-xs bg-white relative min-h-[100px]">
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-auto object-cover border-b border-[#F0ECE1] transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0 absolute"
        }`}
      />
      {!loaded && (
        <div className="p-8 text-center">
          <div className="w-5 h-5 border-2 border-[#0D2619] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#8C9890]">Loading screenshot...</p>
        </div>
      )}
      {loaded && (
        <div className="p-3 bg-[#FAF8F3]">
          <p className="text-xs text-[#6B7A70] italic text-center">{alt}</p>
        </div>
      )}
    </div>
  );
}

export default function MerchantInstructionsPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      {/* Page Header */}
      <div>
        <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Merchant Operations Manual</h1>
        <p className="text-xs md:text-sm text-[#6B7A70] mt-1 max-w-2xl leading-relaxed">
          Operational guide and step-by-step documentation for merchants. Review portal usage instructions below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar List */}
        <div className="md:col-span-1 space-y-1 bg-white border border-[#E5E0D5] p-2 rounded-3xl shadow-xs">
          {SECTIONS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-bold transition-all rounded-2xl ${
                  activeTab === tab.id 
                    ? "bg-[#0D2619] text-white shadow-2xs" 
                    : "text-[#556B5D] hover:bg-[#FAF8F3] hover:text-[#1C2E24]"
                }`}
              >
                <Icon size={15} className={activeTab === tab.id ? "text-white" : "text-[#0D2619]"} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Details Area */}
        <div className="md:col-span-3 bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs min-h-[500px]">
          {activeTab === "login" && (
            <div className="space-y-6">
              <div className="border-b border-[#F0ECE1] pb-3">
                <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] flex items-center gap-2">
                  <Key size={18} className="text-[#0D2619]" /> Portal Access & Authentication
                </h2>
                <p className="text-xs text-[#8C9890] mt-1">Credentials and account security for merchant access</p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-[#556B5D]">
                <p>To access the merchant dashboard, log in with your assigned seller account credentials:</p>
                <div className="bg-[#FAF8F3] p-4 border border-[#E5E0D5] rounded-2xl font-mono text-xs text-[#0D2619] space-y-1">
                  <div><strong>Email:</strong> mitesir345@copawoke.com</div>
                  <div><strong>Password:</strong> Bhanuusr@786</div>
                </div>
              </div>

              <ScreenshotBox 
                src="/images/merchant/merchant-login.png" 
                alt="Merchant Login Screen" 
                placeholderText="Screenshot 1: Seller Authentication Form"
              />
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="border-b border-[#F0ECE1] pb-3">
                <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] flex items-center gap-2">
                  <LineChart size={18} className="text-[#0D2619]" /> Business Overview & Analytics
                </h2>
                <p className="text-xs text-[#8C9890] mt-1">Understanding store revenue and orders analytics</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: "Total Sales", desc: "Gross revenue generated by customer orders" },
                  { label: "Total Orders", desc: "Count of all placed customer orders" },
                  { label: "Total Earnings", desc: "Net revenue after platform margin deduction" },
                  { label: "Available Balance", desc: "Funds ready for withdrawal request" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#FAF8F3] p-4 border border-[#E5E0D5] rounded-2xl">
                    <span className="font-bold text-[#1C2E24] block">{item.label}</span>
                    <span className="text-[#8C9890] text-[11px] mt-0.5 block">{item.desc}</span>
                  </div>
                ))}
              </div>

              <ScreenshotBox 
                src="/images/merchant/merchant-dashboard.png" 
                alt="Seller Dashboard Overview" 
                placeholderText="Screenshot 2: Seller Dashboard Analytics Cards"
              />
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="border-b border-[#F0ECE1] pb-3">
                <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] flex items-center gap-2">
                  <AlertCircle size={18} className="text-[#0D2619]" /> Store Profile Setup (Mandatory)
                </h2>
                <p className="text-xs text-[#8C9890] mt-1">Configuring business and bank payout details</p>
              </div>

              <p className="text-xs text-[#556B5D] leading-relaxed">
                Before listing products, complete your Store Profile with Business Name, Description, GSTIN, Bank Account Number, and IFSC Code.
              </p>

              <ScreenshotBox 
                src="/images/merchant/merchant-profile.png" 
                alt="Store Profile Settings" 
                placeholderText="Screenshot 3: Merchant Profile Configuration Form"
              />
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="border-b border-[#F0ECE1] pb-3">
                <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] flex items-center gap-2">
                  <Package size={18} className="text-[#0D2619]" /> Catalog & Product Management
                </h2>
                <p className="text-xs text-[#8C9890] mt-1">Adding single products or bulk uploading catalog CSVs</p>
              </div>

              <p className="text-xs text-[#556B5D] leading-relaxed">
                Manage products, set prices, stock levels, and upload up to 5 multi-angle slideshow images per item.
              </p>

              <ScreenshotBox 
                src="/images/merchant/merchant-products.png" 
                alt="Products Management View" 
                placeholderText="Screenshot 4: Products Catalog List & Add Modal"
              />
            </div>
          )}

          {activeTab === "logistics" && (
            <div className="space-y-6">
              <div className="border-b border-[#F0ECE1] pb-3">
                <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] flex items-center gap-2">
                  <Truck size={18} className="text-[#0D2619]" /> Logistics & Fulfillment Workflow
                </h2>
                <p className="text-xs text-[#8C9890] mt-1">Processing incoming customer orders</p>
              </div>

              <p className="text-xs text-[#556B5D] leading-relaxed">
                Review new orders, update status (Processing, Shipped, Delivered), and manage customer fulfillment.
              </p>

              <ScreenshotBox 
                src="/images/merchant/merchant-orders.png" 
                alt="Store Orders Management" 
                placeholderText="Screenshot 5: Orders Management Table"
              />
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="space-y-6">
              <div className="border-b border-[#F0ECE1] pb-3">
                <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] flex items-center gap-2">
                  <Wallet size={18} className="text-[#0D2619]" /> Wallet Earnings & Payout Withdrawals
                </h2>
                <p className="text-xs text-[#8C9890] mt-1">Requesting bank transfer payouts</p>
              </div>

              <p className="text-xs text-[#556B5D] leading-relaxed">
                Track available balance and submit withdrawal requests. Payouts are transferred directly to your registered bank account.
              </p>

              <ScreenshotBox 
                src="/images/merchant/merchant-wallet.png" 
                alt="Wallet Payout Requests" 
                placeholderText="Screenshot 6: Wallet Payout Request Interface"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
