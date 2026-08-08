import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"

import { getHealthArticles } from "@/lib/health-articles"

/**
 * Three health articles, linking through to the full hub.
 *
 * Editorial content is an SEO asset on a pharmacy: it ranks for informational queries
 * ("is paracetamol safe in pregnancy") that product pages never will, and it is what an
 * answer engine cites. The hub itself still needs Article schema — see AGENT_HANDOFF.md.
 */
export async function ArticlesTeaser() {
  let articles: Awaited<ReturnType<typeof getHealthArticles>> = []

  try {
    articles = await getHealthArticles()
  } catch (error) {
    console.error("[articles-teaser] load failed:", error)
    return null
  }

  if (articles.length === 0) return null

  return (
    <section aria-labelledby="articles-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="articles-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Health reads
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              General wellbeing information — not a substitute for your doctor&apos;s advice.
            </p>
          </div>
          <Link href="/health-articles" className="shrink-0 text-sm font-medium text-primary hover:underline">
            All articles
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <li key={article.title}>
              <Link href="/health-articles" className="surface surface-hover flex h-full flex-col p-5">
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  {article.category}
                </span>
                <h3 className="mt-2 text-sm font-medium leading-snug text-foreground">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {article.summary}
                </p>
                <span className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {article.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    Read
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
