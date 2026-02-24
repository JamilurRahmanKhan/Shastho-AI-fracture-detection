/**
 * Frontend page: AddMedicine
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar"
import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar"
import { api } from "@/services/api";

export default function AddMedicine() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const [toast, setToast] = useState({ type: "", message: "" })
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    genericName: "",
    category: "",
    dosage: "",
    price: "",
    stockQuantity: "",
    reorderLevel: "",
    manufacturer: "",
    expiryDate: "",
    description: "",
    tags: "",
  })

  const submit = async () => {
    setToast({ type: "", message: "" })
    setSaving(true)
    try {
      await api.createPharmacyInventoryItem({
        name: form.name,
        genericName: form.genericName,
        category: form.category,
        dosage: form.dosage,
        manufacturer: form.manufacturer,
        price: form.price === "" ? undefined : Number(form.price),
        stockQuantity: form.stockQuantity === "" ? 0 : Number(form.stockQuantity),
        reorderLevel: form.reorderLevel === "" ? 0 : Number(form.reorderLevel),
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
        description: form.description,
        tags: form.tags,
      })
      setToast({ type: "success", message: "Medicine added to inventory" })
      setTimeout(() => navigate("/pharmacy/medicines"), 350)
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Failed to add medicine" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <PharmacyNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Medicine</h1>
            <p className="text-gray-600">Enter medicine details to add to inventory</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Medicine Information</h2>
              {!!toast.message && (
                <div className={`mb-4 rounded-md border p-3 text-sm ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  {toast.message}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Medicine Name</Label>
                    <Input id="name" placeholder="Ibuprofen" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="genericName">Generic Name</Label>
                    <Input id="genericName" placeholder="Ibuprofen" value={form.genericName} onChange={(e) => setForm((p) => ({ ...p, genericName: e.target.value }))} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="painkiller">Pain Relief</SelectItem>
                        <SelectItem value="antibiotic">Antibiotic</SelectItem>
                        <SelectItem value="supplement">Supplement</SelectItem>
                        <SelectItem value="bone">Bone Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input id="dosage" placeholder="400mg" value={form.dosage} onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price per Unit</Label>
                    <Input id="price" type="number" placeholder="8.99" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input id="stock" type="number" placeholder="500" value={form.stockQuantity} onChange={(e) => setForm((p) => ({ ...p, stockQuantity: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Minimum Stock Alert</Label>
                    <Input id="minStock" type="number" placeholder="50" value={form.reorderLevel} onChange={(e) => setForm((p) => ({ ...p, reorderLevel: e.target.value }))} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input id="manufacturer" placeholder="PharmaCorp Inc." value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input id="expiryDate" type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    className="h-24"
                    placeholder="Medicine description, usage instructions, side effects..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" placeholder="painkiller, anti-inflammatory, prescription" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
                </div>

                <div>
                  <Label>Medicine Image</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold text-teal-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => navigate("/pharmacy/medicines")} disabled={saving}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={submit} disabled={saving}>
                    {saving ? "Saving..." : "Add Medicine"}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-teal-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Use clear, descriptive names</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-teal-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Set accurate stock levels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-teal-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Add relevant tags for easy search</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-teal-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Upload high-quality images</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Required Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medicine Name</span>
                    <span className="text-red-600">*</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="text-red-600">*</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="text-red-600">*</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock Quantity</span>
                    <span className="text-red-600">*</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
