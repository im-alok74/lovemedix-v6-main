import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(_request: NextRequest) {
  try {
    const rows = await sql`
      SELECT DISTINCT form
      FROM medicines
      WHERE form IS NOT NULL AND form <> ''
      ORDER BY form
    `

    const forms = (rows as any[]).map((r) => r.form)
    return NextResponse.json({ forms })
  } catch (error: any) {
    console.error("[MEDICINE FORMS] Error:", error)
    return NextResponse.json(
      { error: "Failed to load forms", details: String(error) },
      { status: 500 }
    )
  }
}

