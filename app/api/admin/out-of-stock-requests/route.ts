import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["admin"])
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "20")

  try {
    const offset = (page - 1) * pageSize
    const searchPattern = search ? `%${search.toLowerCase()}%` : null

    const results = await sql`
      SELECT 
        osr.id,
        osr.pharmacy_id,
        osr.distributor_id,
        osr.medicine_id,
        osr.distributor_medicine_id,
        osr.requested_quantity,
        osr.mrp,
        osr.unit_price,
        osr.status,
        osr.notes,
        osr.created_at,
        osr.updated_at,
        osr.fulfilled_at,
        pp.pharmacy_name,
        pp.contact_person,
        pp.phone,
        dp.distributor_name,
        dp.contact_person as distributor_contact,
        m.medicine_name,
        m.generic_name,
        m.manufacturer
      FROM medicine_out_of_stock_requests osr
      LEFT JOIN pharmacy_profiles pp ON osr.pharmacy_id = pp.id
      LEFT JOIN distributor_profiles dp ON osr.distributor_id = dp.id
      LEFT JOIN medicines m ON osr.medicine_id = m.id
      WHERE 
        (${status && status !== 'all' ? sql`osr.status = ${status}` : sql`1=1`})
        AND (${searchPattern ? sql`(LOWER(pp.pharmacy_name) LIKE ${searchPattern} OR LOWER(m.medicine_name) LIKE ${searchPattern} OR LOWER(dp.distributor_name) LIKE ${searchPattern})` : sql`1=1`})
      ORDER BY osr.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM medicine_out_of_stock_requests osr
      LEFT JOIN pharmacy_profiles pp ON osr.pharmacy_id = pp.id
      LEFT JOIN medicines m ON osr.medicine_id = m.id
      LEFT JOIN distributor_profiles dp ON osr.distributor_id = dp.id
      WHERE 
        (${status && status !== 'all' ? sql`osr.status = ${status}` : sql`1=1`})
        AND (${searchPattern ? sql`(LOWER(pp.pharmacy_name) LIKE ${searchPattern} OR LOWER(m.medicine_name) LIKE ${searchPattern} OR LOWER(dp.distributor_name) LIKE ${searchPattern})` : sql`1=1`})
    `

    const total = countResult[0]?.total || 0

    return NextResponse.json({
      data: results,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching out-of-stock requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    )
  }
}
