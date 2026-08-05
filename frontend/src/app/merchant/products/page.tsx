"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Package, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { productApi, merchantApi } from "@/lib/api";
import { Product, CATEGORY_TAXONOMY } from "@/types";
import { formatPrice, getApiError } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  compare_price: z.coerce.number().optional(),
  sku: z.string().optional(),
  stock_quantity: z.coerce.number().int().min(0, "Stock quantity cannot be negative"),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  weight_grams: z.coerce.number().positive("Weight must be positive").optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  images: z.string().optional(),
  tags: z.string().optional(),
  category_id: z.string().optional().nullable(),
  main_category: z.string().optional(),
  subcategory: z.string().optional(),
}).refine(data => !data.compare_price || data.compare_price >= data.price, {
  message: "Compare Price (M.R.P) must be greater than or equal to Base Price",
  path: ["compare_price"]
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
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [hasProfile, setHasProfile] = useState<boolean>(true);

  // Bulk Product Upload states & helpers
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_active: true,
      is_featured: false,
      stock_quantity: 10,
      low_stock_threshold: 5,
      main_category: "Sarees",
      subcategory: "Kanchipuram Silk Sarees"
    }
  });

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
      return;
    }
    checkProfileAndLoad();
  }, [isAuthenticated, role, page]);

  const checkProfileAndLoad = async () => {
    setIsLoading(true);
    try {
      await merchantApi.getProfile();
      setHasProfile(true);
      await loadProducts();
    } catch {
      setHasProfile(false);
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productApi.myProducts({ page, page_size: 15 });
      const items: Product[] = res.data.items;
      setProducts(items);
      setTotal(res.data.total);
      
      // Calculate stats based on fetched items
      let active = 0, inactive = 0, outOfStock = 0;
      items.forEach(p => {
        if (p.is_active) active++; else inactive++;
        if (p.stock_quantity <= p.low_stock_threshold) outOfStock++;
      });
      setActiveCount(active);
      setInactiveCount(inactive);
      setOutOfStockCount(outOfStock);
      
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    reset({
      name: "", description: "", short_description: "", price: undefined, compare_price: undefined,
      sku: "", stock_quantity: 10, low_stock_threshold: 5, weight_grams: undefined,
      is_active: true, is_featured: false, images: "", tags: "", category_id: null,
      main_category: "Sarees", subcategory: "Kanchipuram Silk Sarees"
    });
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    let matchedMain = "Sarees";
    let matchedSub = product.subcategory || "";

    if (product.tags && product.tags.length > 0) {
      for (const [mainCat, subs] of Object.entries(CATEGORY_TAXONOMY)) {
        if (product.tags.some(t => t.toLowerCase() === mainCat.toLowerCase())) {
          matchedMain = mainCat;
          break;
        }
        for (const sub of subs) {
          if (product.tags.some(t => t.toLowerCase() === sub.toLowerCase())) {
            matchedMain = mainCat;
            matchedSub = sub;
            break;
          }
        }
      }
    }

    reset({
      name: product.name,
      description: product.description || "",
      short_description: product.short_description || "",
      price: product.base_price || product.price,
      compare_price: product.compare_price || undefined,
      sku: product.sku || "",
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      weight_grams: product.weight_grams || undefined,
      is_active: product.is_active,
      is_featured: product.is_featured,
      images: product.images ? product.images.join(", ") : "",
      tags: product.tags ? product.tags.join(", ") : "",
      category_id: product.category_id ? String(product.category_id) : null,
      main_category: matchedMain,
      subcategory: matchedSub,
    });
    setShowForm(true);
  };

  const onSubmit = async (data: ProductForm) => {
    setIsSaving(true);
    try {
      const parsedTags = data.tags ? data.tags.split(",").map((s) => s.trim()).filter(Boolean) : [];
      if (data.subcategory && !parsedTags.some(t => t.toLowerCase() === data.subcategory!.toLowerCase())) {
        parsedTags.push(data.subcategory);
      }
      if (data.main_category && !parsedTags.some(t => t.toLowerCase() === data.main_category!.toLowerCase())) {
        parsedTags.push(data.main_category);
      }

      const sellerBasePrice = Number(data.price);
      const customerSellingPrice = sellerBasePrice + 299;

      const payload = {
        ...data,
        base_price: sellerBasePrice,
        price: customerSellingPrice,
        category_id: data.category_id ? Number(data.category_id) : null,
        subcategory: data.subcategory || null,
        subcategory_slug: data.subcategory ? data.subcategory.toLowerCase().replace(/\s+/g, '-') : null,
        images: data.images ? data.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
        tags: parsedTags,
      };

      if (editing) {
        await productApi.update(editing.id, payload);
        toast.success("Product updated successfully!");
      } else {
        await productApi.create(payload);
        toast.success("Product created successfully!");
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
      const currentImagesStr = watch("images") || "";
      const currentImagesList = currentImagesStr.split(",").map(s => s.trim()).filter(Boolean);

      const file = files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const res = await productApi.upload({ filename: file.name, base64, folder: "products" });
          const uploadedUrl: string = res.data.url;
          const imagesList = Array.from(new Set([...currentImagesList, uploadedUrl])).slice(0, 5);

          setValue("images", imagesList.join(", "));
          toast.success("Image uploaded successfully!");
        } catch (err) {
          toast.error(getApiError(err));
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(getApiError(err));
      setIsUploading(false);
    } finally {
      e.target.value = "";
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setIsBulkUploading(true);
    setUploadProgressText("Processing catalog CSV...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const csvData = reader.result as string;
          await merchantApi.bulkUploadProducts({ csvData });
          toast.success("Bulk catalog imported successfully!");
          setShowBulkModal(false);
          setCsvFile(null);
          setSelectedImageFiles([]);
          loadProducts();
        } catch (err) {
          toast.error(getApiError(err));
        } finally {
          setIsBulkUploading(false);
          setUploadProgressText("");
        }
      };
      reader.readAsText(csvFile);
    } catch (err) {
      toast.error(getApiError(err));
      setIsBulkUploading(false);
      setUploadProgressText("");
    }
  };

  const downloadTemplate = () => {
    const csvContent = "name,description,base_price,stock_quantity,sku,main_category,subcategory,images,tags\n" +
      "Kanchipuram Silk Saree,Pure silk saree with gold zari border,4500,10,KSS-001,Sarees,Kanchipuram Silk Sarees,https://images.unsplash.com/photo-1610030469983-98e550d6193c,Kanchipuram, Silk, Gold Zari\n" +
      "Temple Gold Necklace,Handcrafted temple design gold plated necklace,2200,5,TGN-002,Necklaces,Temple Jewellery,https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f,Temple, Gold, Kundan\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ratnamayuri_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasProfile) {
    return (
      <div className="space-y-6 text-[#1C2E24] font-garamond">
        <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Products Management</h1>
        <div className="bg-white border border-[#E5E0D5] rounded-3xl p-16 text-center max-w-xl mx-auto shadow-xs">
          <Store size={48} className="text-[#0D2619] mx-auto mb-4" />
          <h2 className="font-cormorant text-xl font-bold text-[#1C2E24] mb-2">Merchant Profile Required</h2>
          <p className="text-xs text-[#8C9890] mb-6 leading-relaxed">
            You must create your store profile details (such as store name, description, GSTIN, and bank account settings) before you can manage or add products to the catalog.
          </p>
          <button onClick={() => router.push("/merchant/profile")} className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">
            CREATE MERCHANT PROFILE NOW →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      <div className="flex items-center justify-between">
        <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Products Management</h1>
      </div>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* Top 4 Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Products</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{total}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Active Products</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{activeCount}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Inactive Products</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#6B7A70]">{inactiveCount}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Out of Stock</span>
            <span className="font-cormorant text-3xl font-extrabold text-red-600">{outOfStockCount}</span>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full px-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button onClick={() => setShowBulkModal(true)} className="inline-flex items-center gap-1.5 border border-[#0D2619] text-[#0D2619] hover:bg-[#0D2619] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs">
              <Package size={15} />
              <span>Bulk CSV Upload</span>
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-[#0D2619] hover:bg-[#19402B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs">
              <Plus size={15} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Product form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl my-8 rounded-3xl shadow-lg overflow-hidden border border-[#E5E0D5]">
              <div className="flex items-center justify-between p-6 border-b border-[#F0ECE1] bg-[#FAF8F3]">
                <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">
                  {editing ? "Edit Product" : "Add New Product"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-[#8C9890] hover:text-[#1C2E24]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-[#1C2E24] block mb-1">Product Name *</label>
                    <input {...register("name")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Main Category *</label>
                    <select 
                      {...register("main_category")} 
                      className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                    >
                      {Object.keys(CATEGORY_TAXONOMY).map((mainCat) => (
                        <option key={mainCat} value={mainCat}>
                          {mainCat.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Subcategory *</label>
                    {(() => {
                      const currentMain = watch("main_category") || "Sarees";
                      const suboptions = CATEGORY_TAXONOMY[currentMain] || [];
                      return (
                        <select {...register("subcategory")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]">
                          <option value="">Select Subcategory</option>
                          {suboptions.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Merchant Product Price (₹) *</label>
                    <input {...register("price")} type="number" step="0.01" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" placeholder="e.g. 1700" />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                  </div>
                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Compare Price / M.R.P (₹)</label>
                    <input {...register("compare_price")} type="number" step="0.01" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" placeholder="e.g. 2499" />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Stock Qty *</label>
                    <input {...register("stock_quantity")} type="number" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" />
                  </div>
                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Low Stock Alert</label>
                    <input {...register("low_stock_threshold")} type="number" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">SKU</label>
                    <input {...register("sku")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" placeholder="e.g. KS-001" />
                  </div>
                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Weight (g)</label>
                    <input {...register("weight_grams")} type="number" className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-[#1C2E24] block mb-1">Short Description</label>
                    <input {...register("short_description")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" placeholder="Brief product summary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-[#1C2E24] block mb-1">Full Description</label>
                    <textarea {...register("description")} rows={3} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-4 text-xs text-[#1C2E24] focus:outline-none focus:border-[#0D2619] resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-[#1C2E24] block mb-1">Tags / Material / Craft (comma separated)</label>
                    <input {...register("tags")} className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]" placeholder="e.g. Silk, Kanchipuram, Temple Gold, Kundan, Bridal, Cotton" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-[#1C2E24] block mb-1">Product Images (up to 5)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      disabled={isUploading || (watch("images")?.split(",")?.filter(Boolean)?.length || 0) >= 5}
                      className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2 text-xs font-semibold text-[#1C2E24] focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#0D2619] file:text-white hover:file:bg-[#19402B]" 
                    />
                    {isUploading && <p className="text-xs text-[#8C9890] mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Uploading image...</p>}
                    
                    {/* Display uploaded images thumbnails */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      {watch("images")?.split(",").map(s => s.trim()).filter(Boolean).map((imgUrl, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E5E0D5] shadow-xs">
                          <img src={imgUrl} alt={`Uploaded ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => {
                              const imgs = watch("images")?.split(",").map(s => s.trim()).filter(Boolean) || [];
                              imgs.splice(idx, 1);
                              setValue("images", imgs.join(", "));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input {...register("is_active")} type="checkbox" className="accent-[#0D2619] w-4 h-4" />
                      <span className="text-xs font-bold text-[#1C2E24]">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input {...register("is_featured")} type="checkbox" className="accent-[#0D2619] w-4 h-4" />
                      <span className="text-xs font-bold text-[#1C2E24]">Featured</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#F0ECE1]">
                  <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">
                    {isSaving && <Loader2 size={12} className="animate-spin" />}
                    {editing ? "Update Product" : "Create Product"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-[#E5E0D5] text-[#556B5D] rounded-xl text-xs font-bold hover:bg-[#FAF8F3] transition-all">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-[#0D2619]" size={28} />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-[#E5E0D5] rounded-3xl p-16 text-center shadow-xs">
            <Package size={48} className="text-[#E5E0D5] mx-auto mb-4" />
            <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24] mb-2">No products yet</h2>
            <p className="text-xs text-[#8C9890] mb-6">Add your first product to start selling</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">Add First Product</button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0ECE1] text-[#7A6E5D] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Product</th>
                  <th className="pb-3 px-3">Price</th>
                  <th className="pb-3 px-3">Stock</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FAF8F3] flex-shrink-0 overflow-hidden rounded-lg border border-[#E5E0D5]">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="m-auto mt-3 text-[#E5E0D5]" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#1C2E24]">{product.name}</p>
                          <div className="flex gap-2 items-center mt-0.5">
                            {product.category && (
                              <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.5 rounded-md">
                                {product.category.name.toUpperCase()}
                              </span>
                            )}
                            {product.sku && <span className="text-[11px] text-[#8C9890]">SKU: {product.sku}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div>
                        <p className="font-extrabold text-xs text-[#1C2E24]">{formatPrice(product.price)}</p>
                        {product.compare_price && (
                          <p className="text-[11px] text-[#8C9890] line-through">{formatPrice(product.compare_price)}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`text-xs font-bold ${product.stock_quantity <= product.low_stock_threshold
                        ? "text-red-600" : "text-[#2E7D32]"}`}>
                        {product.stock_quantity}
                        {product.stock_quantity <= product.low_stock_threshold && " ⚠"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${product.is_active
                        ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-600"}`}>
                        {product.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEdit(product)} 
                          title="Edit Details"
                          className="bg-[#FAF8F3] hover:bg-[#E5E0D5] text-[#1C2E24] border border-[#E5E0D5] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-xs"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => handleToggleActive(product)} title={product.is_active ? "Hide" : "Show"}
                          className="p-1.5 text-[#8C9890] hover:text-[#1C2E24] transition-colors">
                          {product.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => handleDelete(product)} title="Delete"
                          className="p-1.5 text-[#8C9890] hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="p-4 border-t border-[#F0ECE1] flex items-center justify-between">
              <p className="text-xs text-[#8C9890]">Showing {products.length} of {total} products</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-xs text-[#556B5D] font-bold px-3 py-1 disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={products.length < 15}
                  className="text-xs text-[#556B5D] font-bold px-3 py-1 disabled:opacity-40">Next →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk CSV Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md my-8 rounded-3xl shadow-lg overflow-hidden border border-[#E5E0D5]">
            <div className="flex items-center justify-between p-6 border-b border-[#F0ECE1] bg-[#FAF8F3]">
              <h2 className="font-cormorant text-xl font-bold text-[#1C2E24]">
                ✦ Bulk CSV Catalog Upload
              </h2>
              <button onClick={() => { setShowBulkModal(false); setCsvFile(null); }} className="text-[#8C9890] hover:text-[#1C2E24]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkUpload} className="p-6 space-y-5">
              <p className="text-xs text-[#556B5D] leading-relaxed">
                Upload your products in bulk using a standard <code className="bg-[#FAF8F3] px-1 py-0.5 rounded border border-[#E5E0D5] text-[#0D2619] font-mono">.csv</code> spreadsheet. The spreadsheet columns must include <strong className="text-[#1C2E24]">name</strong> and <strong className="text-[#1C2E24]">base_price</strong>.
              </p>

              <div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="text-xs font-bold text-[#0D2619] bg-[#FAF8F3] border border-[#E5E0D5] px-4 py-2.5 rounded-xl w-full text-center hover:bg-[#E5E0D5]/50 transition-all shadow-2xs"
                >
                  📥 Download Sample Template (.CSV)
                </button>
              </div>

              <div className="border border-dashed border-[#E5E0D5] p-6 rounded-2xl text-center bg-[#FAF8F3] hover:border-[#0D2619] transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  id="csv-file-input"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                  <Package size={24} className="text-[#0D2619] mx-auto" />
                  <p className="font-bold text-xs text-[#1C2E24]">
                    {csvFile ? csvFile.name.toUpperCase() : "SELECT PRODUCT CSV FILE"}
                  </p>
                  <p className="text-xs text-[#8C9890]">
                    Click to browse local files (max size: 5MB)
                  </p>
                </label>
              </div>

              <button
                type="submit"
                disabled={isBulkUploading || !csvFile}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isBulkUploading ? (
                  <><Loader2 size={14} className="animate-spin" /> Importing Catalog...</>
                ) : (
                  "Confirm & Upload Catalog"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
