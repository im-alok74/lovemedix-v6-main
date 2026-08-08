import Link from "next/link"
import { Suspense } from "react"
import { ArrowRight, FileText, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FaqSection } from "@/components/faq-section"
import { JsonLd } from "@/components/seo/json-ld"
import { ArticlesTeaser } from "@/components/home/articles-teaser"
import { Bestsellers } from "@/components/home/bestsellers"
import { CategoryRail } from "@/components/home/category-rail"
import { HealthConditionsRail, type HealthCondition } from "@/components/home/health-conditions-rail"
import { PincodeCheck } from "@/components/home/pincode-check"
import { PopularSearches } from "@/components/home/popular-searches"
import { PromoCarousel } from "@/components/home/promo-carousel"
import { QuickActions } from "@/components/home/quick-actions"
import { ReorderStrip } from "@/components/home/reorder-strip"
import { SeoLinks } from "@/components/home/seo-links"
import { TrustStrip } from "@/components/home/trust-strip"
import { MedicineCard, type MedicineCardData } from "@/components/medicines/medicine-card"
import { query } from "@/lib/db"
import { HOME_FAQS } from "@/lib/faqs"
import { buildMetadata, faqJsonld } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = buildMetadata({
  description: SITE.description,
  path: "/",
  keywords: [
    "online medicine delivery India",
    "buy prescription medicines online",
    "generic medicine substitutes",
    "order medicines online",
  ],
})

// Featured products change with inventory, so revalidate rather than force-dynamic:
// served from cache, refreshed in the background.
export const revalidate = 300

async function getFeaturedMedicines(): Promise<MedicineCardData[]> {
  try {
    return await query<MedicineCardData>`
      SELECT DISTINCT ON (m.id)
        m.id, m.name, m.slug, m.generic_name, m.manufacturer, m.category,
        m.form, m.strength, m.pack_size, m.requires_prescription, m.mrp,
        m.image_url, m.photo_url, m.status,
        pi.selling_price, pi.discount_percentage, pi.stock_quantity,
        pp.pharmacy_name,
        r.average_rating, r.review_count
      FROM pharmacy_inventory pi
      JOIN pharmacy_profiles pp
        ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
      JOIN medicines m
        ON m.id = pi.medicine_id AND m.status = 'active'
      LEFT JOIN LATERAL (
        SELECT ROUND(AVG(rating)::numeric, 1) AS average_rating, COUNT(*)::int AS review_count
        FROM medicine_reviews mr
        WHERE mr.medicine_id = m.id AND mr.status = 'published'
      ) r ON true
      WHERE pi.stock_quantity > 0
        AND (pi.expiry_date IS NULL OR pi.expiry_date > CURRENT_DATE)
      ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, pi.selling_price ASC
      LIMIT 12
    `
  } catch (error) {
    console.error("[homepage] featured medicines failed:", error)
    return []
  }
}

async function getHealthConditions(): Promise<HealthCondition[]> {
  try {
    return await query<HealthCondition>`
      SELECT id, name, slug, description, icon
      FROM health_conditions
      WHERE is_active
      ORDER BY display_order ASC
      LIMIT 16
    `
  } catch (error) {
    console.error("[homepage] health conditions failed:", error)
    return []
  }
}

function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-72" />
      ))}
    </div>
  )
}

/** Fixed-height placeholder so streaming a section in cannot shift the page. */
function RailSkeleton({ height = "h-24" }: { height?: string }) {
  return (
    <div className="page-container py-8">
      <div className={`skeleton ${height} w-full`} />
    </div>
  )
}

async function FeaturedMedicines() {
  const medicines = await getFeaturedMedicines()

  if (medicines.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-sm font-medium text-foreground">No medicines are listed yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Once a verified pharmacy adds stock, products appear here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {medicines.slice(0, 6).map((medicine) => (
        <MedicineCard key={medicine.id} medicine={medicine} />
      ))}
    </div>
  )
}

async function HealthConditions() {
  const conditions = await getHealthConditions()
  return <HealthConditionsRail conditions={conditions} />
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        {/* ---- Hero ---------------------------------------------------------- */}
        <section className="border-b border-border bg-muted/30">
          <div className="page-container py-8 sm:py-12">
            <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
              <div>
                {/* Exactly one h1 on the page. It states what the site is, which is what a
                    search snippet and an AI answer will quote. */}
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Genuine medicines, delivered from a licensed pharmacy near you
                </h1>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {SITE.name} connects you to verified pharmacies across India. Order prescription
                  and over-the-counter medicines, upload a prescription, and get it delivered in{" "}
                  {SITE.promise.deliveryWindow}.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/medicines">
                      Browse medicines
                      <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/upload-prescription">
                      <Upload className="mr-1.5 h-4 w-4" aria-hidden />
                      Upload prescription
                    </Link>
                  </Button>
                </div>

                {/* Reserve the row height so chips streaming in do not shift the hero. */}
                <div className="mt-4 min-h-7">
                  <Suspense fallback={null}>
                    <PopularSearches />
                  </Suspense>
                </div>

                <div className="mt-6 max-w-sm">
                  <PincodeCheck />
                </div>
              </div>

              {/* Prescription upload gets equal weight to search — a large share of pharmacy
                  orders start from a prescription, not a product search. */}
              <div className="surface p-6">
                <FileText className="h-6 w-6 text-primary" aria-hidden />
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  Have a prescription? Skip the search.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Upload a photo of your doctor&apos;s prescription. A licensed pharmacist reads it,
                  confirms the medicines and pricing with you, and dispatches the order.
                </p>
                <ol className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  {[
                    "Upload a clear photo or PDF of the prescription",
                    "A pharmacist verifies it, usually within 30 minutes",
                    "You approve the itemised quote and pay",
                    "The order is packed and dispatched to your address",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Button className="mt-5 w-full" asChild>
                  <Link href="/upload-prescription">Upload prescription</Link>
                </Button>
              </div>
            </div>

            <div className="mt-8">
              <PromoCarousel />
            </div>
          </div>
        </section>

        <QuickActions />

        <TrustStrip />

        {/* Signed-in customers with delivered orders only; silent otherwise. */}
        <Suspense fallback={null}>
          <ReorderStrip />
        </Suspense>

        <Suspense fallback={<RailSkeleton height="h-28" />}>
          <HealthConditions />
        </Suspense>

        <Suspense fallback={<RailSkeleton height="h-28" />}>
          <CategoryRail />
        </Suspense>

        {/* ---- Best value ---------------------------------------------------- */}
        <section aria-labelledby="featured-heading" className="py-8 sm:py-10">
          <div className="page-container">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="featured-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Best value right now
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  In stock at a verified pharmacy, at the lowest price we can find.
                </p>
              </div>
              <Link href="/medicines" className="shrink-0 text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>

            <Suspense fallback={<ProductGridSkeleton />}>
              <FeaturedMedicines />
            </Suspense>
          </div>
        </section>

        {/* Renders only once there is enough real order history to rank honestly. */}
        <Suspense fallback={null}>
          <Bestsellers />
        </Suspense>

        <Suspense fallback={<RailSkeleton height="h-40" />}>
          <ArticlesTeaser />
        </Suspense>

        {/* ---- Partner CTAs -------------------------------------------------- */}
        <section className="border-y border-border bg-muted/30 py-10">
          <div className="page-container">
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Run a pharmacy?",
                  body: "List your inventory, reach customers in your delivery radius, and manage orders from one dashboard.",
                  href: "/pharmacy/register",
                  cta: "Register your pharmacy",
                },
                {
                  title: "Are you a distributor?",
                  body: "Supply verified pharmacies at scale. Bulk-upload your catalogue and handle procurement requests in one place.",
                  href: "/distributor/register",
                  cta: "Register as distributor",
                },
              ].map((card) => (
                <div key={card.href} className="surface p-6">
                  <h2 className="text-base font-semibold text-foreground">{card.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href={card.href}>{card.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FaqSection
          faqs={HOME_FAQS}
          description={`Common questions about ordering medicines on ${SITE.name}.`}
        />

        <Suspense fallback={null}>
          <SeoLinks />
        </Suspense>

        {/* Mirrors the visible FAQ so answer engines can extract it verbatim. */}
        <JsonLd data={faqJsonld(HOME_FAQS)} id="ld-home-faq" />
      </main>

      <Footer />
    </div>
  )
}
