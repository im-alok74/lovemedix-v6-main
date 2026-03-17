import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(_request: NextRequest) {
  try {
    const rows = await sql`
      SELECT DISTINCT category
      FROM medicines
      WHERE category IS NOT NULL AND category <> ''
      ORDER BY category
    `

    const categories = (rows as any[]).map((r) => r.category)
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("[MEDICINE CATEGORIES] Error:", error)
    return NextResponse.json(
      { error: "Failed to load categories", details: String(error) },
      { status: 500 }
    )
  }
}

