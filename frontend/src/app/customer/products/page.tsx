"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Search, X, ChevronLeft, ChevronRight, Check, Star, Sparkles, Filter } from "lucide-react";
import { productApi } from "@/lib/api";
import { Product, ProductListResponse } from "@/types";
import ProductCard from "@/components/customer/ProductCard";

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest First" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "rating_avg:desc", label: "Top Rated" },
  { value: "total_sold:desc", label: "Best Selling" },
];

const CATEGORY_STORY_PILLS = [
  { id: "all", name: "All Collections", query: {} },
  { id: "kanchipuram", name: "Kanchipuram Silk", query: { category: "sarees", fabric: "kanchipuram" } },
  { id: "banarasi", name: "Banarasi Silk", query: { category: "sarees", fabric: "banarasi" } },
  { id: "temple", name: "Temple Jewellery", query: { category: "jewellery", fabric: "temple" } },
  { id: "cotton", name: "Cotton Sarees", query: { category: "sarees", fabric: "cotton" } },
  { id: "bridal", name: "Bridal Wear", query: { category: "bridal" } },
  { id: "organza", name: "Organza Sarees", query: { category: "sarees", fabric: "organza" } },
  { id: "chanderi", name: "Chanderi", query: { category: "sarees", fabric: "chanderi" } },
  { id: "kundan", name: "Kundan & Polki", query: { category: "jewellery", fabric: "kundan" } },
  { id: "silver", name: "Silver 925", query: { category: "jewellery", fabric: "silver" } },
];

const FABRIC_FILTERS = [
  "Silk", "Kanchipuram", "Banarasi", "Cotton", "Organza", "Chiffon", "Georgette", "Linen", "Chanderi", "Kundan", "Temple Gold"
];

const PRICE_RANGES = [
  { label: "Under ₹1,000", min: "", max: "1000" },
  { label: "₹1,000 - ₹3,000", min: "1000", max: "3000" },
  { label: "₹3,000 - ₹5,000", min: "3000", max: "5000" },
  { label: "Above ₹5,000", min: "5000", max: "" },
];

function ProductsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [dbCategories, setDbCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [dbTags, setDbTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [search, setSearch] = useState(params.get("search") || "");
  const [sort, setSort] = useState("created_at:desc");
  const [minPrice, setMinPrice] = useState(params.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") || "");
  const [selectedFabric, setSelectedFabric] = useState(params.get("fabric") || "");
  const [minRating, setMinRating] = useState(params.get("min_rating") || "");
  const [page, setPage] = useState(1);

  // Load Categories & Tags dynamically from Database
  useEffect(() => {
    productApi.categories().then((res) => {
      if (Array.isArray(res.data)) setDbCategories(res.data);
    }).catch(() => {});

    productApi.tags().then((res) => {
      if (Array.isArray(res.data)) setDbTags(res.data);
    }).catch(() => {});
  }, []);

  const categoryParam = params.get("category");
  const subcategoryParam = params.get("subcategory");
  const featuredParam = params.get("is_featured");
  const searchParam = params.get("search");
  const fabricParam = params.get("fabric");
  const minRatingParam = params.get("min_rating");

  const lastFiltersRef = useRef({ 
    category: categoryParam, 
    subcategory: subcategoryParam,
    featured: featuredParam, 
    search: searchParam,
    fabric: fabricParam,
    minRating: minRatingParam 
  });

  const fetchProducts = async (currentPage = page) => {
    setIsLoading(true);
    const [sort_by, sort_order] = sort.split(":");
    try {
      const { data: res } = await productApi.list({
        page: currentPage,
        page_size: 16,
        search: search || undefined,
        sort_by,
        sort_order,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        category: categoryParam || undefined,
        subcategory: subcategoryParam || undefined,
        is_featured: featuredParam || undefined,
        fabric: selectedFabric || fabricParam || undefined,
        min_rating: minRating || undefined,
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page, sort, minPrice, maxPrice, selectedFabric, minRating, categoryParam, subcategoryParam, featuredParam, searchParam]);

  useEffect(() => {
    const prev = lastFiltersRef.current;
    if (
      prev.category !== categoryParam ||
      prev.subcategory !== subcategoryParam ||
      prev.featured !== featuredParam ||
      prev.search !== searchParam ||
      prev.fabric !== fabricParam ||
      prev.minRating !== minRatingParam
    ) {
      lastFiltersRef.current = {
        category: categoryParam,
        subcategory: subcategoryParam,
        featured: featuredParam,
        search: searchParam,
        fabric: fabricParam,
        minRating: minRatingParam
      };
      if (searchParam !== null) setSearch(searchParam || "");
      if (fabricParam !== null) setSelectedFabric(fabricParam || "");
      if (minRatingParam !== null) setMinRating(minRatingParam || "");
      setPage(1);
    }
  }, [categoryParam, subcategoryParam, featuredParam, searchParam, fabricParam, minRatingParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1);
  };

  const applyFabricFilter = (fab: string) => {
    if (selectedFabric.toLowerCase() === fab.toLowerCase()) {
      setSelectedFabric("");
    } else {
      setSelectedFabric(fab);
    }
    setPage(1);
  };

  const applyPriceRange = (min: string, max: string) => {
    if (minPrice === min && maxPrice === max) {
      setMinPrice("");
      setMaxPrice("");
    } else {
      setMinPrice(min);
      setMaxPrice(max);
    }
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedFabric("");
    setMinRating("");
    setPage(1);
    router.push("/customer/products");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-[#1C2E24] font-garamond px-4 md:px-6 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F0ECE1] pb-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            CATALOG COLLECTION
          </span>
          <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">
            {subcategoryParam ? subcategoryParam : categoryParam ? categoryParam.toUpperCase() : "Luxury Catalog & Handlooms"}
          </h1>
          <p className="text-xs text-[#8C9890] mt-0.5">Explore authentic Kanchipuram silks, bridal wear, and handcrafted jewellery</p>
        </div>
      </div>

      {/* Horizontal Story Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_STORY_PILLS.map((pill) => {
          let isActive = false;
          if (pill.id === "all") {
            isActive = !categoryParam && !selectedFabric;
          } else {
            if (pill.query.category && pill.query.fabric) {
              isActive = categoryParam === pill.query.category && selectedFabric.toLowerCase() === pill.query.fabric.toLowerCase();
            } else if (pill.query.category) {
              isActive = categoryParam === pill.query.category && !selectedFabric;
            }
          }

          return (
            <button
              key={pill.id}
              onClick={() => {
                if (pill.id === "all") {
                  clearAllFilters();
                } else {
                  setSelectedFabric(pill.query.fabric || "");
                  if (pill.query.category) {
                    router.push(`/customer/products?category=${pill.query.category}${pill.query.fabric ? `&fabric=${pill.query.fabric}` : ""}`);
                  }
                  setPage(1);
                }
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isActive
                  ? "bg-[#0D2619] text-white border-[#0D2619] shadow-2xs font-bold"
                  : "bg-white text-[#556B5D] border-[#E5E0D5] hover:border-[#0D2619] hover:bg-[#FAF8F3]"
              }`}
            >
              {pill.id === "all" ? <Sparkles size={13} className="text-amber-400" /> : null}
              {pill.name}
            </button>
          );
        })}
      </div>

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="w-full sm:w-80 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search silk, gold, sarees..."
            className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
          />
        </form>

        <div className="flex gap-2 w-full sm:w-auto items-center">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-bold text-[#1C2E24] px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#0D2619] flex-1 sm:w-48"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden inline-flex items-center gap-1.5 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs"
          >
            <Filter size={13} />
            <span>FILTERS</span>
          </button>
        </div>
      </div>

      {/* Main Catalog Layout (Sidebar + Product Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Filter (Desktop Sidebar / Mobile Drawer) */}
        <aside className={`lg:block ${showMobileFilters ? "fixed inset-0 z-50 bg-black/60 flex justify-end" : "hidden"}`}>
          <div className={`${showMobileFilters ? "w-4/5 max-w-sm bg-white h-full overflow-y-auto p-6 animate-fade-left" : "bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs sticky top-24"}`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0ECE1]">
              <h3 className="font-cormorant text-lg font-bold text-[#1C2E24] flex items-center gap-1.5">
                <SlidersHorizontal size={15} className="text-[#0D2619]" /> Category &amp; Filters
              </h3>
              {(selectedFabric || minPrice || maxPrice || search || categoryParam || minRating) && (
                <button onClick={clearAllFilters} className="text-xs text-[#0D2619] font-bold hover:underline">
                  Clear All
                </button>
              )}
              {showMobileFilters && (
                <button onClick={() => setShowMobileFilters(false)}><X size={18} className="text-[#8C9890]" /></button>
              )}
            </div>

            {/* Dynamic Category Taxonomy */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-[#8C9890] tracking-wider mb-2 uppercase">Category</h4>
              <div className="space-y-1 text-xs font-bold">
                <button
                  onClick={() => router.push("/customer/products")}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                    !categoryParam ? "bg-[#0D2619] text-white" : "hover:bg-[#FAF8F3] text-[#556B5D]"
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
                    ]
                ).map((cat) => {
                  const isCatActive = categoryParam === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => router.push(`/customer/products?category=${cat.slug}`)}
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
            <div className="mb-6">
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
                      onClick={() => applyFabricFilter(fab)}
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
            <div className="mb-6">
              <h4 className="text-xs font-bold text-[#8C9890] tracking-wider mb-2.5 uppercase">Price Range</h4>
              <div className="space-y-1 text-xs font-bold">
                {PRICE_RANGES.map((pr) => {
                  const isPrActive = minPrice === pr.min && maxPrice === pr.max;
                  return (
                    <button
                      key={pr.label}
                      onClick={() => applyPriceRange(pr.min, pr.max)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                        isPrActive ? "bg-[#0D2619] text-white" : "text-[#556B5D] hover:bg-[#FAF8F3]"
                      }`}
                    >
                      <span>{pr.label}</span>
                      {isPrActive && <Check size={12} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-[#8C9890] tracking-wider mb-2.5 uppercase">Customer Rating</h4>
              <div className="space-y-1 text-xs font-bold">
                {["4", "3"].map((r) => (
                  <button
                    key={r}
                    onClick={() => { setMinRating(minRating === r ? "" : r); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-1 transition-colors ${
                      minRating === r ? "bg-[#0D2619] text-white" : "text-[#556B5D] hover:bg-[#FAF8F3]"
                    }`}
                  >
                    <div className="flex items-center text-amber-400"><Star size={12} fill="currentColor" /></div>
                    <span>{r}★ &amp; above</span>
                  </button>
                ))}
              </div>
            </div>

            {showMobileFilters && (
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-[#0D2619] text-white mt-4 py-3 rounded-xl text-xs font-bold tracking-widest shadow-xs"
              >
                APPLY FILTERS
              </button>
            )}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-4">
          {/* Active Filter Chips */}
          {(selectedFabric || minPrice || maxPrice || search || minRating) && (
            <div className="flex flex-wrap gap-2 items-center bg-[#FAF8F3] p-3 rounded-2xl border border-[#E5E0D5]">
              <span className="text-[10px] font-bold tracking-wider text-[#8C9890] uppercase">ACTIVE FILTERS:</span>
              {selectedFabric && (
                <span className="bg-[#0D2619] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  {selectedFabric} <X size={12} className="cursor-pointer" onClick={() => setSelectedFabric("")} />
                </span>
              )}
              {search && (
                <span className="bg-[#0D2619] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  &ldquo;{search}&rdquo; <X size={12} className="cursor-pointer" onClick={() => setSearch("")} />
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="bg-[#0D2619] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  ₹{minPrice || "0"} - ₹{maxPrice || "Max"} <X size={12} className="cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); }} />
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-red-600 font-bold hover:underline ml-auto">Reset All</button>
            </div>
          )}

          {/* Results count */}
          {data && (
            <p className="text-xs text-[#8C9890]">
              Showing <strong className="text-[#1C2E24]">{data.items.length}</strong> of {data.total} luxury products
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-white border border-[#E5E0D5] rounded-3xl p-3">
                  <div className="aspect-[3/4] bg-[#FAF8F3] rounded-2xl mb-3" />
                  <div className="h-3 bg-[#FAF8F3] rounded mb-2 w-3/4" />
                  <div className="h-3 bg-[#FAF8F3] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-20 bg-white border border-[#E5E0D5] rounded-3xl p-8 shadow-xs">
              <p className="font-cormorant text-2xl text-[#1C2E24] mb-2 font-bold">No Products Found</p>
              <p className="text-xs text-[#8C9890] mb-6">Try adjusting your fabric, price range, or category filters.</p>
              <button onClick={clearAllFilters} className="border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all">Clear All Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
              {data?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 border border-[#E5E0D5] bg-white text-[#1C2E24] flex items-center justify-center hover:border-[#0D2619] transition-colors disabled:opacity-40 rounded-xl"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-bold transition-colors rounded-xl ${
                    p === page ? "bg-[#0D2619] text-white shadow-2xs" : "border border-[#E5E0D5] bg-white text-[#1C2E24] hover:border-[#0D2619]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="w-8 h-8 border border-[#E5E0D5] bg-white text-[#1C2E24] flex items-center justify-center hover:border-[#0D2619] transition-colors disabled:opacity-40 rounded-xl"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><span className="text-xs text-[#8C9890] font-bold">LOADING CATALOG...</span></div>}>
      <ProductsContent />
    </Suspense>
  );
}
