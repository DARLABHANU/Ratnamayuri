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
  const featuredParam = params.get("is_featured");
  const searchParam = params.get("search");
  const fabricParam = params.get("fabric");
  const minRatingParam = params.get("min_rating");

  const lastFiltersRef = useRef({ 
    category: categoryParam, 
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
        is_featured: featuredParam || undefined,
        fabric: selectedFabric || fabricParam || undefined,
        min_rating: minRating || undefined
      });
      setData(res);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtersChanged =
      lastFiltersRef.current.category !== categoryParam ||
      lastFiltersRef.current.featured !== featuredParam ||
      lastFiltersRef.current.search !== searchParam ||
      lastFiltersRef.current.fabric !== fabricParam ||
      lastFiltersRef.current.minRating !== minRatingParam;

    if (filtersChanged) {
      lastFiltersRef.current = { 
        category: categoryParam, 
        featured: featuredParam, 
        search: searchParam,
        fabric: fabricParam,
        minRating: minRatingParam 
      };
      setSearch(searchParam || "");
      if (fabricParam) setSelectedFabric(fabricParam);
      if (minRatingParam) setMinRating(minRatingParam);
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    fetchProducts();
  }, [page, sort, categoryParam, featuredParam, searchParam, fabricParam, minRatingParam, selectedFabric, minRating]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1);
  };

  const applyFabricFilter = (fabric: string) => {
    const nextFabric = selectedFabric === fabric ? "" : fabric;
    setSelectedFabric(nextFabric);
    setPage(1);
  };

  const applyPriceRange = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedFabric("");
    setMinRating("");
    router.push("/customer/products");
    setPage(1);
  };

  const getPageTitle = () => {
    if (featuredParam === "true") return <>Featured <em className="italic">Collection</em></>;
    if (categoryParam === "jewellery") return <>Luxury <em className="italic">Jewellery</em></>;
    if (categoryParam === "sarees") return <>Silk <em className="italic">Sarees & Ethnic</em></>;
    if (categoryParam === "bridal") return <>Bridal <em className="italic">Couture</em></>;
    if (selectedFabric) return <>{selectedFabric} <em className="italic">Special Edition</em></>;
    return <>All <em className="italic">Collections</em></>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="mb-6">
        <span className="section-tag">RATNAMAYURI BOUTIQUE</span>
        <h1 className="section-title text-2xl md:text-3xl">{getPageTitle()}</h1>
        <div className="divider-gold mx-0 mt-3" />
      </div>

      {/* Top Story Category Pills (Meesho/Amazon style visual filter bar) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {CATEGORY_STORY_PILLS.map((pill) => {
          const isActive = 
            (pill.id === "all" && !categoryParam && !selectedFabric) ||
            (pill.query.category && categoryParam === pill.query.category && (!pill.query.fabric || selectedFabric === pill.query.fabric)) ||
            (pill.query.fabric && selectedFabric === pill.query.fabric);

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
              className={`px-4 py-2 rounded-full font-cinzel text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isActive
                  ? "bg-deep text-gold-400 border-gold-500 shadow-md font-semibold"
                  : "bg-ivory text-brown border-gold-200 hover:border-gold-400 hover:bg-gold-50"
              }`}
            >
              {pill.id === "all" ? <Sparkles size={13} className="text-gold-500" /> : null}
              {pill.name}
            </button>
          );
        })}
      </div>

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="w-full sm:w-80 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search silk, gold, sarees..."
            className="input-field pl-9 py-2 text-xs"
          />
        </form>

        <div className="flex gap-2 w-full sm:w-auto items-center">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="input-field font-cinzel text-xs tracking-wide py-2 flex-1 sm:w-48"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden btn-outline flex items-center gap-1.5 px-4 py-2 text-xs whitespace-nowrap"
          >
            <Filter size={13} />
            FILTERS
          </button>
        </div>
      </div>

      {/* Main Catalog Layout (Sidebar + Product Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Filter (Desktop Sidebar / Mobile Drawer) */}
        <aside className={`lg:block ${showMobileFilters ? "fixed inset-0 z-50 bg-black/60 flex justify-end" : "hidden"}`}>
          <div className={`${showMobileFilters ? "w-4/5 max-w-sm bg-white h-full overflow-y-auto p-6 animate-fade-left" : "card p-5 sticky top-24"}`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gold-100">
              <h3 className="font-cinzel text-xs font-bold tracking-widest text-brown flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-gold-600" /> CATEGORY & FILTERS
              </h3>
              {(selectedFabric || minPrice || maxPrice || search || categoryParam || minRating) && (
                <button onClick={clearAllFilters} className="text-xs text-gold-700 hover:underline font-garamond">
                  Clear All
                </button>
              )}
              {showMobileFilters && (
                <button onClick={() => setShowMobileFilters(false)}><X size={18} className="text-muted" /></button>
              )}
            </div>

            {/* Dynamic Category Taxonomy */}
            <div className="mb-6">
              <h4 className="font-cinzel text-[11px] font-semibold text-muted tracking-wider mb-2 uppercase">Category</h4>
              <div className="space-y-1 font-garamond text-sm">
                <button
                  onClick={() => router.push("/customer/products")}
                  className={`w-full text-left px-2.5 py-1.5 rounded transition-colors flex items-center justify-between text-xs ${
                    !categoryParam ? "bg-gold-100 font-bold text-deep" : "hover:bg-gold-50 text-brown"
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
                      className={`w-full text-left px-2.5 py-1.5 rounded transition-colors flex items-center justify-between text-xs ${
                        isCatActive ? "bg-gold-100 font-bold text-deep" : "hover:bg-gold-50 text-brown"
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
              <h4 className="font-cinzel text-[11px] font-semibold text-muted tracking-wider mb-2.5 uppercase">Fabric / Material / Craft</h4>
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
                      className={`px-2.5 py-1 rounded text-xs transition-all font-garamond flex items-center gap-1 border ${
                        isFabActive
                          ? "bg-deep text-gold-400 border-gold-500 font-semibold"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gold-300"
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
              <h4 className="font-cinzel text-[11px] font-semibold text-muted tracking-wider mb-2.5 uppercase">Price Range</h4>
              <div className="space-y-1.5">
                {PRICE_RANGES.map((pr) => {
                  const isPrActive = minPrice === pr.min && maxPrice === pr.max;
                  return (
                    <button
                      key={pr.label}
                      onClick={() => applyPriceRange(pr.min, pr.max)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between font-garamond ${
                        isPrActive ? "bg-gold-100 text-deep font-bold" : "text-gray-700 hover:bg-gold-50"
                      }`}
                    >
                      <span>{pr.label}</span>
                      {isPrActive && <Check size={12} className="text-gold-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="mb-6">
              <h4 className="font-cinzel text-[11px] font-semibold text-muted tracking-wider mb-2.5 uppercase">Customer Rating</h4>
              <div className="space-y-1">
                {["4", "3"].map((r) => (
                  <button
                    key={r}
                    onClick={() => { setMinRating(minRating === r ? "" : r); setPage(1); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center gap-1 font-garamond ${
                      minRating === r ? "bg-gold-100 text-deep font-bold" : "text-gray-700 hover:bg-gold-50"
                    }`}
                  >
                    <div className="flex items-center text-amber-500"><Star size={12} fill="currentColor" /></div>
                    <span>{r}★ & above</span>
                  </button>
                ))}
              </div>
            </div>

            {showMobileFilters && (
              <button
                onClick={() => setShowMobileFilters(false)}
                className="btn-primary w-full mt-4 py-2.5 text-xs tracking-widest"
              >
                APPLY FILTERS
              </button>
            )}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {/* Active Filter Chips */}
          {(selectedFabric || minPrice || maxPrice || search || minRating) && (
            <div className="flex flex-wrap gap-2 items-center mb-4 bg-gold-50/50 p-2.5 rounded-lg border border-gold-100">
              <span className="font-cinzel text-[10px] tracking-wider text-muted font-bold">ACTIVE FILTERS:</span>
              {selectedFabric && (
                <span className="bg-deep text-gold-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-garamond">
                  {selectedFabric} <X size={12} className="cursor-pointer" onClick={() => setSelectedFabric("")} />
                </span>
              )}
              {search && (
                <span className="bg-deep text-gold-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-garamond">
                  "{search}" <X size={12} className="cursor-pointer" onClick={() => setSearch("")} />
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="bg-deep text-gold-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-garamond">
                  ₹{minPrice || "0"} - ₹{maxPrice || "Max"} <X size={12} className="cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); }} />
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-red-600 hover:underline ml-auto font-garamond">Reset All</button>
            </div>
          )}

          {/* Results count */}
          {data && (
            <p className="font-garamond text-xs text-muted mb-4">
              Showing <strong className="text-brown">{data.items.length}</strong> of {data.total} luxury products
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse card p-2.5">
                  <div className="aspect-[3/4] bg-ivory rounded-lg mb-3" />
                  <div className="h-3 bg-ivory rounded mb-2 w-3/4" />
                  <div className="h-3 bg-ivory rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-20 card p-8">
              <p className="font-cormorant text-2xl text-brown mb-2 font-bold">No Products Found</p>
              <p className="font-garamond text-sm text-muted mb-6">Try adjusting your fabric, price range, or category filters.</p>
              <button onClick={clearAllFilters} className="btn-outline">Clear All Filters</button>
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
                className="w-8 h-8 border border-gold-200 flex items-center justify-center hover:border-gold-500 transition-colors disabled:opacity-40 rounded"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 font-cinzel text-xs transition-colors rounded ${
                    p === page ? "bg-deep text-gold-400 font-bold shadow-sm" : "border border-gold-200 hover:border-gold-500"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="w-8 h-8 border border-gold-200 flex items-center justify-center hover:border-gold-500 transition-colors disabled:opacity-40 rounded"
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
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><span className="font-cinzel text-sm text-muted tracking-widest">LOADING CATALOG...</span></div>}>
      <ProductsContent />
    </Suspense>
  );
}
