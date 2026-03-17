import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

// Distributor: list purchase requests for their stock
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const distributorRows = await sql`
      SELECT id FROM distributor_profiles WHERE user_id = ${user.id}
    `
    if (!distributorRows.length) {
      return NextResponse.json({ error: "Distributor profile not found" }, { status: 404 })
    }
    const distributorId = (distributorRows[0] as any).id

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const rows = await sql`
      SELECT
        pr.*,
        pp.pharmacy_name,
        COUNT(pi.id) AS item_count,
        SUM(pi.line_total)::decimal(12,2) AS items_total
      FROM purchase_requests pr
      JOIN pharmacy_profiles pp ON pr.pharmacy_id = pp.id
      LEFT JOIN purchase_items pi ON pr.id = pi.request_id
      WHERE pr.distributor_id = ${distributorId}
        AND (${status === null || status === "all"} OR pr.status = ${status})
      GROUP BY pr.id, pp.pharmacy_name
      ORDER BY pr.created_at DESC
    `

    return NextResponse.json({ requests: rows })
  } catch (error: any) {
    console.error("[DISTRIBUTOR PURCHASE REQUESTS] List error:", error)
    return NextResponse.json(
      { error: "Failed to load purchase requests", details: String(error) },
      { status: 500 }
    )
  }
}

