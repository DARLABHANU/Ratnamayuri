"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { productApi } from "@/lib/api";

const FABRIC_FILTERS = [
  "Silk", "Kanchipuram", "Banarasi", "Cotton", "Organza", "Chiffon", "Georgette", "Linen", "Chanderi", "Kundan", "Temple Gold"
];

const PRICE_RANGES = [
  { label: "Under ₹1,000", min: "", max: "1000" },
  { label: "₹1,000 - ₹3,000", min: "1000", max: "3000" },
  { label: "₹3,000 - ₹5,000", min: "3000", max: "5000" },
  { label: "Above ₹5,000", min: "5000", max: "" },
];

interface FilterSidebarProps {
  selectedCategory?: string;
  selectedFabric?: string;
  minPrice?: string;
  maxPrice?: string;
  onCategorySelect?: (categorySlug: string) => void;
  onFabricSelect?: (fabricName: string) => void;
  onPriceRangeSelect?: (min: string, max: string) => void;
  onClearAll?: () => void;
  showMobileFilters?: boolean;
  onCloseMobileFilters?: () => void;
}

export default function FilterSidebar({
  selectedCategory = "",
  selectedFabric = "",
  minPrice = "",
  maxPrice = "",
  onCategorySelect,
  onFabricSelect,
  onPriceRangeSelect,
  onClearAll,
  showMobileFilters = false,
  onCloseMobileFilters,
}: FilterSidebarProps) {
  const [dbCategories, setDbCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [dbTags, setDbTags] = useState<string[]>([]);

  useEffect(() => {
    productApi.categories().then((res) => {
      if (Array.isArray(res.data)) setDbCategories(res.data);
    }).catch(() => {});

    productApi.tags().then((res) => {
      if (Array.isArray(res.data)) setDbTags(res.data);
    }).catch(() => {});
  }, []);

  const hasActiveFilters = Boolean(selectedCategory || selectedFabric || minPrice || maxPrice);

  const sidebarBody = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
        <h3 className="font-cormorant text-lg font-bold text-[#1C2E24] flex items-center gap-1.5">
          <SlidersHorizontal size={15} className="text-[#0D2619]" /> Category &amp; Filters
        </h3>
        {hasActiveFilters && onClearAll && (
          <button onClick={onClearAll} className="text-xs text-[#0D2619] font-bold hover:underline">
            Clear All
          </button>
        )}
        {showMobileFilters && onCloseMobileFilters && (
          <button onClick={onCloseMobileFilters} aria-label="Close filters">
            <X size={18} className="text-[#8C9890]" />
          </button>
        )}
      </div>

      {/* Dynamic Category Taxonomy */}
      <div>
        <h4 className="text-xs font-bold text-[#8C9890] tracking-wider mb-2 uppercase">Category</h4>
        <div className="space-y-1 text-xs font-bold">
          <button
            onClick={() => onCategorySelect?.("")}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
              !selectedCategory ? "bg-[#0D2619] text-white" : "hover:bg-[#FAF8F3] text-[#556B5D]"
            }`}
          >
            <span>All Items</span>
          </button>
          {(dbCategories.length > 0
            ? dbCategories
            : [
                { id: 1, name: "Silk Sarees & Weaves", slug: "sarees" },
                { id: 2, name: "Luxury Jewellery", slug: "jewellery" },
                { id: 3, name: "Bridal Collection", slug: "bridal" },
                { id: 4, name: "Dresses & Kurtis", slug: "dresses" },
              ]
          ).map((cat) => {
            const isCatActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
            return (
              <button
                key={cat.slug}
                onClick={() => onCategorySelect?.(cat.slug)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                  isCatActive ? "bg-[#0D2619] text-white" : "hover:bg-[#FAF8F3] text-[#556B5D]"
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Fabric, Material & Craft Filter Chips */}
      <div>
        <h4 className="text-xs font-bold text-[#8C9890] tracking-wider mb-2.5 uppercase">Fabric / Material / Craft</h4>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto scrollbar-none pr-1">
          {(dbTags.length > 0
            ? Array.from(new Set([...dbTags, ...FABRIC_FILTERS]))
            : FABRIC_FILTERS
          ).map((fab) => {
            const isFabActive = selectedFabric.toLowerCase() === fab.toLowerCase();
            return (
              <button
                key={fab}
                onClick={() => onFabricSelect?.(fab)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                  isFabActive
                    ? "bg-[#0D2619] text-white border-[#0D2619]"
                    : "bg-white text-[#556B5D] border-[#E5E0D5] hover:border-[#0D2619]"
                }`}
              >
                {isFabActive && <Check size={11} />}
                {fab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Ranges */}
      <div>
        <h4 className="text-xs font-bold text-[#8C9890] tracking-wider mb-2.5 uppercase">Price Range</h4>
        <div className="space-y-1 text-xs font-bold">
          {PRICE_RANGES.map((pr) => {
            const isPrActive = minPrice === pr.min && maxPrice === pr.max;
            return (
              <button
                key={pr.label}
                onClick={() => onPriceRangeSelect?.(pr.min, pr.max)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                  isPrActive ? "bg-[#0D2619] text-white" : "hover:bg-[#FAF8F3] text-[#556B5D]"
                }`}
              >
                <span>{pr.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <aside className={`lg:block ${showMobileFilters ? "fixed inset-0 z-50 bg-black/60 flex justify-end" : "hidden"}`}>
      <div className={`${showMobileFilters ? "w-4/5 max-w-sm bg-white h-full overflow-y-auto p-6 animate-fade-left" : "bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs sticky top-24"}`}>
        {sidebarBody}
      </div>
    </aside>
  );
}
