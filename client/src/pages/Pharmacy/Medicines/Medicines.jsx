/**
 * Frontend page: Medicines
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// import { useEffect, useMemo, useRef, useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { Switch } from "@/components/ui/switch";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Search, Plus, Edit, Trash2, AlertTriangle, Eye } from "lucide-react";
// import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
// import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
// import { api } from "@/services/api";

// export default function Medicines() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [isOpen, setIsOpen] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [query, setQuery] = useState("");

//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [toast, setToast] = useState({ type: "", message: "" });

//   const [categoryFilter, setCategoryFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");

//   const [detailsItem, setDetailsItem] = useState(null);
//   const [detailsImageUrl, setDetailsImageUrl] = useState('');

//   const emptyForm = {
//     name: "",
//     genericName: "",
//     category: "",
//     dosage: "",
//     form: "",
//     manufacturer: "",
//     sku: "",
//     price: "",
//     discountPrice: "",
//     stockQuantity: "",
//     reorderLevel: "",
//     expiryDate: "",
//     supplier: "",
//     batchNo: "",
//     requiresPrescription: false,
//     description: "",
//     longDescription: "",
//     keyBenefits: "",
//     usageInstructions: "",
//     warnings: "",
//     tags: "",
//   };
//   const [form, setForm] = useState(emptyForm);
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreviewUrl, setImagePreviewUrl] = useState('');
//   const fileInputRef = useRef(null);

//   const revokeUrl = (url) => {
//     if (!url) return;
//     try {
//       URL.revokeObjectURL(url);
//     } catch {
//       // ignore
//     }
//   };

//   const loadItemImage = async (itemId, setter) => {
//     if (!itemId) return;
//     try {
//       const { blob } = await api.getPharmacyInventoryImage(itemId);
//       const url = URL.createObjectURL(blob);
//       setter(url);
//     } catch {
//       setter('');
//     }
//   };

//   const fetchItems = async (params = {}) => {
//     setLoading(true);
//     setError("");
//     try {
//       const data = await api.listPharmacyInventory(params);
//       setItems(Array.isArray(data?.items) ? data.items : []);
//     } catch (e) {
//       setError(e?.message || "Failed to load inventory");
//       setItems([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounced search + filters
//   useEffect(() => {
//     const t = setTimeout(() => {
//       fetchItems({
//         search: query.trim(),
//         category: categoryFilter,
//         status: statusFilter,
//         limit: 200,
//       });
//     }, 250);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [query, categoryFilter, statusFilter]);

//   useEffect(() => {
//     // initial
//     fetchItems({ limit: 200 });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     return () => {
//       revokeUrl(imagePreviewUrl);
//     };
//   }, [imagePreviewUrl]);

//   useEffect(() => {
//     // load image for details modal (requires auth header, so we fetch as blob)
//     let active = true;
//     revokeUrl(detailsImageUrl);
//     setDetailsImageUrl('');
//     if (!detailsItem?.id) return;
//     (async () => {
//       try {
//         const { blob } = await api.getPharmacyInventoryImage(detailsItem.id);
//         if (!active) return;
//         const url = URL.createObjectURL(blob);
//         setDetailsImageUrl(url);
//       } catch {
//         if (active) setDetailsImageUrl('');
//       }
//     })();
//     return () => {
//       active = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [detailsItem?.id]);

//   const categories = useMemo(() => {
//     const s = new Set();
//     items.forEach((i) => {
//       if (i.category) s.add(i.category);
//     });
//     return Array.from(s).sort();
//   }, [items]);

//   const filtered = useMemo(() => {
//     // UI safety filter (server already filters)
//     const q = query.trim().toLowerCase();
//     if (!q) return items;
//     return items.filter((it) => String(it.name || "").toLowerCase().includes(q));
//   }, [items, query]);

//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete this medicine from inventory?")) return;
//     try {
//       await api.deletePharmacyInventoryItem(id);
//       setToast({ type: "success", message: "Medicine deleted" });
//       fetchItems({ search: query.trim(), category: categoryFilter, status: statusFilter, limit: 200 });
//     } catch (e) {
//       setToast({ type: "error", message: e?.message || "Failed to delete" });
//     }
//   };

//   const openCreate = () => {
//     setEditingId(null);
//     setForm(emptyForm);
//     setImageFile(null);
//     revokeUrl(imagePreviewUrl);
//     setImagePreviewUrl('');
//     setIsOpen(true);
//   };

//   const handleEdit = async (item) => {
//     setEditingId(item.id);
//     setImageFile(null);
//     revokeUrl(imagePreviewUrl);
//     setImagePreviewUrl('');
//     setForm({
//       ...emptyForm,
//       name: item.name || "",
//       genericName: item.genericName || "",
//       category: item.category || "",
//       dosage: item.dosage || "",
//       form: item.form || "",
//       manufacturer: item.manufacturer || "",
//       sku: item.sku || "",
//       price: item.price ?? "",
//       discountPrice: item.discountPrice ?? "",
//       stockQuantity: item.stockQuantity ?? "",
//       reorderLevel: item.reorderLevel ?? "",
//       expiryDate: item.expiryDate ? String(item.expiryDate).slice(0, 10) : "",
//       supplier: item.supplier || "",
//       batchNo: item.batchNo || "",
//       requiresPrescription: Boolean(item.requiresPrescription),
//       description: item.description || "",
//       longDescription: item.longDescription || "",
//       keyBenefits: Array.isArray(item.keyBenefits) ? item.keyBenefits.join("\n") : (item.keyBenefits || ""),
//       usageInstructions: item.usageInstructions || "",
//       warnings: item.warnings || "",
//       tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
//     });
//     // If an image exists, show it as a preview in edit mode.
//     if (item?.id) {
//       await loadItemImage(item.id, setImagePreviewUrl);
//     }
//     setIsOpen(true);
//   };



//   const handleImageChange = (file) => {
//     revokeUrl(imagePreviewUrl);
//     setImageFile(file);
//     setImagePreviewUrl(file ? URL.createObjectURL(file) : '');
//   };

//   const onPickImage = (e) => {
//     const file = e?.target?.files?.[0] || null;
//     handleImageChange(file);
//   };

//   const onDropImage = (e) => {
//     e.preventDefault();
//     const file = e.dataTransfer?.files?.[0] || null;
//     if (file) handleImageChange(file);
//   };

//   const clearSelectedImage = () => {
//     handleImageChange(null);
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   };

//   const submitForm = async () => {
//     const payload = {
//       ...form,
//       price: form.price === "" ? undefined : Number(form.price),
//       discountPrice: form.discountPrice === "" ? null : Number(form.discountPrice),
//       stockQuantity: form.stockQuantity === "" ? 0 : Number(form.stockQuantity),
//       reorderLevel: form.reorderLevel === "" ? 0 : Number(form.reorderLevel),
//       expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
//       tags: form.tags,
//     };

//     const body = new FormData();
//     Object.entries(payload).forEach(([k, v]) => {
//       if (v === null || typeof v === 'undefined') return;
//       body.append(k, typeof v === 'string' ? v : String(v));
//     });
//     if (imageFile) body.append('image', imageFile);

//     try {
//       if (editingId) {
//         await api.updatePharmacyInventoryItem(editingId, body);
//         setToast({ type: "success", message: "Medicine updated" });
//       } else {
//         await api.createPharmacyInventoryItem(body);
//         setToast({ type: "success", message: "Medicine added" });
//       }
//       setIsOpen(false);
//       fetchItems({ search: query.trim(), category: categoryFilter, status: statusFilter, limit: 200 });
//     } catch (e) {
//       setToast({ type: "error", message: e?.message || "Save failed" });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       <div className="lg:pl-64">
//         <PharmacyNavbar
//           onMenuClick={() => setSidebarOpen(true)}
//           searchValue={query}
//           onSearchChange={setQuery}
//           searchPlaceholder="Search medicines, SKU, manufacturer…"
//         />

//         <main className="p-6 space-y-8">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <div>
//               <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Inventory Management</h1>
//               <p className="text-gray-600 mt-2">Manage medicines, stock levels, and expiry dates</p>
//             </div>

//             <Dialog open={isOpen} onOpenChange={setIsOpen}>
//               <DialogTrigger asChild>
//                 <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreate}>
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add Medicine
//                 </Button>
//               </DialogTrigger>
//               {/*
//                 NOTE: Dialogs with long forms/details must be scrollable on smaller screens.
//                 max-h + overflow ensures users can access the full content.
//               */}
//               <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-y-auto">
//                 <div className="flex flex-col max-h-[90vh]">
//                   <div className="p-6 border-b bg-white sticky top-0 z-10">
//                     <DialogHeader>
//                       <DialogTitle>{editingId ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
//                     </DialogHeader>
//                   </div>
//                   <div className="p-6 overflow-y-auto space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
//                       <Input
//                         value={form.name}
//                         onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
//                         placeholder="e.g., Paracetamol 500mg"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
//                       <Input
//                         value={form.genericName}
//                         onChange={(e) => setForm((p) => ({ ...p, genericName: e.target.value }))}
//                         placeholder="e.g., Acetaminophen"
//                       />
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                         <Input
//                           value={form.category}
//                           onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
//                           placeholder="e.g., Pain Relief"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
//                         <Input
//                           value={form.dosage}
//                           onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
//                           placeholder="e.g., 500mg"
//                         />
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
//                         <Input
//                           value={form.form}
//                           onChange={(e) => setForm((p) => ({ ...p, form: e.target.value }))}
//                           placeholder="e.g., Tablets / Capsules / Syrup"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
//                         <Input
//                           value={form.manufacturer}
//                           onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))}
//                           placeholder="e.g., Square / Beximco"
//                         />
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
//                         <Input
//                           value={form.sku}
//                           onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
//                           placeholder="Optional"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Batch No</label>
//                         <Input
//                           value={form.batchNo}
//                           onChange={(e) => setForm((p) => ({ ...p, batchNo: e.target.value }))}
//                           placeholder="Optional"
//                         />
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
//                         <Input
//                           type="number"
//                           value={form.stockQuantity}
//                           onChange={(e) => setForm((p) => ({ ...p, stockQuantity: e.target.value }))}
//                           placeholder="0"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
//                         <Input
//                           type="number"
//                           value={form.reorderLevel}
//                           onChange={(e) => setForm((p) => ({ ...p, reorderLevel: e.target.value }))}
//                           placeholder="0"
//                         />
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
//                       <Input
//                         type="date"
//                         value={form.expiryDate}
//                         onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
//                       />
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit</label>
//                         <Input
//                           type="number"
//                           value={form.price}
//                           onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
//                           placeholder="0.00"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
//                         <Input
//                           type="number"
//                           value={form.discountPrice}
//                           onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
//                           placeholder="Optional"
//                         />
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
//                       <Input
//                         value={form.supplier}
//                         onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
//                         placeholder="Supplier name"
//                       />
//                     </div>

//                     <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
//                       <div>
//                         <div className="text-sm font-medium text-gray-900">Prescription Required</div>
//                         <div className="text-xs text-gray-600">Enable if this medicine needs a valid prescription.</div>
//                       </div>
//                       <Switch
//                         checked={!!form.requiresPrescription}
//                         onCheckedChange={(v) => setForm((p) => ({ ...p, requiresPrescription: !!v }))}
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Image</label>
//                       <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />

//                       <div
//                         onDragOver={(e) => e.preventDefault()}
//                         onDrop={onDropImage}
//                         className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4"
//                       >
//                         <div className="flex items-start gap-4">
//                           <div className="h-20 w-20 rounded-md border bg-white flex items-center justify-center overflow-hidden">
//                             {imagePreviewUrl ? (
//                               <img src={imagePreviewUrl} alt="Medicine" className="h-full w-full object-cover" />
//                             ) : (
//                               <span className="text-xs text-gray-500">No image</span>
//                             )}
//                           </div>
//                           <div className="flex-1">
//                             <div className="text-sm font-medium text-gray-900">Upload a medicine photo</div>
//                             <div className="text-xs text-gray-600 mt-1">Drag & drop an image here, or choose a file.</div>
//                             <div className="mt-3 flex flex-wrap gap-2">
//                               <Button
//                                 type="button"
//                                 variant="outline"
//                                 className="bg-white"
//                                 onClick={() => fileInputRef.current?.click()}
//                               >
//                                 {imagePreviewUrl ? "Change image" : "Choose image"}
//                               </Button>
//                               {imageFile ? (
//                                 <Button
//                                   type="button"
//                                   variant="outline"
//                                   className="bg-white text-red-600 border-red-200 hover:text-red-700"
//                                   onClick={clearSelectedImage}
//                                 >
//                                   Remove
//                                 </Button>
//                               ) : null}
//                             </div>
//                             {editingId && imagePreviewUrl && !imageFile ? (
//                               <div className="text-xs text-gray-600 mt-2">
//                                 Showing current image. Choose a file to replace it.
//                               </div>
//                             ) : null}
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
//                       <Textarea
//                         value={form.description}
//                         onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
//                         placeholder="Short description shown in the store list…"
//                         rows={3}
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
//                       <Textarea
//                         value={form.longDescription}
//                         onChange={(e) => setForm((p) => ({ ...p, longDescription: e.target.value }))}
//                         placeholder="Full product description shown on product details page…"
//                         rows={4}
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Key Benefits</label>
//                       <Textarea
//                         value={form.keyBenefits}
//                         onChange={(e) => setForm((p) => ({ ...p, keyBenefits: e.target.value }))}
//                         placeholder={"Write one benefit per line\nExample:\nFast-acting relief\nDoctor recommended"}
//                         rows={4}
//                       />
//                       <div className="text-xs text-gray-600 mt-1">Tip: use one benefit per line.</div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Usage Instructions</label>
//                       <Textarea
//                         value={form.usageInstructions}
//                         onChange={(e) => setForm((p) => ({ ...p, usageInstructions: e.target.value }))}
//                         placeholder="How to use / dosage instructions…"
//                         rows={3}
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Important Warnings</label>
//                       <Textarea
//                         value={form.warnings}
//                         onChange={(e) => setForm((p) => ({ ...p, warnings: e.target.value }))}
//                         placeholder="Safety warnings, contraindications, etc…"
//                         rows={3}
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
//                       <Input
//                         value={form.tags}
//                         onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
//                         placeholder="Comma separated tags, e.g., painkiller, otc"
//                       />
//                     </div>
//                   </div>
//                   <div className="p-6 border-t bg-white sticky bottom-0">
//                     <div className="flex gap-2">
//                       <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsOpen(false)}>
//                         Cancel
//                       </Button>
//                       <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={submitForm}>
//                         {editingId ? "Update" : "Add"} Medicine
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>

//           {!!toast.message && (
//             <div
//               className={`rounded-lg p-3 text-sm ${
//                 toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
//               }`}
//             >
//               {toast.message}
//             </div>
//           )}

//           {!!error && (
//             <div className="rounded-lg p-3 text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>
//           )}

//           {/* Search */}
//           <Card className="p-4 flex flex-col md:flex-row gap-4">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//               <Input
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Search medicines..."
//                 className="pl-10"
//               />
//             </div>
//             <div className="flex gap-2">
//               <select
//                 value={categoryFilter}
//                 onChange={(e) => setCategoryFilter(e.target.value)}
//                 className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
//                 title="Filter by category"
//               >
//                 <option value="">All categories</option>
//                 {categories.map((c) => (
//                   <option key={c} value={c}>
//                     {c}
//                   </option>
//                 ))}
//               </select>
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
//                 title="Filter by status"
//               >
//                 <option value="">All statuses</option>
//                 <option value="in-stock">In stock</option>
//                 <option value="low">Low stock</option>
//                 <option value="out">Out of stock</option>
//                 <option value="expiring">Expiring soon</option>
//                 <option value="expired">Expired</option>
//               </select>
//             </div>
//           </Card>

//           {/* Inventory Table */}
//           <Card className="overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Medicine Name</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Reorder Level</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Expiry Date</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
//                     <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y">
//                   {loading && (
//                     <tr>
//                       <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
//                         Loading...
//                       </td>
//                     </tr>
//                   )}

//                   {!loading && filtered.map((item) => (
//                     <tr key={item.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 text-sm text-gray-900 font-medium">
//                         <button
//                           className="text-left hover:underline"
//                           onClick={() => setDetailsItem(item)}
//                           title="View details"
//                         >
//                           {item.name}
//                         </button>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-600">
//                         <span className={(item.stockQuantity || 0) === 0 ? "text-red-600 font-semibold" : ""}>
//                           {item.stockQuantity ?? 0} units
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-600">{item.reorderLevel ?? 0} units</td>
//                       <td className="px-6 py-4 text-sm text-gray-600">
//                         {item.expiryDate ? String(item.expiryDate).slice(0, 10) : "—"}
//                       </td>
//                       <td className="px-6 py-4">
//                         {item.status === "in-stock" && <Badge className="bg-green-100 text-green-800">In Stock</Badge>}
//                         {item.status === "low" && (
//                           <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1 w-fit">
//                             <AlertTriangle className="w-3 h-3" />
//                             Low Stock
//                           </Badge>
//                         )}
//                         {item.status === "out" && <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>}
//                         {item.status === "expired" && <Badge className="bg-red-100 text-red-800">Expired</Badge>}
//                         {item.status === "expiring" && (
//                           <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
//                             <AlertTriangle className="w-3 h-3" />
//                             Expiring Soon
//                           </Badge>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 text-right space-x-2">
//                         <Button size="sm" variant="outline" className="bg-transparent" onClick={() => setDetailsItem(item)} title="View">
//                           <Eye className="w-4 h-4" />
//                         </Button>
//                         <Button size="sm" variant="outline" className="bg-transparent" onClick={() => handleEdit(item)} title="Edit">
//                           <Edit className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           className="text-red-600 bg-transparent"
//                           onClick={() => handleDelete(item.id)}
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}

//                   {!loading && filtered.length === 0 && (
//                     <tr>
//                       <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
//                         No medicines found.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>

//           {/* Details Dialog */}
//           <Dialog open={!!detailsItem} onOpenChange={(open) => !open && setDetailsItem(null)}>
//               {/*
//                 Details modal can be very tall (description/benefits/specs). Make it scrollable.
//               */}
//               <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Medicine Details</DialogTitle>
//               </DialogHeader>
//               {detailsItem && (
//                 <div className="space-y-3 text-sm">
//                   <div className="-mx-6 -mt-6 mb-2">
//                     <div className="h-40 w-full bg-gray-100 rounded-t-xl overflow-hidden border-b">
//                       {detailsImageUrl ? (
//                         <img src={detailsImageUrl} alt={detailsItem.name} className="h-full w-full object-cover" />
//                       ) : (
//                         <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
//                           No image available
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex items-start justify-between gap-4">
//                     <div>
//                       <div className="font-semibold text-gray-900">{detailsItem.name}</div>
//                       <div className="text-gray-600">{detailsItem.genericName || ""}</div>
//                     </div>
//                     <Badge className="bg-gray-100 text-gray-800">{detailsItem.status}</Badge>
//                   </div>

//                   <div className="grid grid-cols-2 gap-3">
//                     <div>
//                       <div className="text-gray-500">Category</div>
//                       <div className="text-gray-900">{detailsItem.category || "—"}</div>
//                     </div>
//                     <div>
//                       <div className="text-gray-500">Dosage</div>
//                       <div className="text-gray-900">{detailsItem.dosage || "—"}</div>
//                     </div>
//                     <div>
//                       <div className="text-gray-500">Form</div>
//                       <div className="text-gray-900">{detailsItem.form || "—"}</div>
//                     </div>
//                     <div>
//                       <div className="text-gray-500">Manufacturer</div>
//                       <div className="text-gray-900">{detailsItem.manufacturer || "—"}</div>
//                     </div>
//                     <div>
//                       <div className="text-gray-500">Prescription</div>
//                       <div className="text-gray-900">{detailsItem.requiresPrescription ? "Required" : "Not Required"}</div>
//                     </div>
//                     <div>
//                       <div className="text-gray-500">Stock</div>
//                       <div className="text-gray-900">{detailsItem.stockQuantity ?? 0}</div>
//                     </div>
//                     <div>
//                       <div className="text-gray-500">Reorder Level</div>
//                       <div className="text-gray-900">{detailsItem.reorderLevel ?? 0}</div>
//                     </div>
//                     <div>
//                       <div className="text-gray-500">Expiry</div>
//                       <div className="text-gray-900">{detailsItem.expiryDate ? String(detailsItem.expiryDate).slice(0, 10) : "—"}</div>
//                     </div>
//                     <div>
//                       <div className="text-gray-500">Price</div>
//                       <div className="text-gray-900">{detailsItem.currency || "BDT"} {detailsItem.price ?? "—"}</div>
//                     </div>
//                   </div>

//                   {detailsItem.description && (
//                     <div>
//                       <div className="text-gray-500">Description</div>
//                       <div className="text-gray-900 whitespace-pre-line">{detailsItem.description}</div>
//                     </div>
//                   )}
//                   {detailsItem.longDescription && (
//                     <div>
//                       <div className="text-gray-500">Long Description</div>
//                       <div className="text-gray-900 whitespace-pre-line">{detailsItem.longDescription}</div>
//                     </div>
//                   )}

//                   {Array.isArray(detailsItem.keyBenefits) && detailsItem.keyBenefits.length > 0 && (
//                     <div>
//                       <div className="text-gray-500">Key Benefits</div>
//                       <ul className="list-disc pl-5 text-gray-900 space-y-1">
//                         {detailsItem.keyBenefits.map((b, idx) => (
//                           <li key={idx}>{b}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}

//                   {detailsItem.usageInstructions && (
//                     <div>
//                       <div className="text-gray-500">Usage Instructions</div>
//                       <div className="text-gray-900 whitespace-pre-line">{detailsItem.usageInstructions}</div>
//                     </div>
//                   )}

//                   {detailsItem.warnings && (
//                     <div>
//                       <div className="text-gray-500">Warnings</div>
//                       <div className="text-gray-900 whitespace-pre-line">{detailsItem.warnings}</div>
//                     </div>
//                   )}

//                   <div className="flex gap-2 pt-2">
//                     <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setDetailsItem(null)}>
//                       Close
//                     </Button>
//                     <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={() => { const it = detailsItem; setDetailsItem(null); handleEdit(it); }}>
//                       Edit
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </DialogContent>
//           </Dialog>
//         </main>
//       </div>
//     </div>
//   );
// }


import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Edit, Trash2, AlertTriangle, Eye } from "lucide-react";
import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
import { api } from "@/services/api";

export default function Medicines() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ type: "", message: "" });

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [detailsItem, setDetailsItem] = useState(null);
  const [detailsImageUrl, setDetailsImageUrl] = useState("");

  const emptyForm = {
    name: "",
    genericName: "",
    category: "",
    dosage: "",
    form: "",
    manufacturer: "",
    sku: "",
    price: "",
    discountPrice: "",
    stockQuantity: "",
    reorderLevel: "",
    expiryDate: "",
    supplier: "",
    batchNo: "",
    requiresPrescription: false,
    description: "",
    longDescription: "",
    keyBenefits: "",
    usageInstructions: "",
    warnings: "",
    tags: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const revokeUrl = (url) => {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch {}
  };

  const loadItemImage = async (itemId, setter) => {
    if (!itemId) return;
    try {
      const { blob } = await api.getPharmacyInventoryImage(itemId);
      setter(URL.createObjectURL(blob));
    } catch {
      setter("");
    }
  };

  const fetchItems = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listPharmacyInventory(params);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(e?.message || "Failed to load inventory");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchItems({
        search: query.trim(),
        category: categoryFilter,
        status: statusFilter,
        limit: 200,
      });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchItems({ limit: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => revokeUrl(imagePreviewUrl), [imagePreviewUrl]);

  useEffect(() => {
    let active = true;
    revokeUrl(detailsImageUrl);
    setDetailsImageUrl("");
    if (!detailsItem?.id) return;

    (async () => {
      try {
        const { blob } = await api.getPharmacyInventoryImage(detailsItem.id);
        if (!active) return;
        setDetailsImageUrl(URL.createObjectURL(blob));
      } catch {
        if (active) setDetailsImageUrl("");
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailsItem?.id]);

  const categories = useMemo(() => {
    const s = new Set();
    items.forEach((i) => i.category && s.add(i.category));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => String(it.name || "").toLowerCase().includes(q));
  }, [items, query]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medicine from inventory?")) return;
    try {
      await api.deletePharmacyInventoryItem(id);
      setToast({ type: "success", message: "Medicine deleted" });
      fetchItems({ search: query.trim(), category: categoryFilter, status: statusFilter, limit: 200 });
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Failed to delete" });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    revokeUrl(imagePreviewUrl);
    setImagePreviewUrl("");
    setIsOpen(true);
  };

  const handleEdit = async (item) => {
    setEditingId(item.id);
    setImageFile(null);
    revokeUrl(imagePreviewUrl);
    setImagePreviewUrl("");

    setForm({
      ...emptyForm,
      name: item.name || "",
      genericName: item.genericName || "",
      category: item.category || "",
      dosage: item.dosage || "",
      form: item.form || "",
      manufacturer: item.manufacturer || "",
      sku: item.sku || "",
      price: item.price ?? "",
      discountPrice: item.discountPrice ?? "",
      stockQuantity: item.stockQuantity ?? "",
      reorderLevel: item.reorderLevel ?? "",
      expiryDate: item.expiryDate ? String(item.expiryDate).slice(0, 10) : "",
      supplier: item.supplier || "",
      batchNo: item.batchNo || "",
      requiresPrescription: Boolean(item.requiresPrescription),
      description: item.description || "",
      longDescription: item.longDescription || "",
      keyBenefits: Array.isArray(item.keyBenefits) ? item.keyBenefits.join("\n") : item.keyBenefits || "",
      usageInstructions: item.usageInstructions || "",
      warnings: item.warnings || "",
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
    });

    if (item?.id) await loadItemImage(item.id, setImagePreviewUrl);
    setIsOpen(true);
  };

  const handleImageChange = (file) => {
    revokeUrl(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  const onPickImage = (e) => handleImageChange(e?.target?.files?.[0] || null);

  const onDropImage = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || null;
    if (file) handleImageChange(file);
  };

  const clearSelectedImage = () => {
    handleImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitForm = async () => {
    const payload = {
      ...form,
      price: form.price === "" ? undefined : Number(form.price),
      discountPrice: form.discountPrice === "" ? null : Number(form.discountPrice),
      stockQuantity: form.stockQuantity === "" ? 0 : Number(form.stockQuantity),
      reorderLevel: form.reorderLevel === "" ? 0 : Number(form.reorderLevel),
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
      tags: form.tags,
    };

    const body = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === null || typeof v === "undefined") return;
      body.append(k, typeof v === "string" ? v : String(v));
    });
    if (imageFile) body.append("image", imageFile);

    try {
      if (editingId) {
        await api.updatePharmacyInventoryItem(editingId, body);
        setToast({ type: "success", message: "Medicine updated" });
      } else {
        await api.createPharmacyInventoryItem(body);
        setToast({ type: "success", message: "Medicine added" });
      }
      setIsOpen(false);
      fetchItems({ search: query.trim(), category: categoryFilter, status: statusFilter, limit: 200 });
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Save failed" });
    }
  };

  // ✅ Better filter selects (consistent + readable + responsive)
  const selectCls =
    "h-10 w-full sm:w-auto min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
    "shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2";

  // ✅ Better outline button (your “View all” style)
  const outlineBtn =
    "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 " +
    "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

  return (
    <div className="min-h-screen bg-gray-50">
      <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <PharmacyNavbar
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search medicines, SKU, manufacturer…"
        />

        {/* ✅ Better responsive padding */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                Inventory Management
              </h1>
              <p className="text-gray-700 mt-1">
                Manage medicines, stock levels, and expiry dates
              </p>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                {/* ✅ Green theme, high contrast */}
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={openCreate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medicine
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b bg-white sticky top-0 z-10">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900">
                        {editingId ? "Edit Medicine" : "Add New Medicine"}
                      </DialogTitle>
                    </DialogHeader>
                  </div>

                  <div className="p-5 overflow-y-auto space-y-4">
                    {/* ✅ Labels darker for visibility */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Medicine Name</label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Paracetamol 500mg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Generic Name</label>
                      <Input
                        value={form.genericName}
                        onChange={(e) => setForm((p) => ({ ...p, genericName: e.target.value }))}
                        placeholder="e.g., Acetaminophen"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Category</label>
                        <Input
                          value={form.category}
                          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                          placeholder="e.g., Pain Relief"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Dosage</label>
                        <Input
                          value={form.dosage}
                          onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
                          placeholder="e.g., 500mg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Form</label>
                        <Input
                          value={form.form}
                          onChange={(e) => setForm((p) => ({ ...p, form: e.target.value }))}
                          placeholder="e.g., Tablets / Capsules / Syrup"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Manufacturer</label>
                        <Input
                          value={form.manufacturer}
                          onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))}
                          placeholder="e.g., Square / Beximco"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">SKU</label>
                        <Input
                          value={form.sku}
                          onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Batch No</label>
                        <Input
                          value={form.batchNo}
                          onChange={(e) => setForm((p) => ({ ...p, batchNo: e.target.value }))}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Current Stock</label>
                        <Input
                          type="number"
                          value={form.stockQuantity}
                          onChange={(e) => setForm((p) => ({ ...p, stockQuantity: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Reorder Level</label>
                        <Input
                          type="number"
                          value={form.reorderLevel}
                          onChange={(e) => setForm((p) => ({ ...p, reorderLevel: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Expiry Date</label>
                      <Input
                        type="date"
                        value={form.expiryDate}
                        onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Price per Unit</label>
                        <Input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Discount Price</label>
                        <Input
                          type="number"
                          value={form.discountPrice}
                          onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Supplier</label>
                      <Input
                        value={form.supplier}
                        onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
                        placeholder="Supplier name"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Prescription Required</div>
                        <div className="text-xs text-gray-700">Enable if this medicine needs a valid prescription.</div>
                      </div>
                      <Switch
                        checked={!!form.requiresPrescription}
                        onCheckedChange={(v) => setForm((p) => ({ ...p, requiresPrescription: !!v }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Medicine Image</label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />

                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDropImage}
                        className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-20 w-20 rounded-md border bg-white flex items-center justify-center overflow-hidden">
                            {imagePreviewUrl ? (
                              <img src={imagePreviewUrl} alt="Medicine" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs text-gray-600">No image</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">Upload a medicine photo</div>
                            <div className="text-xs text-gray-700 mt-1">
                              Drag & drop an image here, or choose a file.
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button type="button" variant="outline" className={outlineBtn} onClick={() => fileInputRef.current?.click()}>
                                {imagePreviewUrl ? "Change image" : "Choose image"}
                              </Button>
                              {imageFile ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="bg-white text-red-700 border-red-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                                  onClick={clearSelectedImage}
                                >
                                  Remove
                                </Button>
                              ) : null}
                            </div>
                            {editingId && imagePreviewUrl && !imageFile ? (
                              <div className="text-xs text-gray-700 mt-2">
                                Showing current image. Choose a file to replace it.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Short Description</label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Short description shown in the store list…"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Long Description</label>
                      <Textarea
                        value={form.longDescription}
                        onChange={(e) => setForm((p) => ({ ...p, longDescription: e.target.value }))}
                        placeholder="Full product description shown on product details page…"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Key Benefits</label>
                      <Textarea
                        value={form.keyBenefits}
                        onChange={(e) => setForm((p) => ({ ...p, keyBenefits: e.target.value }))}
                        placeholder={"Write one benefit per line\nExample:\nFast-acting relief\nDoctor recommended"}
                        rows={4}
                      />
                      <div className="text-xs text-gray-700 mt-1">Tip: use one benefit per line.</div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Usage Instructions</label>
                      <Textarea
                        value={form.usageInstructions}
                        onChange={(e) => setForm((p) => ({ ...p, usageInstructions: e.target.value }))}
                        placeholder="How to use / dosage instructions…"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Important Warnings</label>
                      <Textarea
                        value={form.warnings}
                        onChange={(e) => setForm((p) => ({ ...p, warnings: e.target.value }))}
                        placeholder="Safety warnings, contraindications, etc…"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Tags</label>
                      <Input
                        value={form.tags}
                        onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                        placeholder="Comma separated tags, e.g., painkiller, otc"
                      />
                    </div>
                  </div>

                  <div className="p-5 border-t bg-white sticky bottom-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" className={`sm:flex-1 ${outlineBtn}`} onClick={() => setIsOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={submitForm}>
                        {editingId ? "Update" : "Add"} Medicine
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!!toast.message && (
            <div
              className={`rounded-lg p-3 text-sm border ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {toast.message}
            </div>
          )}

          {!!error && (
            <div className="rounded-lg p-3 text-sm bg-red-50 text-red-800 border border-red-200">{error}</div>
          )}

          {/* Search + Filters */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search medicines..."
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={selectCls}
                  title="Filter by category"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={selectCls}
                  title="Filter by status"
                >
                  <option value="">All statuses</option>
                  <option value="in-stock">In stock</option>
                  <option value="low">Low stock</option>
                  <option value="out">Out of stock</option>
                  <option value="expiring">Expiring soon</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </Card>

          {/* ✅ Desktop Table */}
          <Card className="overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Medicine Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Reorder Level</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Expiry Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-700">
                        Loading...
                      </td>
                    </tr>
                  )}

                  {!loading && filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        <button className="text-left hover:underline" onClick={() => setDetailsItem(item)}>
                          {item.name}
                        </button>
                        <div className="text-xs text-gray-700 mt-0.5">
                          {item.genericName || "—"} • {item.manufacturer || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-800">
                        <span className={(item.stockQuantity || 0) === 0 ? "text-red-700 font-bold" : "font-medium"}>
                          {item.stockQuantity ?? 0} units
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.reorderLevel ?? 0} units</td>

                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                        {item.expiryDate ? String(item.expiryDate).slice(0, 10) : "—"}
                      </td>

                      <td className="px-6 py-4">
                        {item.status === "in-stock" && <Badge className="bg-emerald-100 text-emerald-800">In Stock</Badge>}
                        {item.status === "low" && (
                          <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </Badge>
                        )}
                        {item.status === "out" && <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>}
                        {item.status === "expired" && <Badge className="bg-red-100 text-red-800">Expired</Badge>}
                        {item.status === "expiring" && (
                          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Expiring Soon
                          </Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <Button size="sm" variant="outline" className={outlineBtn} onClick={() => setDetailsItem(item)} title="View">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className={outlineBtn} onClick={() => handleEdit(item)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white text-red-700 border-red-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-700">
                        No medicines found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ✅ Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {loading ? (
              <Card className="p-6 text-center text-gray-700">Loading...</Card>
            ) : filtered.length === 0 ? (
              <Card className="p-6 text-center text-gray-700">No medicines found.</Card>
            ) : (
              filtered.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button className="text-left flex-1" onClick={() => setDetailsItem(item)}>
                      <div className="text-sm font-bold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-700 mt-0.5">
                        {item.genericName || "—"} • {item.manufacturer || "—"}
                      </div>
                    </button>
                    <div className="shrink-0">
                      {item.status === "in-stock" && <Badge className="bg-emerald-100 text-emerald-800">In Stock</Badge>}
                      {item.status === "low" && <Badge className="bg-orange-100 text-orange-800">Low</Badge>}
                      {item.status === "out" && <Badge className="bg-red-100 text-red-800">Out</Badge>}
                      {item.status === "expiring" && <Badge className="bg-yellow-100 text-yellow-800">Expiring</Badge>}
                      {item.status === "expired" && <Badge className="bg-red-100 text-red-800">Expired</Badge>}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-700">Stock</div>
                      <div className={(item.stockQuantity || 0) === 0 ? "text-red-700 font-bold" : "text-gray-900 font-semibold"}>
                        {item.stockQuantity ?? 0} units
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-700">Reorder</div>
                      <div className="text-gray-900 font-semibold">{item.reorderLevel ?? 0}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-700">Expiry</div>
                      <div className="text-gray-900 font-semibold">
                        {item.expiryDate ? String(item.expiryDate).slice(0, 10) : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className={`flex-1 ${outlineBtn}`} onClick={() => setDetailsItem(item)}>
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                    <Button variant="outline" className={`flex-1 ${outlineBtn}`} onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white text-red-700 border-red-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                      onClick={() => handleDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Details Dialog (kept mostly same, fixed contrast + buttons) */}
          <Dialog open={!!detailsItem} onOpenChange={(open) => !open && setDetailsItem(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Medicine Details</DialogTitle>
              </DialogHeader>

              {detailsItem && (
                <div className="space-y-3 text-sm">
                  <div className="-mx-6 -mt-6 mb-2">
                    <div className="h-40 w-full bg-gray-100 rounded-t-xl overflow-hidden border-b">
                      {detailsImageUrl ? (
                        <img src={detailsImageUrl} alt={detailsItem.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm text-gray-700">
                          No image available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-gray-900">{detailsItem.name}</div>
                      <div className="text-gray-700">{detailsItem.genericName || ""}</div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-900 border border-gray-200">
                      {detailsItem.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Info label="Category" value={detailsItem.category || "—"} />
                    <Info label="Dosage" value={detailsItem.dosage || "—"} />
                    <Info label="Form" value={detailsItem.form || "—"} />
                    <Info label="Manufacturer" value={detailsItem.manufacturer || "—"} />
                    <Info label="Prescription" value={detailsItem.requiresPrescription ? "Required" : "Not Required"} />
                    <Info label="Stock" value={String(detailsItem.stockQuantity ?? 0)} />
                    <Info label="Reorder Level" value={String(detailsItem.reorderLevel ?? 0)} />
                    <Info label="Expiry" value={detailsItem.expiryDate ? String(detailsItem.expiryDate).slice(0, 10) : "—"} />
                    <Info label="Price" value={`${detailsItem.currency || "BDT"} ${detailsItem.price ?? "—"}`} />
                  </div>

                  {detailsItem.description && (
                    <div>
                      <div className="text-gray-800 font-semibold">Description</div>
                      <div className="text-gray-900 whitespace-pre-line">{detailsItem.description}</div>
                    </div>
                  )}

                  {detailsItem.longDescription && (
                    <div>
                      <div className="text-gray-800 font-semibold">Long Description</div>
                      <div className="text-gray-900 whitespace-pre-line">{detailsItem.longDescription}</div>
                    </div>
                  )}

                  {Array.isArray(detailsItem.keyBenefits) && detailsItem.keyBenefits.length > 0 && (
                    <div>
                      <div className="text-gray-800 font-semibold">Key Benefits</div>
                      <ul className="list-disc pl-5 text-gray-900 space-y-1">
                        {detailsItem.keyBenefits.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detailsItem.usageInstructions && (
                    <div>
                      <div className="text-gray-800 font-semibold">Usage Instructions</div>
                      <div className="text-gray-900 whitespace-pre-line">{detailsItem.usageInstructions}</div>
                    </div>
                  )}

                  {detailsItem.warnings && (
                    <div>
                      <div className="text-gray-800 font-semibold">Warnings</div>
                      <div className="text-gray-900 whitespace-pre-line">{detailsItem.warnings}</div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button variant="outline" className={`sm:flex-1 ${outlineBtn}`} onClick={() => setDetailsItem(null)}>
                      Close
                    </Button>
                    <Button
                      className="sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        const it = detailsItem;
                        setDetailsItem(null);
                        handleEdit(it);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="text-xs text-gray-700 font-semibold">{label}</div>
      <div className="text-sm text-gray-900 font-bold mt-0.5">{value}</div>
    </div>
  );
}