"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
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

function ProductsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(params.get("search") || "");
  const [sort, setSort] = useState("created_at:desc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    setIsLoading(true);
    const [sort_by, sort_order] = sort.split(":");
    try {
      const { data: res } = await productApi.list({
        page,
        page_size: 12,
        search: search || undefined,
        sort_by,
        sort_order,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        is_featured: params.get("is_featured") || undefined,
      });
      setData(res);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleFilter = () => {
    setPage(1);
    fetchProducts();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
    fetchProducts();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="section-tag">EXPLORE</span>
        <h1 className="section-title">All <em className="italic">Products</em></h1>
        <div className="divider-gold mx-0 mt-4" />
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jewellery, sarees..."
              className="input-field pl-9 py-2.5"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-2.5">SEARCH</button>
        </form>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="input-field w-auto font-cinzel text-xs tracking-wide py-2.5"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Filter toggle */}
        <button onClick={() => setShowFilters(!showFilters)}
          className="btn-outline flex items-center gap-2 px-5 py-2.5">
          <SlidersHorizontal size={14} />
          FILTERS
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-6 mb-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cinzel text-xs tracking-widest text-brown">FILTER OPTIONS</h3>
            <button onClick={() => setShowFilters(false)}><X size={16} className="text-muted" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">MIN PRICE (₹)</label>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0" className="input-field py-2" />
            </div>
            <div>
              <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">MAX PRICE (₹)</label>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="500000" className="input-field py-2" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleFilter} className="btn-primary px-6 py-2">APPLY</button>
            <button onClick={clearFilters} className="btn-ghost">Clear All</button>
          </div>
        </div>
      )}

      {/* Results count */}
      {data && (
        <p className="font-garamond text-sm text-muted mb-6">
          Showing {data.items.length} of {data.total} products
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-ivory mb-3" />
              <div className="h-3 bg-ivory rounded mb-2 w-3/4" />
              <div className="h-3 bg-ivory rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-cormorant text-2xl text-muted mb-2">No products found</p>
          <p className="font-garamond text-sm text-muted">Try adjusting your search or filters</p>
          <button onClick={clearFilters} className="btn-outline mt-6">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-9 h-9 border border-gold-200 flex items-center justify-center
              hover:border-gold-500 transition-colors disabled:opacity-40">
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 font-cinzel text-xs transition-colors
                ${p === page ? "bg-deep text-gold-400" : "border border-gold-200 hover:border-gold-500"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}
            className="w-9 h-9 border border-gold-200 flex items-center justify-center
              hover:border-gold-500 transition-colors disabled:opacity-40">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><span className="font-cinzel text-sm text-muted tracking-widest">LOADING...</span></div>}>
      <ProductsContent />
    </Suspense>
  );
}
