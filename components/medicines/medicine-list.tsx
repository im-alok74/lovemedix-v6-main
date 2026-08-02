import Link from "next/link"
import { sql } from "@/lib/db"
import { MedicineCard } from "./medicine-card"

interface Medicine {
  id: number
  name: string
  generic_name: string | null
  manufacturer: string | null
  category: string | null
  form: string | null
  strength: string | null
  pack_size: string | null
  description: string | null
  requires_prescription: boolean
  mrp: string
  image_url: string | null
  status: string
  selling_price: string | null
  discount_percentage: string | null
  pharmacy_id: number | null
  pharmacy_name: string | null
}

async function getShowAllMedicinesSetting() {
  try {
    const result = await sql`
      SELECT setting_value FROM platform_settings
      WHERE setting_key = 'show_all_medicines_on_homepage'
      LIMIT 1
    `
    return result.length > 0 ? result[0].setting_value === "true" : false
  } catch (error) {
    console.error("[medicine-list] Error fetching settings:", error)
    return false
  }
}

export async function MedicineList({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; price?: string; manufacturer?: string; rating?: string; availability?: string; prescription?: string; dosage?: string; discount?: string; sort?: string; view?: string; page?: string } | Promise<{ search?: string; category?: string; price?: string; manufacturer?: string; rating?: string; availability?: string; prescription?: string; dosage?: string; discount?: string; sort?: string; view?: string; page?: string }>
}) {
  const params = await searchParams
  const searchQuery = params.search || ""
  const category = params.category || ""
  const priceFilter = params.price || ""
  const manufacturerFilter = params.manufacturer || ""
  const ratingFilter = params.rating || ""
  const availabilityFilter = params.availability || ""
  const prescriptionFilter = params.prescription || ""
  const dosageFilter = params.dosage || ""
  const discountFilter = params.discount || ""
  const sort = params.sort || "relevance"
  const view = params.view || "grid"
  const page = Number.parseInt(params.page || "1", 10) || 1

  let medicines: Medicine[] = []

  try {
    const q = searchQuery.trim()
    const qLike = `%${q}%`

    const showAllMedicines = await getShowAllMedicinesSetting()

    if (showAllMedicines) {
      medicines = (await sql`
        SELECT
          m.id,
          m.name,
          m.generic_name,
          m.manufacturer,
          m.category,
          m.form,
          m.strength,
          m.pack_size,
          m.description,
          m.requires_prescription,
          m.mrp,
          m.image_url,
          m.status,
          NULL as selling_price,
          NULL as discount_percentage,
          NULL as pharmacy_id,
          NULL as pharmacy_name
        FROM medicines m
        WHERE m.status = 'active'
          AND (${q === ""} OR (m.name ILIKE ${qLike} OR m.generic_name ILIKE ${qLike}))
          AND (${category === ""} OR m.category = ${category})
        ORDER BY CASE WHEN m.image_url IS NOT NULL AND m.image_url <> '' THEN 1 ELSE 0 END DESC,
          LOWER(m.name) ASC
        LIMIT 500
      `) as Medicine[]
    } else {
      medicines = (await sql`
        WITH best_offers AS (
          SELECT DISTINCT ON (m.id)
            m.id,
            m.name,
            m.generic_name,
            m.manufacturer,
            m.category,
            m.form,
            m.strength,
            m.pack_size,
            m.description,
            m.requires_prescription,
            m.mrp,
            m.image_url,
            m.status,
            pi.selling_price,
            pi.discount_percentage,
            pi.pharmacy_id,
            pp.pharmacy_name
          FROM pharmacy_inventory pi
          JOIN pharmacy_profiles pp
            ON pp.id = pi.pharmacy_id
           AND pp.verification_status = 'verified'
          JOIN medicines m
            ON m.id = pi.medicine_id
          WHERE m.status = 'active'
            AND pi.stock_quantity > 0
            AND (pi.expiry_date IS NULL OR pi.expiry_date >= CURRENT_DATE)
            AND (${q === ""} OR (m.name ILIKE ${qLike} OR m.generic_name ILIKE ${qLike}))
            AND (${category === ""} OR m.category = ${category})
          ORDER BY
            m.id,
            COALESCE(pi.discount_percentage, 0) DESC,
            pi.selling_price ASC
        )
        SELECT *
        FROM best_offers
        ORDER BY CASE WHEN image_url IS NOT NULL AND image_url <> '' THEN 1 ELSE 0 END DESC,
          LOWER(name) ASC
        LIMIT 250
      `) as Medicine[]
    }
  } catch (error) {
    console.error("[medicine-list] Error fetching medicines:", error)
    return (
      <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-12 text-center">
        <p className="text-muted-foreground">Unable to load medicines. Please try again later.</p>
      </div>
    )
  }

  const normalizedMedicines = medicines
    .filter((medicine) => {
      const mrp = Number.parseFloat(String(medicine.mrp || 0))
      const sellingPrice = medicine.selling_price !== undefined && medicine.selling_price !== null
        ? Number.parseFloat(String(medicine.selling_price || 0))
        : mrp
      const finalPrice = sellingPrice > 0 ? sellingPrice : mrp
      const discountPercentage = medicine.discount_percentage !== undefined && medicine.discount_percentage !== null
        ? Number.parseFloat(String(medicine.discount_percentage || 0))
        : 0
      const rating = 4.2 + ((medicine.id % 5) * 0.2)
      const inStock = medicine.status === "active"

      if (priceFilter === "under-100" && finalPrice >= 100) return false
      if (priceFilter === "100-500" && (finalPrice < 100 || finalPrice > 500)) return false
      if (priceFilter === "500-1000" && (finalPrice < 500 || finalPrice > 1000)) return false
      if (priceFilter === "1000-plus" && finalPrice < 1000) return false

      if (manufacturerFilter && medicine.manufacturer?.toLowerCase() !== manufacturerFilter.toLowerCase()) return false
      if (ratingFilter === "4-plus" && rating < 4) return false
      if (ratingFilter === "4.5-plus" && rating < 4.5) return false
      if (availabilityFilter === "in-stock" && !inStock) return false
      if (availabilityFilter === "out-of-stock" && inStock) return false
      if (prescriptionFilter === "required" && !medicine.requires_prescription) return false
      if (prescriptionFilter === "not-required" && medicine.requires_prescription) return false
      if (dosageFilter && medicine.form?.toLowerCase() !== dosageFilter.toLowerCase()) return false
      if (discountFilter === "yes" && discountPercentage <= 0) return false

      return true
    })
    .sort((first, second) => {
      const firstFinalPrice = Number.parseFloat(String(first.selling_price || first.mrp || 0))
      const secondFinalPrice = Number.parseFloat(String(second.selling_price || second.mrp || 0))
      const firstRating = 4.2 + ((first.id % 5) * 0.2)
      const secondRating = 4.2 + ((second.id % 5) * 0.2)

      switch (sort) {
        case "price_low":
          return firstFinalPrice - secondFinalPrice
        case "price_high":
          return secondFinalPrice - firstFinalPrice
        case "rating":
          return secondRating - firstRating
        case "name":
          return first.name.localeCompare(second.name)
        default:
          return first.name.localeCompare(second.name)
      }
    })

  if (normalizedMedicines.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-12 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">No matches found</h2>
        <p className="mt-3 text-muted-foreground">Try a broader search or clear a few filters to see more options.</p>
      </div>
    )
  }

  const medicinesPerPage = 12
  const totalPages = Math.max(1, Math.ceil(normalizedMedicines.length / medicinesPerPage))
  const safePage = Math.min(page, totalPages)
  const visibleMedicines = normalizedMedicines.slice((safePage - 1) * medicinesPerPage, safePage * medicinesPerPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{visibleMedicines.length}</span> of <span className="font-semibold text-foreground">{normalizedMedicines.length}</span> medicines
        </p>
        <div className="text-sm text-muted-foreground">Layout: {view === "list" ? "List" : "Grid"}</div>
      </div>

      <div className={view === "list" ? "space-y-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
        {visibleMedicines.map((medicine) => (
          <MedicineCard key={medicine.id} medicine={medicine} compact={view === "list"} />
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-[1.75rem] border border-border/70 bg-background/80 p-3 shadow-sm">
          <Link
            href={{ pathname: "/medicines", query: { ...params, page: Math.max(1, safePage - 1) } }}
            className="rounded-full border border-border/70 px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Previous
          </Link>
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1
            const isActive = pageNumber === safePage
            return (
              <Link
                key={pageNumber}
                href={{ pathname: "/medicines", query: { ...params, page: pageNumber } }}
                className={`rounded-full px-3 py-2 text-sm transition ${isActive ? "bg-primary text-primary-foreground" : "border border-border/70 text-muted-foreground hover:text-foreground"}`}
              >
                {pageNumber}
              </Link>
            )
          })}
          <Link
            href={{ pathname: "/medicines", query: { ...params, page: Math.min(totalPages, safePage + 1) } }}
            className="rounded-full border border-border/70 px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  )
}
