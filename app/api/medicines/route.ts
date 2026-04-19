import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Return one best active offer per medicine from verified pharmacies.
    const medicines = await sql`
      SELECT DISTINCT ON (m.id)
        m.id,
        m.name,
        m.generic_name,
        m.strength,
        m.form,
        m.manufacturer,
        m.description,
        m.mrp,
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
      ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, pi.selling_price ASC
    `

    return NextResponse.json({ medicines })
  } catch (error: any) {
    console.error("Medicines error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
