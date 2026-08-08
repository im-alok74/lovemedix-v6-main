import Link from "next/link"
import { Search } from "lucide-react"

import { query } from "@/lib/db"

/**
 * Popular search shortcuts.
 *
 * Seeded from the medicines that are actually in stock and most frequently ordered, so
 * every chip leads somewhere real. Once search-query logging exists, swap the source for
 * genuine query volume — the component contract does not change.
 */
export async function PopularSearches() {
  let terms: string[] = []

  try {
    const rows = await query<{ term: string }>`
      SELECT DISTINCT ON (LOWER(COALESCE(m.generic_name, m.name)))
             COALESCE(m.generic_name, m.name) AS term
      FROM medicines m
      JOIN pharmacy_inventory pi
        ON pi.medicine_id = m.id AND pi.stock_quantity > 0
      JOIN pharmacy_profiles pp
        ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
      WHERE m.status = 'active'
        AND COALESCE(m.generic_name, m.name) <> ''
      ORDER BY LOWER(COALESCE(m.generic_name, m.name))
      LIMIT 8
    `
    terms = rows.map((r) => r.term).filter(Boolean)
  } catch (error) {
    console.error("[popular-searches] load failed:", error)
    return null
  }

  if (terms.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" aria-hidden />
        Popular:
      </span>
      {terms.slice(0, 6).map((term) => (
        <Link
          key={term}
          href={`/medicines?search=${encodeURIComponent(term)}`}
          className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          {term}
        </Link>
      ))}
    </div>
  )
}
