"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X, Loader2, CheckCircle, Search, Navigation } from "lucide-react";
import { useDeliveryLocationStore, DeliveryLocation } from "@/store/deliveryLocationStore";
import { getEstimatedDelivery } from "@/lib/utils";
import toast from "react-hot-toast";

interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Pincode: string;
}

interface PincodeAPIResponse {
  Status: string;
  PostOffice?: PostOffice[];
  Message?: string;
}

export default function DeliveryLocationModal() {
  const { location, setLocation, isModalOpen, closeModal } = useDeliveryLocationStore();
  const [pincode, setPincode] = useState(location?.pincode || "");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<DeliveryLocation | null>(null);
  const [lookupError, setLookupError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Pre-populate with existing location
      if (location?.pincode) setPincode(location.pincode);
    } else {
      setLookupResult(null);
      setLookupError("");
    }
  }, [isModalOpen, location]);

  // Auto-lookup when pincode reaches 6 digits
  useEffect(() => {
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      handleLookup(pincode);
    } else {
      setLookupResult(null);
      setLookupError("");
    }
  }, [pincode]);

  const handleLookup = async (code: string) => {
    setIsLookingUp(true);
    setLookupResult(null);
    setLookupError("");

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
        cache: "force-cache",
      });

      if (!response.ok) throw new Error("Network error");

      const data: PincodeAPIResponse[] = await response.json();
      const result = data[0];

      if (result.Status === "Success" && result.PostOffice && result.PostOffice.length > 0) {
        const po = result.PostOffice[0];
        const loc: DeliveryLocation = {
          pincode: code,
          city: po.Name,
          district: po.District,
          state: po.State,
        };
        setLookupResult(loc);
        setLookupError("");
      } else {
        setLookupResult(null);
        setLookupError("Invalid PIN code. Please enter a valid 6-digit Indian PIN code.");
      }
    } catch {
      setLookupResult(null);
      setLookupError("Unable to look up this PIN code. Please check your connection and try again.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleConfirm = () => {
    if (!lookupResult) return;
    setLocation(lookupResult);
    toast.success(`Delivering to ${lookupResult.district}, ${lookupResult.state} 📦`);
    closeModal();
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
  };

  const estimatedDelivery = lookupResult ? getEstimatedDelivery(lookupResult.pincode) : "";

  if (!isModalOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* ── Modal Sheet (bottom-sheet on mobile, centered on desktop) ── */}
      <div
        className="fixed z-[9999] w-full left-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Select Delivery Location"
      >
        <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md overflow-hidden animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F0ECE1]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#EBF5ED] rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-[#0D2619]" />
              </div>
              <div>
                <h2 className="font-cormorant text-lg font-bold text-[#1C2E24] leading-tight">
                  Select Delivery Location
                </h2>
                <p className="text-[10px] text-[#8C9890] leading-none mt-0.5">
                  Enter PIN code to check delivery availability
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F2EA] transition-colors text-[#8C9890]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="px-5 py-5 space-y-4">

            {/* Current Location Display (if set) */}
            {location && !lookupResult && (
              <div className="flex items-center gap-3 p-3 bg-[#F0F9F1] border border-[#C8E6C9] rounded-xl">
                <Navigation size={16} className="text-[#2E7D32] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#1C2E24]">
                    Currently delivering to
                  </p>
                  <p className="text-[11px] text-[#2E7D32] font-semibold truncate">
                    {location.district}, {location.state} — {location.pincode}
                  </p>
                </div>
              </div>
            )}

            {/* PIN Code Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1C2E24]">
                Enter PIN Code
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]"
                />
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 522001"
                  value={pincode}
                  onChange={handlePincodeChange}
                  maxLength={6}
                  className="w-full pl-10 pr-12 py-3.5 bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl text-sm font-bold text-[#1C2E24] font-garamond tracking-widest focus:outline-none focus:border-[#0D2619] focus:ring-2 focus:ring-[#0D2619]/10 transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-[#BDB5A6]"
                  style={{ fontSize: "16px" }} /* Prevent iOS zoom */
                />
                {/* Loading / clear button */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {isLookingUp ? (
                    <Loader2 size={16} className="animate-spin text-[#0D2619]" />
                  ) : pincode.length > 0 ? (
                    <button
                      onClick={() => { setPincode(""); setLookupResult(null); setLookupError(""); }}
                      className="text-[#8C9890] hover:text-[#1C2E24] transition-colors"
                      aria-label="Clear"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Character count hint */}
              {pincode.length > 0 && pincode.length < 6 && (
                <p className="text-[10px] text-[#8C9890]">
                  Enter {6 - pincode.length} more digit{pincode.length < 5 ? "s" : ""}…
                </p>
              )}
            </div>

            {/* ── Error State ── */}
            {lookupError && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <X size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{lookupError}</p>
              </div>
            )}

            {/* ── Success / Preview State ── */}
            {lookupResult && !lookupError && (
              <div className="space-y-3">
                {/* Location Preview Card */}
                <div className="p-4 bg-[#F0F9F1] border border-[#C8E6C9] rounded-xl space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-[#2E7D32] flex-shrink-0" />
                      <span className="text-xs font-bold text-[#1C2E24]">Delivery available!</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0D2619] bg-[#C8E6C9] px-2 py-0.5 rounded-full">
                      PIN {lookupResult.pincode}
                    </span>
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2.5 border border-[#E5E0D5]">
                      <p className="text-[#8C9890] text-[9px] uppercase font-bold tracking-wide">Post Office</p>
                      <p className="font-bold text-[#1C2E24] mt-0.5 truncate">{lookupResult.city}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-[#E5E0D5]">
                      <p className="text-[#8C9890] text-[9px] uppercase font-bold tracking-wide">District</p>
                      <p className="font-bold text-[#1C2E24] mt-0.5 truncate">{lookupResult.district}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-[#E5E0D5]">
                    <p className="text-[#8C9890] text-[9px] uppercase font-bold tracking-wide">State</p>
                    <p className="font-bold text-[#1C2E24] mt-0.5">{lookupResult.state}</p>
                  </div>

                  {/* Estimated Delivery */}
                  {estimatedDelivery && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#C8E6C9]">
                      <span className="text-lg">📦</span>
                      <div>
                        <p className="text-[9px] text-[#556B5D] font-bold uppercase tracking-wide">Estimated Delivery</p>
                        <p className="text-xs font-bold text-[#0D2619]">By {estimatedDelivery}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirm}
                  className="w-full bg-[#0D2619] hover:bg-[#19402B] active:scale-[0.99] text-white py-3.5 rounded-xl font-garamond font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <MapPin size={15} />
                  Deliver to {lookupResult.district}, {lookupResult.state}
                </button>
              </div>
            )}

            {/* ── Popular Pincode Suggestions ── */}
            {!lookupResult && !lookupError && pincode.length === 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#8C9890] uppercase tracking-wide">Popular Locations</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Guntur", pincode: "522001" },
                    { label: "Vijayawada", pincode: "520001" },
                    { label: "Hyderabad", pincode: "500001" },
                    { label: "Bengaluru", pincode: "560001" },
                    { label: "Chennai", pincode: "600001" },
                    { label: "Mumbai", pincode: "400001" },
                  ].map((s) => (
                    <button
                      key={s.pincode}
                      onClick={() => setPincode(s.pincode)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#F0ECE5] border border-[#E5E0D5] rounded-full text-[11px] font-bold text-[#1C2E24] transition-colors"
                    >
                      <MapPin size={11} className="text-[#0D2619]" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Footer Info ── */}
          <div className="px-5 pb-6 pt-1">
            <p className="text-[10px] text-center text-[#8C9890] leading-relaxed">
              🇮🇳 We deliver across India via trusted courier partners. Free delivery on orders above ₹999.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
