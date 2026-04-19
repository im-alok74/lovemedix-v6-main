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
        pi.selling_price,
        pi.discount_percentage,
        pp.pharmacy_name,
        pp.id as pharmacy_id,
        (pi.selling_price - (pi.selling_price * COALESCE(pi.discount_percentage, 0) / 100.0)) as final_price,
        COALESCE(
          json_agg(mi.image_url) FILTER (WHERE mi.image_url IS NOT NULL),
          '[]'
        ) AS images,
        COUNT(*) OVER () as total_count
      FROM pharmacy_inventory pi
      JOIN pharmacy_profiles pp
        ON pp.id = pi.pharmacy_id
       AND pp.verification_status = 'verified'
      JOIN medicines m
        ON m.id = pi.medicine_id
      LEFT JOIN medicine_images mi ON mi.medicine_id = m.id
      WHERE m.status = 'active'
        AND pi.stock_quantity > 0
        AND (pi.expiry_date IS NULL OR pi.expiry_date >= CURRENT_DATE)
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
      SELECT DISTINCT m.category
      FROM pharmacy_inventory pi
      JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
      JOIN medicines m ON m.id = pi.medicine_id
      WHERE m.status = 'active'
        AND m.category IS NOT NULL
        AND m.category <> ''
        AND pi.stock_quantity > 0
        AND (pi.expiry_date IS NULL OR pi.expiry_date >= CURRENT_DATE)
      ORDER BY m.category
    `

    return NextResponse.json({
      medicines,
      categories: (categories as any[]).map((c) => c.category),
      total: (medicines as any[]).length > 0 ? (medicines as any[])[0].total_count : 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error searching medicines:', error)
    return NextResponse.json(
      { error: 'Failed to search medicines' },
      { status: 500 }
    )
  }
}
