import Link from "next/link"

import { query } from "@/lib/db"

/**
 * Crawlable internal-link block.
 *
 * Both 1mg and Apollo run one of these, and it is a large part of why they rank for
 * long-tail queries: it gives crawlers a dense, real path from the homepage into deep
 * catalogue pages that are otherwise reachable only through search.
 *
 * Every link points at a page that exists and returns results — this is internal linking,
 * not a keyword farm. Nothing here is hidden from users either; hidden link blocks are a
 * spam signal.
 */

interface LinkGroup {
  heading: string
  links: Array<{ label: string; href: string }>
}

/**
 * Runs a query and returns [] instead of throwing.
 *
 * Each group here is independent, so one missing table must not blank the whole block.
 * `Promise.all` would reject the lot — which is exactly what happened before migration 024
 * was applied: `health_conditions` did not exist and the entire section vanished.
 */
async function safeQuery<T>(fn: () => Promise<T[]>, label: string): Promise<T[]> {
  try {
    return await fn()
  } catch (error) {
    console.error(`[seo-links] ${label} failed:`, error)
    return []
  }
}

export async function SeoLinks() {
  const groups: LinkGroup[] = []

  try {
    const [medicines, categories, conditions, manufacturers] = await Promise.all([
      safeQuery(() => query<{ name: string; slug: string | null; id: number }>`
        SELECT DISTINCT ON (m.id) m.id, m.name, m.slug
        FROM medicines m
        JOIN pharmacy_inventory pi ON pi.medicine_id = m.id AND pi.stock_quantity > 0
        WHERE m.status = 'active'
        ORDER BY m.id, m.name
        LIMIT 18
      `, "medicines"),
      safeQuery(() => query<{ category: string }>`
        SELECT category, COUNT(*)::int AS n
        FROM medicines
        WHERE status = 'active' AND category IS NOT NULL AND category <> ''
        GROUP BY category
        ORDER BY n DESC
        LIMIT 12
      `, "categories"),
      safeQuery(() => query<{ name: string; slug: string }>`
        SELECT name, slug FROM health_conditions WHERE is_active ORDER BY display_order LIMIT 12
      `, "conditions"),
      safeQuery(() => query<{ manufacturer: string }>`
        SELECT manufacturer, COUNT(*)::int AS n
        FROM medicines
        WHERE status = 'active' AND manufacturer IS NOT NULL AND manufacturer <> ''
        GROUP BY manufacturer
        ORDER BY n DESC
        LIMIT 12
      `, "manufacturers"),
    ])

    if (medicines.length > 0) {
      groups.push({
        heading: "Popular medicines",
        links: medicines.map((m) => ({
          label: m.name,
          href: `/medicines/${m.slug || m.id}`,
        })),
      })
    }

    if (categories.length > 0) {
      groups.push({
        heading: "Categories",
        links: categories.map((c) => ({
          label: c.category,
          href: `/medicines?category=${encodeURIComponent(c.category)}`,
        })),
      })
    }

    if (conditions.length > 0) {
      groups.push({
        heading: "Health concerns",
        links: conditions.map((c) => ({
          label: c.name,
          href: `/health-conditions/${c.slug}`,
        })),
      })
    }

    if (manufacturers.length > 0) {
      groups.push({
        heading: "Brands",
        links: manufacturers.map((m) => ({
          label: m.manufacturer,
          href: `/medicines?manufacturer=${encodeURIComponent(m.manufacturer)}`,
        })),
      })
    }
  } catch (error) {
    console.error("[seo-links] load failed:", error)
    return null
  }

  if (groups.length === 0) return null

  return (
    <section aria-labelledby="browse-heading" className="border-t border-border py-10">
      <div className="page-container">
        <h2 id="browse-heading" className="text-sm font-semibold text-foreground">
          Browse Davaa.in
        </h2>

        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.heading}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.heading}
              </h3>
              <ul className="mt-2.5 space-y-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="line-clamp-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
