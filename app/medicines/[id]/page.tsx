import { notFound } from 'next/navigation'

import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { MedicinePdp } from '@/components/medicines/medicine-pdp'
import { sql } from '@/lib/db'

type PageParams = {
  params: Promise<{ id: string }>
}

async function fetchMedicine(medicineId: number) {
  const rows = await sql`
    SELECT DISTINCT ON (m.id)
      m.id,
      m.name,
      m.generic_name,
      m.manufacturer,
      m.category,
      m.form,
      m.strength,
      m.pack_size,
      m.description,
      m.requires_prescription,
      m.mrp,
      m.image_url,
      m.photo_url,
      m.status,
      m.hsn_code,
      m.mfg_date,
      COALESCE(pi.selling_price::text, m.mrp::text) AS selling_price,
      COALESCE(pi.discount_percentage::text, '0') AS discount_percentage,
      COALESCE(pi.stock_quantity, 0) AS stock_quantity,
      pi.pharmacy_id,
      pp.pharmacy_name
    FROM medicines m
    LEFT JOIN pharmacy_inventory pi
      ON pi.medicine_id = m.id
     AND pi.stock_quantity > 0
    LEFT JOIN pharmacy_profiles pp
      ON pp.id = pi.pharmacy_id
     AND pp.verification_status = 'verified'
    WHERE m.id = ${medicineId}
      AND m.status = 'active'
    ORDER BY
      m.id,
      CASE WHEN pp.id IS NULL THEN 1 ELSE 0 END ASC,
      COALESCE(pi.discount_percentage, 0) DESC,
      COALESCE(pi.selling_price, m.mrp) ASC
    LIMIT 1
  `

  return rows[0] || null
}

async function fetchRelatedProducts(medicine: any) {
  const category = medicine.category
  const manufacturer = medicine.manufacturer
  const form = medicine.form

  const similarProducts = category
    ? await sql`
        SELECT DISTINCT ON (m.id)
          m.id,
          m.name,
          m.generic_name,
          m.manufacturer,
          m.category,
          m.form,
          m.strength,
          m.pack_size,
          m.description,
          m.requires_prescription,
          m.mrp,
          m.image_url,
          m.photo_url,
          m.status,
          m.hsn_code,
          m.mfg_date,
          COALESCE(pi.selling_price::text, m.mrp::text) AS selling_price,
          COALESCE(pi.discount_percentage::text, '0') AS discount_percentage,
          COALESCE(pi.stock_quantity, 0) AS stock_quantity,
          pi.pharmacy_id,
          pp.pharmacy_name
        FROM medicines m
        LEFT JOIN pharmacy_inventory pi ON pi.medicine_id = m.id AND pi.stock_quantity > 0
        LEFT JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
        WHERE m.status = 'active'
          AND m.id <> ${medicine.id}
          AND m.category = ${category}
        ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, COALESCE(pi.selling_price, m.mrp) ASC
        LIMIT 6
      `
    : []

  const customersAlsoBought =
    manufacturer && form
      ? await sql`
          SELECT DISTINCT ON (m.id)
            m.id,
            m.name,
            m.generic_name,
            m.manufacturer,
            m.category,
            m.form,
            m.strength,
            m.pack_size,
            m.description,
            m.requires_prescription,
            m.mrp,
            m.image_url,
            m.photo_url,
            m.status,
            m.hsn_code,
            m.mfg_date,
            COALESCE(pi.selling_price::text, m.mrp::text) AS selling_price,
            COALESCE(pi.discount_percentage::text, '0') AS discount_percentage,
            COALESCE(pi.stock_quantity, 0) AS stock_quantity,
            pi.pharmacy_id,
            pp.pharmacy_name
          FROM medicines m
          LEFT JOIN pharmacy_inventory pi ON pi.medicine_id = m.id AND pi.stock_quantity > 0
          LEFT JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
          WHERE m.status = 'active'
            AND m.id <> ${medicine.id}
            AND (m.manufacturer = ${manufacturer} OR m.form = ${form})
          ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, COALESCE(pi.selling_price, m.mrp) ASC
          LIMIT 6
        `
      : manufacturer
        ? await sql`
            SELECT DISTINCT ON (m.id)
              m.id,
              m.name,
              m.generic_name,
              m.manufacturer,
              m.category,
              m.form,
              m.strength,
              m.pack_size,
              m.description,
              m.requires_prescription,
              m.mrp,
              m.image_url,
              m.photo_url,
              m.status,
              m.hsn_code,
              m.mfg_date,
              COALESCE(pi.selling_price::text, m.mrp::text) AS selling_price,
              COALESCE(pi.discount_percentage::text, '0') AS discount_percentage,
              COALESCE(pi.stock_quantity, 0) AS stock_quantity,
              pi.pharmacy_id,
              pp.pharmacy_name
            FROM medicines m
            LEFT JOIN pharmacy_inventory pi ON pi.medicine_id = m.id AND pi.stock_quantity > 0
            LEFT JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
            WHERE m.status = 'active'
              AND m.id <> ${medicine.id}
              AND m.manufacturer = ${manufacturer}
            ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, COALESCE(pi.selling_price, m.mrp) ASC
            LIMIT 6
          `
        : form
          ? await sql`
              SELECT DISTINCT ON (m.id)
                m.id,
                m.name,
                m.generic_name,
                m.manufacturer,
                m.category,
                m.form,
                m.strength,
                m.pack_size,
                m.description,
                m.requires_prescription,
                m.mrp,
                m.image_url,
                m.photo_url,
                m.status,
                m.hsn_code,
                m.mfg_date,
                COALESCE(pi.selling_price::text, m.mrp::text) AS selling_price,
                COALESCE(pi.discount_percentage::text, '0') AS discount_percentage,
                COALESCE(pi.stock_quantity, 0) AS stock_quantity,
                pi.pharmacy_id,
                pp.pharmacy_name
              FROM medicines m
              LEFT JOIN pharmacy_inventory pi ON pi.medicine_id = m.id AND pi.stock_quantity > 0
              LEFT JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
              WHERE m.status = 'active'
                AND m.id <> ${medicine.id}
                AND m.form = ${form}
              ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, COALESCE(pi.selling_price, m.mrp) ASC
              LIMIT 6
            `
          : []

  const recommendations = await sql`
    SELECT DISTINCT ON (m.id)
      m.id,
      m.name,
      m.generic_name,
      m.manufacturer,
      m.category,
      m.form,
      m.strength,
      m.pack_size,
      m.description,
      m.requires_prescription,
      m.mrp,
      m.image_url,
      m.photo_url,
      m.status,
      m.hsn_code,
      m.mfg_date,
      COALESCE(pi.selling_price::text, m.mrp::text) AS selling_price,
      COALESCE(pi.discount_percentage::text, '0') AS discount_percentage,
      COALESCE(pi.stock_quantity, 0) AS stock_quantity,
      pi.pharmacy_id,
      pp.pharmacy_name
    FROM medicines m
    LEFT JOIN pharmacy_inventory pi ON pi.medicine_id = m.id AND pi.stock_quantity > 0
    LEFT JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
    WHERE m.status = 'active'
      AND m.id <> ${medicine.id}
    ORDER BY
      m.id,
      COALESCE(pi.discount_percentage, 0) DESC,
      COALESCE(pi.stock_quantity, 0) DESC,
      COALESCE(pi.selling_price, m.mrp) ASC
    LIMIT 6
  `

  return {
    similarProducts,
    customersAlsoBought,
    recommendations,
  }
}

async function fetchReviews(medicineId: number) {
  const reviews = await sql`
    SELECT
      mr.id,
      mr.rating,
      mr.title,
      mr.review_text,
      mr.is_verified_purchase,
      mr.created_at,
      u.full_name,
      u.user_type
    FROM medicine_reviews mr
    JOIN users u ON u.id = mr.user_id
    WHERE mr.medicine_id = ${medicineId}
    ORDER BY mr.created_at DESC
    LIMIT 50
  `

  const stats = await sql`
    SELECT
      COUNT(*)::int AS total_reviews,
      COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average_rating,
      COUNT(*) FILTER (WHERE rating = 5)::int AS five_star,
      COUNT(*) FILTER (WHERE rating = 4)::int AS four_star,
      COUNT(*) FILTER (WHERE rating = 3)::int AS three_star,
      COUNT(*) FILTER (WHERE rating = 2)::int AS two_star,
      COUNT(*) FILTER (WHERE rating = 1)::int AS one_star
    FROM medicine_reviews
    WHERE medicine_id = ${medicineId}
  `

  return {
    reviews,
    reviewStats: stats[0] || {
      total_reviews: 0,
      average_rating: 0,
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0,
    },
  }
}

export default async function MedicineDetailPage({ params }: PageParams) {
  const resolvedParams = await params
  const medicineId = Number(resolvedParams.id)

  if (Number.isNaN(medicineId)) {
    notFound()
  }

  const medicine = await fetchMedicine(medicineId)

  if (!medicine) {
    notFound()
  }

  const relatedProducts = await fetchRelatedProducts(medicine)
  const { reviews, reviewStats } = await fetchReviews(medicineId)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <MedicinePdp
          medicine={medicine}
          reviews={reviews}
          reviewStats={reviewStats}
          similarProducts={relatedProducts.similarProducts}
          customersAlsoBought={relatedProducts.customersAlsoBought}
          recommendations={relatedProducts.recommendations}
        />
      </div>
      <Footer />
    </div>
  )
}
