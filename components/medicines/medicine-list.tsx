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

export async function MedicineList({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const params = await searchParams
  const searchQuery = params.search || ""
  const category = params.category || ""

  let medicines: Medicine[] = []

  try {
    const q = searchQuery.trim()
    const qLike = `%${q}%`

    // Pick a single "best offer" per medicine from verified pharmacies that have stock.
    medicines = (await sql`
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
        -- prefer higher discount if available, then lower selling_price
        COALESCE(pi.discount_percentage, 0) DESC,
        pi.selling_price ASC
      LIMIT 250
    `) as Medicine[]
  } catch (error) {
    console.error("[medicine-list] Error fetching medicines:", error)
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Unable to load medicines. Please try again later.</p>
      </div>
    )
  }

  if (medicines.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No medicines found. Try adjusting your search.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {medicines.map((medicine) => (
        <MedicineCard key={medicine.id} medicine={medicine} />
      ))}
    </div>
  )
}
