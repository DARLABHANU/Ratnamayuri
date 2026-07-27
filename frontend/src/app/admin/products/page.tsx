"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Search, CheckCircle, XCircle, Trash2 } from "lucide-react";

import toast from "react-hot-toast";
import { adminApi, productApi } from "@/lib/api";
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
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to permanently delete product "${product.name}" from the database?`)) return;
    setTogglingId(product.id);
    try {
      await adminApi.deleteProduct(product.id);
      toast.success("Product permanently deleted from database");
      loadProducts();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") { router.push("/auth/login"); return; }
    loadProducts();
  }, [isAuthenticated, role, page, activeTab]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (search) params.search = search;
      if (activeTab === "pending") params.is_approved = "false";
      
      const { data } = await adminApi.products(params);
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const toggleActive = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await productApi.update(product.id, { is_active: !product.is_active });
      toast.success(product.is_active ? "Product hidden" : "Product made visible");
      loadProducts();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleApprove = async (product: Product, approve: boolean) => {
    setApprovingId(product.id);
    try {
      await adminApi.approveProduct(product.id, { is_approved: approve });
      toast.success(approve ? "Product approved successfully!" : "Product rejected/disapproved");
      loadProducts();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="section-tag">CATALOGUE</span>
          <h1 className="section-title">All <em className="italic">Products</em></h1>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gold-50 p-1 border border-gold-200 rounded-sm">
          <button onClick={() => { setActiveTab("all"); setPage(1); }}
            className={`font-cinzel text-xs tracking-wider px-4 py-2 rounded-sm transition-all
              ${activeTab === "all" ? "bg-deep text-gold-400 shadow-sm" : "text-brown hover:text-gold-600"}`}>
            ALL PRODUCTS
          </button>
          <button onClick={() => { setActiveTab("pending"); setPage(1); }}
            className={`font-cinzel text-xs tracking-wider px-4 py-2 rounded-sm transition-all relative
              ${activeTab === "pending" ? "bg-deep text-gold-400 shadow-sm" : "text-brown hover:text-gold-600"}`}>
            PENDING APPROVAL
            {activeTab !== "pending" && products.some(p => !p.is_approved) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
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
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-ivory">
              <tr>
                <th className="table-th">Product</th>
                <th className="table-th">Price</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Sold</th>
                <th className="table-th">Approval Status</th>
                <th className="table-th">Visibility</th>
                <th className="table-th text-right">Actions</th>
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
                  <td className="table-td">
                    <span className={`badge text-xs ${p.is_approved ? "!bg-emerald-700 !text-white font-semibold" : "!bg-red-700 !text-white font-semibold"}`}>
                      {p.is_approved ? "Approved" : "Pending Review"}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={`badge text-xs ${p.is_active ? "!bg-emerald-700 !text-white font-semibold" : "!bg-slate-600 !text-white font-semibold"}`}>
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-3">
                      {approvingId === p.id ? (
                        <Loader2 size={14} className="animate-spin text-gold-500" />
                      ) : !p.is_approved ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(p, true)} title="Approve Product"
                            className="flex items-center gap-1 font-cinzel text-[10px] tracking-widest text-green-700 hover:text-green-600 border border-green-200 bg-green-50 px-2.5 py-1 rounded-sm transition-all">
                            <CheckCircle size={10} /> APPROVE
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleApprove(p, false)} title="Revoke Approval"
                          className="flex items-center gap-1 font-cinzel text-[10px] tracking-widest text-red-700 hover:text-red-600 border border-red-200 bg-red-50 px-2.5 py-1 rounded-sm transition-all">
                          <XCircle size={10} /> REVOKE
                        </button>
                      )}
                      
                      <div className="w-px h-4 bg-gold-200" />
                      
                      {togglingId === p.id ? (
                        <Loader2 size={14} className="animate-spin text-gold-500" />
                      ) : (
                        <>
                          <button onClick={() => toggleActive(p)} title={p.is_active ? "Hide Product" : "Show Product"}
                            className="text-muted hover:text-brown transition-colors">
                            {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button onClick={() => handleDeleteProduct(p)} title="Permanently Delete Product"
                            className="text-muted hover:text-red-600 transition-colors ml-1">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center py-10 font-garamond text-muted">
                    {activeTab === "pending" ? "No products pending approval" : "No products found"}
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
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
