"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice, getApiError } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  compare_price: z.coerce.number().optional(),
  sku: z.string().optional(),
  stock_quantity: z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  weight_grams: z.coerce.number().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  images: z.string().optional(), // comma-separated URLs
  tags: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

export default function MerchantProductsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { is_active: true, is_featured: false, stock_quantity: 0, low_stock_threshold: 5 },
  });

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") { router.push("/auth/login"); return; }
    loadProducts();
  }, [isAuthenticated, role, page]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await productApi.myProducts({ page, page_size: 15 });
      setProducts(data.items);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    reset({ is_active: true, is_featured: false, stock_quantity: 0, low_stock_threshold: 5 });
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    reset({
      name: product.name,
      description: product.description || "",
      short_description: product.short_description || "",
      price: product.price,
      compare_price: product.compare_price || undefined,
      sku: product.sku || "",
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      weight_grams: product.weight_grams || undefined,
      is_active: product.is_active,
      is_featured: product.is_featured,
      images: product.images?.join(", ") || "",
      tags: product.tags?.join(", ") || "",
    });
    setShowForm(true);
  };

  const onSubmit = async (data: ProductForm) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        images: data.images ? data.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
        tags: data.tags ? data.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };

      if (editing) {
        await productApi.update(editing.id, payload);
        toast.success("Product updated!");
      } else {
        await productApi.create(payload);
        toast.success("Product created!");
      }
      setShowForm(false);
      loadProducts();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await productApi.update(product.id, { is_active: !product.is_active });
      toast.success(product.is_active ? "Product hidden" : "Product visible");
      loadProducts();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await productApi.delete(product.id);
      toast.success("Product deleted");
      loadProducts();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="section-tag">INVENTORY</span>
          <h1 className="section-title">My <em className="italic">Products</em></h1>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> ADD PRODUCT
        </button>
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8 animate-fade-up">
            <div className="flex items-center justify-between p-6 border-b border-gold-100">
              <h2 className="font-cinzel text-sm tracking-widest text-brown">
                {editing ? "EDIT PRODUCT" : "ADD NEW PRODUCT"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-brown">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PRODUCT NAME *</label>
                  <input {...register("name")} className="input-field" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PRICE (₹) *</label>
                  <input {...register("price")} type="number" step="0.01" className="input-field" />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">COMPARE PRICE (₹)</label>
                  <input {...register("compare_price")} type="number" step="0.01" className="input-field" />
                </div>

                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">STOCK QTY *</label>
                  <input {...register("stock_quantity")} type="number" className="input-field" />
                </div>
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">LOW STOCK ALERT</label>
                  <input {...register("low_stock_threshold")} type="number" className="input-field" />
                </div>

                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">SKU</label>
                  <input {...register("sku")} className="input-field" placeholder="e.g. KS-001" />
                </div>
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">WEIGHT (g)</label>
                  <input {...register("weight_grams")} type="number" className="input-field" />
                </div>

                <div className="col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">SHORT DESCRIPTION</label>
                  <input {...register("short_description")} className="input-field" placeholder="Brief product summary" />
                </div>
                <div className="col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">FULL DESCRIPTION</label>
                  <textarea {...register("description")} rows={3} className="input-field resize-none" />
                </div>

                <div className="col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                    IMAGE URLS <span className="font-garamond normal-case tracking-normal text-muted">(comma-separated)</span>
                  </label>
                  <input {...register("images")} className="input-field" placeholder="https://..., https://..." />
                </div>
                <div className="col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">
                    TAGS <span className="font-garamond normal-case tracking-normal text-muted">(comma-separated)</span>
                  </label>
                  <input {...register("tags")} className="input-field" placeholder="kanjivaram, silk, bridal" />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input {...register("is_active")} type="checkbox" className="accent-gold-500 w-4 h-4" />
                    <span className="font-cinzel text-xs tracking-wide text-brown">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input {...register("is_featured")} type="checkbox" className="accent-gold-500 w-4 h-4" />
                    <span className="font-cinzel text-xs tracking-wide text-brown">Featured</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gold-100">
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                  {isSaving && <Loader2 size={12} className="animate-spin" />}
                  {editing ? "UPDATE PRODUCT" : "CREATE PRODUCT"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-gold-500" size={28} />
        </div>
      ) : products.length === 0 ? (
        <div className="card p-16 text-center">
          <Package size={48} className="text-gold-200 mx-auto mb-4" />
          <h2 className="font-cormorant text-2xl text-brown mb-2">No products yet</h2>
          <p className="font-garamond text-muted mb-6">Add your first product to start selling</p>
          <button onClick={openCreate} className="btn-primary">ADD FIRST PRODUCT</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-ivory">
              <tr>
                <th className="table-th">Product</th>
                <th className="table-th">Price</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-ivory/30 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-ivory flex-shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="m-auto mt-3 text-gold-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-garamond text-sm font-medium text-brown">{product.name}</p>
                        {product.sku && <p className="font-garamond text-xs text-muted">SKU: {product.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div>
                      <p className="font-cinzel text-xs text-brown">{formatPrice(product.price)}</p>
                      {product.compare_price && (
                        <p className="font-garamond text-xs text-muted line-through">{formatPrice(product.compare_price)}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={`font-cinzel text-xs ${product.stock_quantity <= product.low_stock_threshold
                      ? "text-red-600" : "text-green-600"}`}>
                      {product.stock_quantity}
                      {product.stock_quantity <= product.low_stock_threshold && " ⚠"}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={`badge text-xs ${product.is_active
                      ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {product.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(product)} title="Edit"
                        className="text-muted hover:text-brown transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleToggleActive(product)} title={product.is_active ? "Hide" : "Show"}
                        className="text-muted hover:text-brown transition-colors">
                        {product.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => handleDelete(product)} title="Delete"
                        className="text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 border-t border-gold-100 flex items-center justify-between">
            <p className="font-garamond text-xs text-muted">Showing {products.length} of {total} products</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={products.length < 15}
                className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
