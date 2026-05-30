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
  category_id: z.string().optional().nullable(),
});
type ProductForm = z.infer<typeof productSchema>;

export default function MerchantProductsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { is_active: true, is_featured: false, stock_quantity: 0, low_stock_threshold: 5, category_id: "" },
  });

  useEffect(() => {
    // Load categories
    productApi.categories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

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
    reset({ is_active: true, is_featured: false, stock_quantity: 0, low_stock_threshold: 5, category_id: "" });
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
      category_id: product.category_id ? String(product.category_id) : "",
    });
    setShowForm(true);
  };

  const onSubmit = async (data: ProductForm) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        category_id: data.category_id ? Number(data.category_id) : null,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const currentImagesVal = getValues("images") || "";
      const imagesList = currentImagesVal ? currentImagesVal.split(",").map((s) => s.trim()).filter(Boolean) : [];
      
      if (imagesList.length + files.length > 5) {
        toast.error("You can upload a maximum of 5 images total.");
        setIsUploading(false);
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
        reader.readAsDataURL(file);
        const base64 = await base64Promise;

        // Upload to Express API
        const { data } = await productApi.upload({
          filename: file.name,
          base64: base64
        });

        imagesList.push(data.url);
      }
      setValue("images", imagesList.join(", "));
      toast.success("Images uploaded successfully!");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsUploading(false);
      e.target.value = "";
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

                <div className="col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">CATEGORY</label>
                  <select {...register("category_id")} className="input-field py-2.5 font-cinzel text-xs tracking-wide">
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-cinzel text-xs tracking-widest text-muted block">
                      PRODUCT IMAGES (5 ANGLES FOR SLIDESHOW)
                    </label>
                    {(() => {
                      const imgs = watch("images");
                      const count = imgs ? imgs.split(",").map((s) => s.trim()).filter(Boolean).length : 0;
                      return (
                        <span className={`font-cinzel text-xs font-semibold ${count === 5 ? "text-green-600" : "text-amber-600"}`}>
                          {count} / 5 SELECTED
                        </span>
                      );
                    })()}
                  </div>
                  
                  {/* File Upload Zone */}
                  <div className="border-2 border-dashed border-gold-200 hover:border-gold-400 p-4 text-center transition-all bg-ivory/20 mb-3 relative group">
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <Loader2 className="animate-spin text-gold-500 mb-1" size={20} />
                        <span className="font-garamond text-xs text-muted">Uploading image slides to server...</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-2">
                        <Plus className="mx-auto text-gold-600 mb-1 group-hover:scale-110 transition-transform" size={18} />
                        <span className="font-cinzel text-[10px] tracking-widest text-brown block">
                          UPLOAD IMAGE SLIDES (UP TO 5 DETAILS & ANGLES)
                        </span>
                        <span className="font-garamond text-xs text-muted mt-0.5 block">
                          Select up to 5 PNG, JPG, or WEBP images to showcase different angles
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Thumbnail Gallery Previews */}
                  {(() => {
                    const imgs = watch("images");
                    const list = imgs ? imgs.split(",").map((s) => s.trim()).filter(Boolean) : [];
                    if (list.length === 0) return null;
                    return (
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {list.map((url, index) => (
                          <div key={url + index} className="relative aspect-square border border-gold-100 group overflow-hidden bg-ivory">
                            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const newList = list.filter((_, idx) => idx !== index);
                                setValue("images", newList.join(", "));
                              }}
                              className="absolute top-1 right-1 bg-black/75 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Contextual Seeding Helper Tip */}
                  {(() => {
                    const imgs = watch("images");
                    const count = imgs ? imgs.split(",").map((s) => s.trim()).filter(Boolean).length : 0;
                    if (count > 0 && count < 5) {
                      return (
                        <p className="text-amber-600 text-xs font-garamond italic mb-3">
                          ✦ Tip: Adding exactly 5 images enables a beautiful multi-angle detail viewer for customer browsing.
                        </p>
                      );
                    }
                    if (count === 5) {
                      return (
                        <p className="text-green-600 text-xs font-garamond italic mb-3">
                          ✦ Success: 5 slides complete! Customers will see a rich multi-angle detail carousel.
                        </p>
                      );
                    }
                    return null;
                  })()}

                  {/* Manual URL input list for fallback */}
                  <label className="font-garamond text-xs text-muted block mb-1">
                    Or manage URLs manually (comma-separated):
                  </label>
                  <input {...register("images")} className="input-field text-xs font-mono" placeholder="https://image1.jpg, https://image2.jpg" />
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
                        <div className="flex gap-2 items-center mt-0.5">
                          {product.category && (
                            <span className="font-cinzel text-[10px] tracking-wider bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded-sm">
                              {product.category.name.toUpperCase()}
                            </span>
                          )}
                          {product.sku && <span className="font-garamond text-xs text-muted">SKU: {product.sku}</span>}
                        </div>
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
