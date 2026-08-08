import type { MetadataRoute } from "next"

import { query } from "@/lib/db"
import { absoluteUrl } from "@/lib/site"

// Regenerate hourly. A catalog sitemap rebuilt on every request is a needless DB hit.
export const revalidate = 3600

/**
 * Dynamic sitemap covering static pages, every active medicine, and the health-condition
 * landing pages. Medicine URLs are the long-tail traffic on a pharmacy site — those are
 * the pages that rank for "buy <brand> <strength> online".
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/medicines"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/health-articles"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/upload-prescription"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/pharmacy/register"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/distributor/register"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/refund"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  try {
    const [medicines, conditions] = await Promise.all([
      query<{ id: number; slug: string | null; updated_at: string | null }>`
        SELECT id, slug, updated_at
        FROM medicines
        WHERE status = 'active'
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 45000
      `,
      query<{ slug: string }>`
        SELECT slug FROM health_conditions WHERE is_active ORDER BY display_order
      `,
    ])

    const medicineEntries: MetadataRoute.Sitemap = medicines.map((m) => ({
      url: absoluteUrl(`/medicines/${m.slug || m.id}`),
      lastModified: m.updated_at ? new Date(m.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }))

    const conditionEntries: MetadataRoute.Sitemap = conditions.map((c) => ({
      url: absoluteUrl(`/health-conditions/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }))

    return [...staticEntries, ...conditionEntries, ...medicineEntries]
  } catch (error) {
    // A DB hiccup should degrade the sitemap, not return a 500 to Googlebot.
    console.error("[sitemap] Falling back to static entries:", error)
    return staticEntries
  }
}
