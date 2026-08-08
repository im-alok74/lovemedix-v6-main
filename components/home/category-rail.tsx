import Link from "next/link"
import {
  Activity, Baby, Dog, Droplet, Leaf, Heart, Sparkles, Stethoscope, type LucideIcon,
} from "lucide-react"

import { query } from "@/lib/db"

/**
 * Shop-by-category rail.
 *
 * Distinct from the health-concern rail: concerns are what you are treating ("diabetes
 * care"), categories are what kind of product it is ("devices & monitors"). Both
 * competitors run both, because customers arrive with either mental model.
 *
 * Only categories that actually have active medicines are rendered — a tile leading to an
 * empty result page is worse than no tile.
 */

const CATEGORIES: Array<{ label: string; match: string; icon: LucideIcon }> = [
  { label: "Vitamins & Supplements", match: "vitamin", icon: Sparkles },
  { label: "Diabetes Care", match: "diabet", icon: Droplet },
  { label: "Devices & Monitors", match: "device", icon: Activity },
  { label: "Baby Care", match: "baby", icon: Baby },
  { label: "Personal Care", match: "personal", icon: Heart },
  { label: "Ayurveda", match: "ayurved", icon: Leaf },
  { label: "Pain Relief", match: "pain", icon: Stethoscope },
  { label: "Pet Care", match: "pet", icon: Dog },
]

export async function CategoryRail() {
  let available: string[] = []

  try {
    const rows = await query<{ category: string }>`
      SELECT DISTINCT category
      FROM medicines
      WHERE status = 'active' AND category IS NOT NULL AND category <> ''
    `
    available = rows.map((r) => r.category)
  } catch (error) {
    console.error("[category-rail] load failed:", error)
    return null
  }

  // Map each display tile to the first real category whose name contains its keyword, so
  // the link lands on results rather than an empty filter.
  const tiles = CATEGORIES.map((tile) => {
    const real = available.find((c) => c.toLowerCase().includes(tile.match))
    return real ? { ...tile, category: real } : null
  }).filter((t): t is NonNullable<typeof t> => t !== null)

  if (tiles.length === 0) return null

  return (
    <section aria-labelledby="shop-by-category" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="shop-by-category" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Shop by category
          </h2>
          <Link href="/medicines" className="shrink-0 text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {/* Horizontal rail on mobile, grid on desktop. */}
        <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
          {tiles.map((tile) => (
            <li key={tile.label} className="w-28 shrink-0 sm:w-auto">
              <Link
                href={`/medicines?category=${encodeURIComponent(tile.category)}`}
                className="surface surface-hover flex h-full flex-col items-center gap-2 p-3 text-center"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <tile.icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <span className="text-xs font-medium leading-tight text-foreground">{tile.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
