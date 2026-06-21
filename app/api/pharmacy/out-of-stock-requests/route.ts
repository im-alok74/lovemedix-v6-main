import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== "pharmacy") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get pharmacy profile
    const pharmacyResult = await sql`
      SELECT id FROM pharmacy_profiles WHERE user_id = ${user.id}
    `

    if (pharmacyResult.length === 0) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 })
    }

    const pharmacyId = pharmacyResult[0].id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")

    let whereCondition = `WHERE osr.pharmacy_id = ${pharmacyId}`
    if (status && status !== "all") {
      whereCondition += ` AND osr.status = '${status}'`
    }

    const offset = (page - 1) * pageSize

    const results = await sql`
      SELECT 
        osr.id,
        osr.distributor_id,
        osr.medicine_id,
        osr.requested_quantity,
        osr.mrp,
        osr.unit_price,
        osr.status,
        osr.notes,
        osr.created_at,
        osr.fulfilled_at,
        dp.distributor_name,
        m.medicine_name,
        m.generic_name
      FROM medicine_out_of_stock_requests osr
      LEFT JOIN distributor_profiles dp ON osr.distributor_id = dp.id
      LEFT JOIN medicines m ON osr.medicine_id = m.id
      ${sql.raw(whereCondition)}
      ORDER BY osr.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM medicine_out_of_stock_requests 
      ${sql.raw(whereCondition)}
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
    console.error("Error fetching pharmacy out-of-stock requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== "pharmacy") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      distributor_id,
      medicine_id,
      distributor_medicine_id,
      requested_quantity,
      mrp,
      unit_price,
      notes,
    } = body

    // Validate input
    if (
      !distributor_id ||
      !medicine_id ||
      !distributor_medicine_id ||
      !requested_quantity
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get pharmacy profile
    const pharmacyResult = await sql`
      SELECT id FROM pharmacy_profiles WHERE user_id = ${user.id}
    `

    if (pharmacyResult.length === 0) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 })
    }

    const pharmacyId = pharmacyResult[0].id

    // Check if pharmacy already has a pending/assigned request for this medicine
    const existingResult = await sql`
      SELECT id FROM medicine_out_of_stock_requests
      WHERE pharmacy_id = ${pharmacyId} AND medicine_id = ${medicine_id} AND status IN ('pending', 'assigned')
    `

    if (existingResult.length > 0) {
      return NextResponse.json(
        { error: "You already have an active request for this medicine" },
        { status: 400 }
      )
    }

    // Create out-of-stock request
    const result = await sql`
      INSERT INTO medicine_out_of_stock_requests (
        pharmacy_id, distributor_id, medicine_id, distributor_medicine_id,
        requested_quantity, mrp, unit_price, status, notes, created_at, updated_at
      ) VALUES (${pharmacyId}, ${distributor_id}, ${medicine_id}, ${distributor_medicine_id},
        ${requested_quantity}, ${mrp || null}, ${unit_price || null}, 'pending', ${notes || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `

    // Log audit trail
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (${user.id}, 'create_out_of_stock_request', 'medicine_out_of_stock_requests', ${result[0].id},
        ${JSON.stringify({
          medicine_id,
          distributor_id,
          quantity: requested_quantity,
        })}, CURRENT_TIMESTAMP)
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating out-of-stock request:", error)
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    )
  }
}
