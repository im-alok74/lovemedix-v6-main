import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchBar } from "@/components/search-bar"
import { HeroSlider } from "@/components/home/hero-slider"
import { SectionShell } from "@/components/home/section-shell"
import { Clock, Shield, Truck, Pill, Sparkles, ArrowRight } from "lucide-react"
import { sql } from "@/lib/db"
import { MedicineCard } from "@/components/medicines/medicine-card"

// Force dynamic rendering to check settings on every request
export const revalidate = 0
export const dynamic = 'force-dynamic'

interface Medicine {
  id: number
  name: string
  generic_name: string | null
  manufacturer: string | null
  category: string | null
  form: string | null
  strength: string | null
  pack_size: string | null
  description: string | null
  requires_prescription: boolean
  mrp: string
  image_url: string | null
  selling_price: string | null
  discount_percentage: string | null
  pharmacy_name: string | null
  status: string
}

async function getFeaturedMedicines() {
  try {
    const medicines = (await sql`
      WITH featured_medicines AS (
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
          m.status,
          pi.selling_price,
          pi.discount_percentage,
          pp.pharmacy_name
        FROM pharmacy_inventory pi
        JOIN pharmacy_profiles pp
          ON pp.id = pi.pharmacy_id
         AND pp.verification_status = 'verified'
        JOIN medicines m
          ON m.id = pi.medicine_id
        WHERE m.status = 'active'
          AND pi.stock_quantity > 0
          AND (pi.expiry_date IS NULL OR pi.expiry_date >= CURRENT_DATE)
        ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, pi.selling_price ASC
      )
      SELECT *
      FROM featured_medicines
      ORDER BY CASE WHEN image_url IS NOT NULL AND image_url <> '' THEN 1 ELSE 0 END DESC,
        LOWER(name) ASC
      LIMIT 8
    `) as Medicine[]
    return medicines
  } catch (error) {
    console.error("[homepage] Error fetching featured medicines:", error)
    return []
  }
}

async function getAllMedicines() {
  try {
    const medicines = (await sql`
      SELECT 
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
        m.status,
        NULL as selling_price,
        NULL as discount_percentage,
        NULL as pharmacy_name
      FROM medicines m
      WHERE m.status = 'active'
      ORDER BY CASE WHEN m.image_url IS NOT NULL AND m.image_url <> '' THEN 1 ELSE 0 END DESC,
        LOWER(m.name) ASC
      LIMIT 50
    `) as Medicine[]
    return medicines
  } catch (error) {
    console.error("[homepage] Error fetching all medicines:", error)
    return []
  }
}

async function getShowAllMedicinesSetting() {
  try {
    const result = await sql`
      SELECT setting_value FROM platform_settings 
      WHERE setting_key = 'show_all_medicines_on_homepage'
      LIMIT 1
    `
    const shouldShowAll = result.length > 0 ? result[0].setting_value === 'true' : false
    console.log("[homepage] Show all medicines setting:", shouldShowAll, "Raw value:", result[0]?.setting_value)
    return shouldShowAll
  } catch (error) {
    console.error("[homepage] Error fetching settings:", error)
    return false
  }
}

function MedicinesSectionFallback() {
  return (
    <section className="bg-linear-to-b from-muted/30 to-background py-20 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 h-10 w-64 animate-pulse rounded bg-muted" />
          <div className="mx-auto h-5 w-96 max-w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      </div>
    </section>
  )
}

async function MedicinesShowcase() {
  const showAllMedicines = await getShowAllMedicinesSetting()
  console.log("[homepage] showAllMedicines flag:", showAllMedicines)

  const medicines = showAllMedicines
    ? await getAllMedicines()
    : await getFeaturedMedicines()

  console.log(`[homepage] Loaded ${medicines.length} medicines (mode: ${showAllMedicines ? 'ALL' : 'FEATURED'})`)

  if (medicines.length === 0) {
    return null
  }

  return (
    <section className="bg-linear-to-b from-muted/30 to-background py-20 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
            {showAllMedicines ? "All Medicines" : "Featured Medicines"}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground lg:text-lg">
            {showAllMedicines
              ? "Browse all available medicines in our database"
              : "Popular and trusted medicines available for immediate delivery"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {medicines.map((medicine) => (
            <MedicineCard key={medicine.id} medicine={medicine} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button size="lg" className="gradient-primary h-12 px-8 text-base shadow-lg shadow-primary/20" asChild>
            <Link href="/medicines">
              Browse More Medicines
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] py-10 sm:py-14 lg:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
          <div className="container relative mx-auto px-4">
            <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_20px_70px_-28px_rgba(15,23,42,0.28)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Trusted by 10,000+ customers</p>
                  <p className="text-sm text-muted-foreground">Fresh healthcare support, designed for speed and trust.</p>
                </div>
              </div>
              <div className="max-w-xl flex-1 sm:ml-4">
                <SearchBar compact showButton={false} className="w-full" />
              </div>
            </div>
            <HeroSlider />
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <SectionShell
              title="Why Choose Davaa.in?"
              description="Experience healthcare delivery that's fast, reliable, and designed around your needs."
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              <Card className="group border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center lg:p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground lg:text-2xl">Fast Delivery</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Get your medicines delivered within 30 minutes in your area
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center lg:p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground lg:text-2xl">100% Genuine</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    All medicines sourced from verified and licensed pharmacies
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center lg:p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground lg:text-2xl">Free Delivery</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Free delivery on orders above ₹500, nominal charges below
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center lg:p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
                    <Pill className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground lg:text-2xl">Wide Range</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Access to thousands of medicines and healthcare products
                  </p>
                </CardContent>
              </Card>
              </div>
            </SectionShell>
          </div>
        </section>

        <Suspense fallback={<MedicinesSectionFallback />}>
          <MedicinesShowcase />
        </Suspense>

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl rounded-3xl border border-border/50 bg-linear-to-br from-card to-card/50 p-8 text-center shadow-xl lg:p-12">
              <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                Are You a Pharmacy or Distributor?
              </h2>
              <p className="mb-10 text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
                Partner with LoveMedix to expand your reach and serve more customers. Join our growing network of
                healthcare providers.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent" asChild>
                  <Link href="/pharmacy/register">Register as Pharmacy</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent" asChild>
                  <Link href="/distributor/register">Register as Distributor</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
