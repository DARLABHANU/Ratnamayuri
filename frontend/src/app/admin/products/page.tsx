"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Search } from "lucide-react";
import toast from "react-hot-toast";
import { productApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Product } from "@/types";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

export default function AdminProductsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") { router.push("/auth/login"); return; }
    loadProducts();
  }, [isAuthenticated, role, page]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await productApi.list({ page, page_size: 20, search: search || undefined });
      setProducts(data.items);
      setTotal(data.total);
    } finally { setIsLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadProducts(); };

  const toggleActive = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await productApi.update(product.id, { is_active: !product.is_active });
      toast.success(product.is_active ? "Product hidden" : "Product made visible");
      loadProducts();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setTogglingId(null); }
  };

  return (
    <div>
      <div className="mb-8">
        <span className="section-tag">CATALOGUE</span>
        <h1 className="section-title">All <em className="italic">Products</em></h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…" className="input-field pl-9 py-2.5" />
        </div>
        <button type="submit" className="btn-primary px-5 py-2.5 text-xs">SEARCH</button>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-ivory">
              <tr>
                <th className="table-th">Product</th>
                <th className="table-th">Price</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Sold</th>
                <th className="table-th">Merchant ID</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-10 bg-ivory flex-shrink-0 overflow-hidden border border-gold-100">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gold-200 text-xs">✦</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-garamond text-sm font-medium text-brown truncate max-w-[200px]">{p.name}</p>
                        {p.sku && <p className="font-garamond text-xs text-muted">SKU: {p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-td font-cinzel text-xs text-brown">{formatPrice(p.price)}</td>
                  <td className="table-td">
                    <span className={`font-cinzel text-xs ${p.stock_quantity <= p.low_stock_threshold ? "text-red-500" : "text-green-600"}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="table-td font-garamond text-sm text-muted">{p.total_sold}</td>
                  <td className="table-td font-garamond text-xs text-muted">#{p.id}</td>
                  <td className="table-td">
                    <span className={`badge text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="table-td">
                    {togglingId === p.id
                      ? <Loader2 size={14} className="animate-spin text-gold-500" />
                      : (
                        <button onClick={() => toggleActive(p)} title={p.is_active ? "Hide" : "Show"}
                          className="text-muted hover:text-brown transition-colors">
                          {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center py-10 font-garamond text-muted">No products found</td></tr>
              )}
            </tbody>
          </table>
          <div className="p-4 border-t border-gold-100 flex justify-between items-center">
            <p className="font-garamond text-xs text-muted">{total} total products</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={products.length < 20}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
