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
  images: z.string().optional(), // comma-separated URLs
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
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasProfile, setHasProfile] = useState<boolean>(true);

  // Bulk Product Upload states & helpers
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Bulk Image Upload utility states & handlers
  const [utilityFiles, setUtilityFiles] = useState<{ name: string; url: string }[]>([]);
  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);

  const handleUtilityUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsGeneratingLinks(true);
    const newLinks = [...utilityFiles];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
        reader.readAsDataURL(file);
        const base64 = await base64Promise;

        const { data } = await productApi.upload({
          filename: file.name,
          base64: base64
        });
        newLinks.push({ name: file.name, url: data.url });
      }
      setUtilityFiles(newLinks);
      toast.success("Image links generated successfully! You can copy them to your CSV file.");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsGeneratingLinks(false);
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    const headers = "name,description,base_price,compare_price,sku,stock_quantity,low_stock_threshold,weight_grams,images,tags\n";
    const sample = "Elegant Kanjeevaram Saree,Classic handloom silk saree,5400,8500,KV-901,15,3,900,https://res.cloudinary.com/demo/image/upload/sample1.jpg;https://res.cloudinary.com/demo/image/upload/sample2.jpg,Kanjeevaram,Silk,Saree\n";
    const blob = new Blob([headers + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ratnamayuri_bulk_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error("Please select a CSV file to upload.");
      return;
    }

    setIsBulkUploading(true);
    try {
      const imageMap: Record<string, string> = {};
      if (selectedImageFiles.length > 0) {
        setUploadProgressText("Uploading image assets...");
        for (let i = 0; i < selectedImageFiles.length; i++) {
          const file = selectedImageFiles[i];
          setUploadProgressText(`Uploading ${file.name} (${i + 1}/${selectedImageFiles.length})...`);
          
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          });
          reader.readAsDataURL(file);
          const base64 = await base64Promise;

          const { data } = await productApi.upload({
            filename: file.name,
            base64: base64
          });
          imageMap[file.name] = data.url;
        }
      }

      setUploadProgressText("Processing catalog spreadsheet...");
      const reader = new FileReader();
      const readPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(csvFile);
      });
      const csvData = await readPromise;

      const { data } = await merchantApi.bulkUploadProducts({ csvData, imageMap });
      if (data.error_count > 0) {
        toast.error(`Imported ${data.success_count} products. ${data.error_count} rows failed.`);
        console.error("Bulk upload errors list:", data.errors);
      } else {
        toast.success(`Successfully imported all ${data.success_count} products!`);
      }
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
      setHasProfile(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "";
      if (msg.toLowerCase().includes("profile")) {
        setHasProfile(false);
      } else {
        toast.error(getApiError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    reset({
      is_active: true,
      is_featured: false,
      stock_quantity: 0,
      low_stock_threshold: 5,
      category_id: "",
      main_category: "Sarees",
      subcategory: "Silk Sarees"
    });
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    const mainCat = product.category?.name || "Jewellery";
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
      images: product.images?.join(", ") || "",
      tags: product.tags?.join(", ") || "",
      category_id: product.category_id ? String(product.category_id) : "",
      main_category: mainCat,
      subcategory: product.subcategory || "",
    });
    setShowForm(true);
  };

  const onSubmit = async (data: ProductForm) => {
    setIsSaving(true);
    try {
      const parsedTags = data.tags ? data.tags.split(",").map((s) => s.trim()).filter(Boolean) : [];
      
      // Auto-append subcategory & main_category to tags for high-precision filter matching
      if (data.subcategory && !parsedTags.some(t => t.toLowerCase() === data.subcategory!.toLowerCase())) {
        parsedTags.push(data.subcategory);
      }
      if (data.main_category && !parsedTags.some(t => t.toLowerCase() === data.main_category!.toLowerCase())) {
        parsedTags.push(data.main_category);
      }

      const payload = {
        ...data,
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

  if (!hasProfile) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="section-tag">INVENTORY</span>
            <h1 className="section-title">My <em className="italic">Products</em></h1>
          </div>
        </div>
        <div className="card p-16 text-center max-w-xl mx-auto border-gold-200 mt-12 bg-ivory/50">
          <Store size={48} className="text-gold-600 mx-auto mb-4" />
          <h2 className="font-cinzel text-base tracking-widest text-brown mb-2">MERCHANT PROFILE REQUIRED</h2>
          <p className="font-garamond text-sm text-muted mb-6 leading-relaxed">
            You must create your store profile details (such as store name, description, GSTIN, and bank account settings) before you can manage or add products to the catalog.
          </p>
          <button onClick={() => router.push("/merchant/profile")} className="btn-primary inline-flex items-center gap-2 mx-auto">
            CREATE MERCHANT PROFILE NOW →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="section-tag">INVENTORY</span>
          <h1 className="section-title">My <em className="italic">Products</em></h1>
        </div>
        <div className="flex gap-2">
          {/* BULK CSV UPLOAD button hidden temporarily by user request
          <button onClick={() => setShowBulkModal(true)} className="border border-gold-400 text-gold-700 bg-gold-50/20 font-cinzel text-xs tracking-widest px-4 py-2 hover:bg-gold-50 transition-all flex items-center gap-2">
            BULK CSV UPLOAD
          </button>
          */}
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> ADD PRODUCT
          </button>
        </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">PRODUCT NAME *</label>
                  <input {...register("name")} className="input-field" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Main Category Dropdown */}
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">MAIN CATEGORY *</label>
                  <select 
                    {...register("main_category")} 
                    className="input-field py-2.5 font-cinzel text-xs tracking-wide bg-white"
                  >
                    {Object.keys(CATEGORY_TAXONOMY).map((mainCat) => (
                      <option key={mainCat} value={mainCat}>
                        {mainCat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Dropdown (Dynamic options based on Main Category) */}
                <div>
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">SUBCATEGORY *</label>
                  {(() => {
                    const currentMain = watch("main_category") || "Sarees";
                    const suboptions = CATEGORY_TAXONOMY[currentMain] || [];
                    return (
                      <select {...register("subcategory")} className="input-field py-2.5 font-cinzel text-xs tracking-wide bg-white">
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

                <div className="sm:col-span-2">
                  <p className="text-[11px] font-garamond text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded">
                    ✦ <strong>Taxonomy Matching:</strong> Selecting the exact Main Category & Subcategory ensures your product appears strictly under the customer's selected filter (e.g. Bangles will ONLY show when customer clicks Bangles).
                  </p>
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

                <div className="sm:col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">SHORT DESCRIPTION</label>
                  <input {...register("short_description")} className="input-field" placeholder="Brief product summary" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">FULL DESCRIPTION</label>
                  <textarea {...register("description")} rows={3} className="input-field resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-cinzel text-xs tracking-widest text-muted block mb-1">TAGS / FABRIC / MATERIAL / CRAFT (COMMA SEPARATED)</label>
                  <input {...register("tags")} className="input-field" placeholder="e.g. Silk, Kanchipuram, Temple Gold, Kundan, Bridal, Cotton" />
                  <p className="text-[11px] font-garamond text-muted mt-1">Tags automatically create dynamic search and filter chips across the storefront.</p>
                </div>

                <div className="sm:col-span-2">
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
                <div className="sm:col-span-2">
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
          <div className="overflow-x-auto">
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
                      <button 
                        onClick={() => openEdit(product)} 
                        title="Edit Details"
                        className="bg-gold-50 hover:bg-gold-100 text-gold-800 border border-gold-300 font-cinzel text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-all shadow-xs"
                      >
                        <Pencil size={11} /> EDIT DETAILS
                      </button>
                      <button onClick={() => handleToggleActive(product)} title={product.is_active ? "Hide" : "Show"}
                        className="p-1.5 text-muted hover:text-brown transition-colors">
                        {product.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => handleDelete(product)} title="Delete"
                        className="p-1.5 text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

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
      {/* Bulk CSV Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md my-8 animate-fade-up shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-gold-100 bg-ivory">
              <h2 className="font-cinzel text-sm tracking-widest text-brown font-semibold">
                ✦ BULK CSV CATALOG UPLOAD
              </h2>
              <button onClick={() => { setShowBulkModal(false); setCsvFile(null); }} className="text-muted hover:text-brown">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkUpload} className="p-6 space-y-5">
              <p className="font-garamond text-xs text-muted leading-relaxed">
                Upload your products in bulk using a standard `.csv` spreadsheet. The spreadsheet columns must include <strong className="text-brown">name</strong> and <strong className="text-brown">base_price</strong>. To upload <strong>multiple images</strong> for an individual product, simply separate the image URLs with a <strong>semicolon (;)</strong> in the <code>images</code> column.
              </p>

              <div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="font-cinzel text-[10px] tracking-widest text-gold-700 bg-gold-50 border border-gold-200 px-3 py-2 w-full text-center hover:bg-gold-100/50 transition-all font-semibold"
                >
                  📥 DOWNLOAD SAMPLE TEMPLATE (.CSV)
                </button>
              </div>

              <div className="border border-dashed border-gold-200 p-6 rounded text-center bg-ivory/20 hover:bg-ivory/40 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  id="csv-file-input"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                  <Package size={24} className="text-gold-500 mx-auto" />
                  <p className="font-cinzel text-[10px] tracking-wider text-brown font-semibold">
                    {csvFile ? csvFile.name.toUpperCase() : "SELECT PRODUCT CSV FILE"}
                  </p>
                  <p className="font-garamond text-xs text-muted">
                    Click to browse local files (max size: 5MB)
                  </p>
                </label>
              </div>

              {/* Automated matching selector box */}
              <div className="border border-dashed border-gold-200 p-6 rounded text-center bg-gold-50/5 hover:bg-gold-50/15 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="bulk-images-matching-input"
                  onChange={(e) => setSelectedImageFiles(Array.from(e.target.files || []))}
                  className="hidden"
                />
                <label htmlFor="bulk-images-matching-input" className="cursor-pointer block space-y-2">
                  <Store size={24} className="text-gold-500 mx-auto" />
                  <p className="font-cinzel text-[10px] tracking-wider text-brown font-semibold">
                    {selectedImageFiles.length > 0 
                      ? `📸 ${selectedImageFiles.length} IMAGE FILES SELECTED` 
                      : "📁 SELECT LOCAL IMAGES (OPTIONAL)"}
                  </p>
                  <p className="font-garamond text-xs text-muted">
                    Choose local files matching filenames in your CSV spreadsheet.
                  </p>
                </label>
              </div>

              {uploadProgressText && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-center font-cinzel text-[10px] tracking-widest text-amber-800 font-semibold animate-pulse">
                  {uploadProgressText}
                </div>
              )}

              {/* Image Link Generator Section */}
              <div className="border border-gold-100 p-4 rounded bg-gold-50/10 space-y-3">
                <p className="font-cinzel text-[10px] tracking-widest text-brown font-bold flex items-center gap-1.5">
                  📸 IMAGE LINK GENERATOR (OPTIONAL)
                </p>
                <p className="font-garamond text-xs text-muted leading-relaxed">
                  Need web links for your local image files? Upload your files here to generate copyable URLs for your spreadsheet.
                </p>
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="utility-image-upload"
                    onChange={handleUtilityUpload}
                    className="hidden"
                    disabled={isGeneratingLinks}
                  />
                  <label
                    htmlFor="utility-image-upload"
                    className="font-cinzel text-[10px] tracking-widest text-center cursor-pointer border border-gold-300 text-gold-700 bg-white hover:bg-gold-50 px-3 py-2 flex-1 rounded font-semibold transition-all"
                  >
                    {isGeneratingLinks ? "UPLOADING..." : "📂 CHOOSE IMAGE FILES"}
                  </label>
                  {utilityFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUtilityFiles([])}
                      className="font-cinzel text-[10px] tracking-widest text-red-600 border border-red-200 bg-white px-3 py-2 rounded hover:bg-red-50 transition-all"
                    >
                      CLEAR LIST
                    </button>
                  )}
                </div>

                {utilityFiles.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-2 border border-gold-100 p-2 bg-white rounded">
                    {utilityFiles.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-2 text-xs border-b border-gold-50/50 pb-1">
                        <span className="truncate text-muted max-w-[150px] font-mono text-[10px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(file.url);
                            toast.success(`Copied link for ${file.name}!`);
                          }}
                          className="font-cinzel text-[9px] tracking-widest text-gold-700 font-bold hover:text-gold-900 border border-gold-100 bg-gold-50/30 px-2 py-0.5 rounded"
                        >
                          COPY LINK
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isBulkUploading || !csvFile}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs disabled:opacity-50"
              >
                {isBulkUploading ? (
                  <><Loader2 size={12} className="animate-spin" /> IMPORTING CATALOG...</>
                ) : (
                  "CONFIRM & UPLOAD CATALOG"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
