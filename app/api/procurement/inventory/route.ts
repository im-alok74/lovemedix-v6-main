import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

// Pharmacy marketplace view of distributor stock - includes both in-stock and out-of-stock items
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.user_type !== "pharmacy") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = (searchParams.get("q") || "").trim()
    const category = searchParams.get("category") || ""
    const distributorId = searchParams.get("distributorId")
    const includeOutOfStock = searchParams.get("includeOutOfStock") === "true"

    const qLike = `%${query.toLowerCase()}%`

    // Get in-stock items (available for purchase)
    const inStockResults = await sql`
      SELECT
        dm.id,
        dm.distributor_id,
        dp.company_name AS distributor_name,
        dm.medicine_id,
        m.name,
        m.generic_name,
        m.manufacturer,
        m.category,
        m.form,
        m.strength,
        m.pack_size,
        m.image_url,
        dm.batch_number,
        dm.expiry_date,
        dm.mrp,
        dm.unit_price,
        dm.quantity,
        dm.reserved_quantity,
        (dm.quantity - dm.reserved_quantity) AS available_quantity,
        'in_stock' as stock_status
      FROM distributor_medicines dm
      JOIN distributor_profiles dp ON dm.distributor_id = dp.id
      JOIN medicines m ON dm.medicine_id = m.id
      WHERE (dm.quantity - dm.reserved_quantity) > 0
        AND dm.expiry_date > NOW()
        AND (${query === ""} OR (
          LOWER(m.name) LIKE ${qLike}
          OR LOWER(m.generic_name) LIKE ${qLike}
          OR LOWER(m.manufacturer) LIKE ${qLike}
        ))
        AND (${category === ""} OR m.category = ${category})
        AND (${distributorId === null} OR dm.distributor_id = ${distributorId})
      ORDER BY m.name ASC, dm.unit_price ASC
    `

    let results: any[] = inStockResults

    // If requested, also get out-of-stock items (available for pre-order/request)
    if (includeOutOfStock) {
      const outOfStockResults = await sql`
        SELECT DISTINCT
          dm.id,
          dm.distributor_id,
          dp.company_name AS distributor_name,
          dm.medicine_id,
          m.name,
          m.generic_name,
          m.manufacturer,
          m.category,
          m.form,
          m.strength,
          m.pack_size,
          m.image_url,
          dm.batch_number,
          dm.expiry_date,
          dm.mrp,
          dm.unit_price,
          dm.quantity,
          dm.reserved_quantity,
          (dm.quantity - dm.reserved_quantity) AS available_quantity,
          'out_of_stock' as stock_status
        FROM distributor_medicines dm
        JOIN distributor_profiles dp ON dm.distributor_id = dp.id
        JOIN medicines m ON dm.medicine_id = m.id
        WHERE (dm.quantity - dm.reserved_quantity) <= 0
          AND (${query === ""} OR (
            LOWER(m.name) LIKE ${qLike}
            OR LOWER(m.generic_name) LIKE ${qLike}
            OR LOWER(m.manufacturer) LIKE ${qLike}
          ))
          AND (${category === ""} OR m.category = ${category})
          AND (${distributorId === null} OR dm.distributor_id = ${distributorId})
        ORDER BY m.name ASC, dm.unit_price ASC
      `
      results = [...inStockResults, ...outOfStockResults]
    }

    // For each medicine, fetch all associated images
    const itemsWithImages = await Promise.all(
      (results as any[]).map(async (item) => {
        const images = await sql`
          SELECT image_url FROM medicine_images 
          WHERE medicine_id = ${item.medicine_id}
          ORDER BY created_at ASC
        `
        return {
          ...item,
          images: (images as any[]).map(img => img.image_url),
        }
      })
    )

    return NextResponse.json({ items: itemsWithImages })
  } catch (error: any) {
    console.error("[PROCUREMENT INVENTORY] Error:", error)
    return NextResponse.json(
      { error: "Failed to load procurement inventory", details: String(error) },
      { status: 500 }
    )
  }
}

