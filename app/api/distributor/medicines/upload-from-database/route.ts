import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { NextResponse } from "next/server"

/**
 * GET: Fetch available medicines from the database that can be uploaded
 * Supports search, filtering by form, and pagination
 */

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("search") || ""
    const form = searchParams.get("form") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200) // Max 200
    const offset = (page - 1) * limit

    try {
      // Get total count
      let countQuery = `SELECT COUNT(*) as count FROM medicines WHERE status = 'active'`
      let countResults: any[] = []

      if (searchTerm && form) {
        countResults = await sql`
          SELECT COUNT(*) as count FROM medicines 
          WHERE status = 'active' 
          AND (name ILIKE ${"%" + searchTerm + "%"} OR generic_name ILIKE ${"%" + searchTerm + "%"})
          AND form = ${form}
        `
      } else if (searchTerm) {
        countResults = await sql`
          SELECT COUNT(*) as count FROM medicines 
          WHERE status = 'active' 
          AND (name ILIKE ${"%" + searchTerm + "%"} OR generic_name ILIKE ${"%" + searchTerm + "%"})
        `
      } else if (form) {
        countResults = await sql`
          SELECT COUNT(*) as count FROM medicines 
          WHERE status = 'active' 
          AND form = ${form}
        `
      } else {
        countResults = await sql`
          SELECT COUNT(*) as count FROM medicines WHERE status = 'active'
        `
      }

      const total = countResults.length > 0 ? (countResults[0] as any).count : 0

      // Get medicines with pagination
      let medicines: any[] = []

      if (searchTerm && form) {
        medicines = await sql`
          SELECT 
            id,
            name,
            generic_name,
            manufacturer,
            form,
            strength,
            pack_size,
            mrp,
            description,
            image_url,
            source
          FROM medicines
          WHERE status = 'active' 
          AND (name ILIKE ${"%" + searchTerm + "%"} OR generic_name ILIKE ${"%" + searchTerm + "%"})
          AND form = ${form}
          ORDER BY popularity_score DESC, name ASC 
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (searchTerm) {
        medicines = await sql`
          SELECT 
            id,
            name,
            generic_name,
            manufacturer,
            form,
            strength,
            pack_size,
            mrp,
            description,
            image_url,
            source
          FROM medicines
          WHERE status = 'active' 
          AND (name ILIKE ${"%" + searchTerm + "%"} OR generic_name ILIKE ${"%" + searchTerm + "%"})
          ORDER BY popularity_score DESC, name ASC 
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (form) {
        medicines = await sql`
          SELECT 
            id,
            name,
            generic_name,
            manufacturer,
            form,
            strength,
            pack_size,
            mrp,
            description,
            image_url,
            source
          FROM medicines
          WHERE status = 'active' 
          AND form = ${form}
          ORDER BY popularity_score DESC, name ASC 
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        medicines = await sql`
          SELECT 
            id,
            name,
            generic_name,
            manufacturer,
            form,
            strength,
            pack_size,
            mrp,
            description,
            image_url,
            source
          FROM medicines
          WHERE status = 'active'
          ORDER BY popularity_score DESC, name ASC 
          LIMIT ${limit} OFFSET ${offset}
        `
      }

      return NextResponse.json({
        medicines: medicines || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (queryError: any) {
      console.error("[Distributor] Query error:", queryError)
      return NextResponse.json(
        { error: "Failed to fetch medicines: " + queryError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[Distributor] Browse medicines error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST: Bulk upload medicines from the database to distributor inventory
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      medicineIds = [],
      selectAll = false,
      search = "",
      form = "",
    } = body

    if (!selectAll && (!Array.isArray(medicineIds) || medicineIds.length === 0)) {
      return NextResponse.json(
        { error: "medicineIds must be a non-empty array" },
        { status: 400 }
      )
    }

    if (!selectAll && medicineIds.length > 500) {
      return NextResponse.json(
        { error: "Cannot upload more than 500 medicines at once" },
        { status: 400 }
      )
    }

    try {
      // Get distributor profile
      const distributorProfile = await sql`
        SELECT id, verification_status FROM distributor_profiles WHERE user_id = ${user.id}
      `

      if (distributorProfile.length === 0) {
        return NextResponse.json(
          { error: "Distributor profile not found" },
          { status: 404 }
        )
      }

      if ((distributorProfile[0] as any).verification_status !== "verified") {
        return NextResponse.json(
          { error: "Distributor not verified yet" },
          { status: 403 }
        )
      }

      const distributorId = (distributorProfile[0] as any).id

      let medicines: any[] = []

      if (selectAll) {
        if (search && form) {
          medicines = await sql`
            SELECT id, name, mrp FROM medicines
            WHERE status = 'active'
            AND (name ILIKE ${"%" + search + "%"} OR generic_name ILIKE ${"%" + search + "%"})
            AND form = ${form}
            ORDER BY popularity_score DESC, name ASC
          `
        } else if (search) {
          medicines = await sql`
            SELECT id, name, mrp FROM medicines
            WHERE status = 'active'
            AND (name ILIKE ${"%" + search + "%"} OR generic_name ILIKE ${"%" + search + "%"})
            ORDER BY popularity_score DESC, name ASC
          `
        } else if (form) {
          medicines = await sql`
            SELECT id, name, mrp FROM medicines
            WHERE status = 'active'
            AND form = ${form}
            ORDER BY popularity_score DESC, name ASC
          `
        } else {
          medicines = await sql`
            SELECT id, name, mrp FROM medicines
            WHERE status = 'active'
            ORDER BY popularity_score DESC, name ASC
          `
        }
      } else {
        medicines = await sql`
          SELECT id, name, mrp FROM medicines 
          WHERE id = ANY(${medicineIds}::int[]) AND status = 'active'
        `
      }

      if (!medicines || medicines.length === 0) {
        return NextResponse.json(
          { error: "No valid medicines found" },
          { status: 400 }
        )
      }

      // Add medicines to distributor inventory
      const results: any[] = []
      let successCount = 0
      let failureCount = 0

      for (const medicine of medicines) {
        try {
          // Check if this medicine already exists in distributor's inventory
          const existing = await sql`
            SELECT id FROM distributor_medicines 
            WHERE distributor_id = ${distributorId} 
            AND medicine_id = ${(medicine as any).id}
            LIMIT 1
          `

          if (existing && existing.length > 0) {
            results.push({
              medicineId: (medicine as any).id,
              name: (medicine as any).name,
              status: "already_exists",
              message: "This medicine is already in your inventory",
            })
            continue
          }

          // Create a default inventory entry for this medicine
          const insertResult = await sql`
            INSERT INTO distributor_medicines (
              distributor_id,
              medicine_id,
              expiry_date,
              mrp,
              quantity,
              unit_price,
              created_at,
              updated_at
            ) VALUES (
              ${distributorId},
              ${(medicine as any).id},
              ${"2025-12-31"},
              ${(medicine as any).mrp},
              ${0},
              ${parseFloat(((medicine as any).mrp * 0.5).toFixed(2))},
              NOW(),
              NOW()
            )
            RETURNING id
          `

          results.push({
            medicineId: (medicine as any).id,
            name: (medicine as any).name,
            status: "success",
            message: "Medicine added to your inventory",
            id: insertResult && insertResult.length > 0 ? (insertResult[0] as any).id : null,
          })
          successCount++
        } catch (error: any) {
          failureCount++
          console.error(`Failed to insert medicine ${(medicine as any).id}:`, error.message)
          results.push({
            medicineId: (medicine as any).id,
            name: (medicine as any).name,
            status: "error",
            message: error.message || "Unknown error",
          })
        }
      }

      // Record the bulk upload for audit trail
      if (successCount > 0) {
        try {
          await sql`
            INSERT INTO medicine_bulk_uploads (
              distributor_id,
              medicine_ids,
              upload_count,
              status
            ) VALUES (
              ${distributorId},
              ${JSON.stringify(selectAll ? medicines.map((medicine: any) => medicine.id) : medicineIds)},
              ${successCount},
              'completed'
            )
          `
        } catch (error) {
          // Don't fail if audit logging fails (table might not exist)
          console.error("[Distributor] Error recording bulk upload:", error)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully added ${successCount} medicines to your inventory`,
        successCount,
        failureCount,
        totalRequested: selectAll ? medicines.length : medicineIds.length,
        results,
      })
    } catch (dbError: any) {
      console.error("[Distributor] Database error:", dbError)
      return NextResponse.json(
        { error: "Database error: " + dbError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[Distributor] Upload medicines error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
