import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null
    const requiresPrescription = searchParams.get('prescription')
    const sortBy = searchParams.get('sortBy') || 'popularity'
    const limit = Number(searchParams.get('limit')) || 50
    const offset = Number(searchParams.get('offset')) || 0

    const q = query.trim()
    const qLike = `%${q.toLowerCase()}%`
    const prescriptionFilter =
      requiresPrescription === 'true' ? true : requiresPrescription === 'false' ? false : null

    const medicines = await sql`
      SELECT
        m.id,
        m.name,
        m.generic_name,
        m.manufacturer,
        m.category,
        m.strength,
        m.form,
        m.pack_size,
        m.mrp,
        m.image_url,
        m.requires_prescription,
        m.mrp as selling_price,
        0 as discount_percentage,
        NULL as pharmacy_name,
        NULL as pharmacy_id,
        m.mrp as final_price,
        COALESCE(
          json_agg(mi.image_url) FILTER (WHERE mi.image_url IS NOT NULL),
          '[]'
        ) AS images,
        COUNT(*) OVER () as total_count
      FROM medicines m
      LEFT JOIN medicine_images mi ON mi.medicine_id = m.id
      WHERE m.status = 'active'
        AND (${q === ''} OR (
          LOWER(m.name) LIKE ${qLike}
          OR LOWER(m.generic_name) LIKE ${qLike}
          OR LOWER(m.manufacturer) LIKE ${qLike}
        ))
        AND (${category === ''} OR m.category = ${category})
        AND (${minPrice === null} OR m.mrp >= ${minPrice})
        AND (${maxPrice === null} OR m.mrp <= ${maxPrice})
        AND (${prescriptionFilter === null} OR m.requires_prescription = ${prescriptionFilter})
      GROUP BY m.id
      ORDER BY
        CASE WHEN ${sortBy} = 'price_high' THEN m.mrp END DESC,
        CASE WHEN ${sortBy} = 'price_low' THEN m.mrp END ASC,
        CASE WHEN ${sortBy} = 'name' THEN m.name END ASC,
        m.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get unique categories for filter
    const categories = await sql`
      SELECT DISTINCT category FROM medicines WHERE status = 'active' ORDER BY category
    `

    return NextResponse.json({
      medicines,
      categories: (categories as any[]).map((c) => c.category),
      total: (medicines as any[]).length > 0 ? (medicines as any[])[0].total_count : 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('[v0] Error searching medicines:', error)
    return NextResponse.json(
      { error: 'Failed to search medicines' },
      { status: 500 }
    )
  }
}
