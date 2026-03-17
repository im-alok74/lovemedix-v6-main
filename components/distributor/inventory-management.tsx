"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react"

interface InventoryItem {
  id: number
  medicine_id: number
  name: string
  generic_name: string
  manufacturer: string
  batch_number: string
  mfg_date: string
  expiry_date: string
  mrp: number | string
  quantity: number | string
  unit_price: number | string
  amount: number | string
  hsn_code: string
  notes: string
  form: string
  strength: string
  reserved_quantity?: number
}

// These are enforced by the database CHECK constraint on medicines.form
const ALLOWED_FORMS = [
  "tablet",
  "capsule",
  "syrup",
  "injection",
  "cream",
  "drops",
  "inhaler",
  "other",
] as const

export function AddMedicineForm() {
  const [medicines, setMedicines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [formOptions, setFormOptions] = useState<string[]>([...ALLOWED_FORMS])
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isNewMedicine, setIsNewMedicine] = useState(false)
  const [formData, setFormData] = useState({
    medicineId: "",
    name: "",
    genericName: "",
    manufacturer: "",
    category: "",
    form: "",
    strength: "",
    packSize: "",
    imageUrl: "",
    batchNumber: "",
    mfgDate: "",
    expiryDate: "",
    mrp: "",
    quantity: "",
    unitPrice: "",
    hsnCode: "",
    notes: "",
  })
  const { toast } = useToast()

  const uploadImageFile = async (file: File) => {
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/medicines/upload-image", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Upload failed",
          description: data.error || "Failed to upload image",
          variant: "destructive",
        })
        return
      }
      setFormData((prev) => ({ ...prev, imageUrl: data.url }))
      toast({ title: "Uploaded", description: "Image uploaded successfully" })
    } catch (e) {
      toast({
        title: "Upload failed",
        description: "Something went wrong while uploading",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medRes, catRes] = await Promise.all([
          fetch("/api/medicines"),
          fetch("/api/medicines/categories"),
        ])

        if (!medRes.ok) {
          throw new Error("Failed to fetch medicines")
        }
        const medData = await medRes.json()
        setMedicines(medData.medicines || [])

        if (catRes.ok) {
          const catData = await catRes.json()
          setCategoryOptions(catData.categories || [])
        }

      } catch (error) {
        console.error("[v0] Error fetching medicines/categories:", error)
        toast({
          title: "Error",
          description: "Failed to load medicines or categories",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (!isNewMedicine && !formData.medicineId) {
      toast({
        title: "Select medicine",
        description: "Please select a medicine from the list or switch to adding a new one.",
        variant: "destructive",
      })
      setSubmitting(false)
      return
    }

    if (isNewMedicine && !formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a medicine name.",
        variant: "destructive",
      })
      setSubmitting(false)
      return
    }

    try {
      const rawForm = formData.form.trim().toLowerCase()
      const normalizedForm = ALLOWED_FORMS.includes(rawForm as (typeof ALLOWED_FORMS)[number])
        ? rawForm
        : "other"

      const response = await fetch("/api/distributor/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isNewMedicine,
          medicineId: formData.medicineId ? parseInt(formData.medicineId) : null,
          newMedicine: isNewMedicine
            ? {
                name: formData.name.trim(),
                generic_name: formData.genericName.trim() || null,
                manufacturer: formData.manufacturer.trim() || null,
                category: formData.category.trim() || null,
                form: normalizedForm,
                strength: formData.strength.trim() || null,
                pack_size: formData.packSize.trim() || null,
                mrp: parseFloat(formData.mrp),
                image_url: formData.imageUrl.trim() || null,
                requires_prescription: false,
              }
            : null,
          batchNumber: formData.batchNumber,
          mfgDate: formData.mfgDate || null,
          expiryDate: formData.expiryDate,
          mrp: parseFloat(formData.mrp),
          quantity: parseInt(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          hsnCode: formData.hsnCode,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("[v0] Add medicine error:", data)
        toast({
          title: "Error",
          description: data.error || "Failed to add medicine",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      console.log("[v0] Medicine added successfully:", data)

      toast({
        title: "Success",
        description: data.message || "Medicine added to inventory",
      })

      // Reset form
      setFormData({
        medicineId: "",
        name: "",
        genericName: "",
        manufacturer: "",
        category: "",
        form: "",
        strength: "",
        packSize: "",
        imageUrl: "",
        batchNumber: "",
        mfgDate: "",
        expiryDate: "",
        mrp: "",
        quantity: "",
        unitPrice: "",
        hsnCode: "",
        notes: "",
      })

    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-lg font-semibold mb-6">Add Medicine to Inventory</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {isNewMedicine
              ? "Create a new medicine in the catalog and add its stock."
              : "Select an existing medicine from the catalog and add stock."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsNewMedicine((v) => !v)}
          >
            {isNewMedicine ? "Use existing medicine" : "Add new medicine"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isNewMedicine ? (
            <div className="md:col-span-2">
              <Label htmlFor="medicineId">Select Medicine *</Label>
              {loading ? (
                <div className="mt-2 text-sm text-muted-foreground">
                  Loading medicines...
                </div>
              ) : (
                <select
                  id="medicineId"
                  value={formData.medicineId}
                  onChange={(e) =>
                    setFormData({ ...formData, medicineId: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                  required
                >
                  <option value="">Select Medicine</option>
                  {medicines.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name} {med.strength ? `- ${med.strength}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  value={formData.genericName}
                  onChange={(e) =>
                    setFormData({ ...formData, genericName: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                >
                  <option value="">Select or type category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Input
                  id="categoryCustom"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="mt-2"
                  placeholder="Or type a new category (e.g., Antibiotic)"
                />
              </div>
              <div>
                <Label htmlFor="form">Form</Label>
                <select
                  id="form"
                  value={formData.form}
                  onChange={(e) =>
                    setFormData({ ...formData, form: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                >
                  <option value="">Select or type form</option>
                  {formOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <Input
                  id="formCustom"
                  value={formData.form}
                  onChange={(e) =>
                    setFormData({ ...formData, form: e.target.value })
                  }
                  className="mt-2"
                  placeholder="Or type a new form (e.g., tablet, syrup)"
                />
              </div>
              <div>
                <Label htmlFor="strength">Strength</Label>
                <Input
                  id="strength"
                  value={formData.strength}
                  onChange={(e) =>
                    setFormData({ ...formData, strength: e.target.value })
                  }
                  className="mt-1"
                  placeholder="e.g., 500mg"
                />
              </div>
              <div>
                <Label htmlFor="packSize">Pack Size</Label>
                <Input
                  id="packSize"
                  value={formData.packSize}
                  onChange={(e) =>
                    setFormData({ ...formData, packSize: e.target.value })
                  }
                  className="mt-1"
                  placeholder="e.g., strip of 10"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="imageUrl">Medicine Photo (Image URL)</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="mt-1"
                  placeholder="https://..."
                />
                <div className="mt-3 flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadImageFile(file)
                    }}
                    disabled={uploadingImage}
                  />
                  <Button type="button" variant="outline" size="sm" disabled>
                    {uploadingImage ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                {formData.imageUrl?.trim() && (
                  <div className="mt-3">
                    <img
                      src={formData.imageUrl.trim()}
                      alt="Preview"
                      className="h-24 w-24 rounded-md border object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = "none"
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
              placeholder="e.g., B12345"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="mfgDate">Mfg. Date</Label>
            <Input
              id="mfgDate"
              type="date"
              value={formData.mfgDate}
              onChange={(e) =>
                setFormData({ ...formData, mfgDate: e.target.value })
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Expiry Date *</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="mrp">MRP (₹) *</Label>
            <Input
              id="mrp"
              type="number"
              step="0.01"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
              placeholder="0.00"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              placeholder="0"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="unitPrice">Unit Price (₹) *</Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) =>
                setFormData({ ...formData, unitPrice: e.target.value })
              }
              placeholder="0.00"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="hsnCode">HSN Code</Label>
            <Input
              id="hsnCode"
              value={formData.hsnCode}
              onChange={(e) =>
                setFormData({ ...formData, hsnCode: e.target.value })
              }
              placeholder="e.g., 3004"
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
              rows={3}
            />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add to Inventory
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}

export function InventoryTable() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchInventory()
  }, [refreshTrigger])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/distributor/inventory")
      if (!response.ok) {
        throw new Error("Failed to fetch inventory")
      }
      const data = await response.json()
      console.log("[v0] Inventory fetched:", data)
      const normalized = (data.inventory || []).map((it: any) => ({
        ...it,
        mrp: Number(it.mrp || 0),
        quantity: Number(it.quantity || 0),
        unit_price: Number(it.unit_price || 0),
        amount: Number(it.amount || 0),
        reserved_quantity: it.reserved_quantity !== undefined ? Number(it.reserved_quantity || 0) : undefined,
      }))
      setInventory(normalized)
    } catch (error) {
      console.error("[v0] Error fetching inventory:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this medicine?")) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/distributor/inventory/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("[v0] Delete error:", data)
        toast({
          title: "Error",
          description: data.error || "Failed to delete",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      console.log("[v0] Medicine deleted:", data)

      toast({ title: "Success", description: data.message })
      setInventory(inventory.filter((item) => item.id !== id))
    } catch (error) {
      console.error("[v0] Delete error:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>
  }

  if (inventory.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No medicines in inventory yet</p>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicine Name</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.strength} - {item.form}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{item.batch_number || "-"}</TableCell>
              <TableCell className="font-medium">{Number(item.quantity)}</TableCell>
              <TableCell className="text-sm">₹{Number(item.unit_price).toFixed(2)}</TableCell>
              <TableCell className="font-medium">
                ₹{Number(item.amount || (Number(item.quantity) * Number(item.unit_price))).toFixed(2)}
              </TableCell>
              <TableCell className="text-sm">
                {new Date(item.expiry_date).toLocaleDateString("en-IN")}
              </TableCell>
              <TableCell>
                {isExpired(item.expiry_date) ? (
                  <Badge variant="destructive" className="text-xs">
                    Expired
                  </Badge>
                ) : isExpiringSoon(item.expiry_date) ? (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                    Expiring Soon
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
