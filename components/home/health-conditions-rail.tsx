import Link from "next/link"
import {
  Accessibility, Activity, Baby, Bandage, Bone, Brain, Droplet, Eye, Filter,
  Flower2, Heart, HeartPulse, Soup, Sparkles, Thermometer, Wind, type LucideIcon,
} from "lucide-react"

/**
 * "Shop by health concern" — the navigation pattern both 1mg and Apollo lead with,
 * because most people search by problem ("acidity", "blood pressure") rather than by
 * brand name. Also gives us a set of indexable landing pages per condition.
 */

const ICONS: Record<string, LucideIcon> = {
  Droplet, HeartPulse, Soup, Bandage, Thermometer, Activity, Wind, Sparkles,
  Bone, Filter, Eye, Flower2, Baby, Accessibility, Heart, Brain,
}

export interface HealthCondition {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
}

export function HealthConditionsRail({ conditions }: { conditions: HealthCondition[] }) {
  if (conditions.length === 0) return null

  return (
    <section aria-labelledby="shop-by-health" className="py-10 sm:py-12">
      <div className="page-container">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="shop-by-health" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Shop by health concern
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Find the right medicines for what you are treating.
            </p>
          </div>
          <Link
            href="/health-conditions"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {conditions.slice(0, 16).map((condition) => {
            const Icon = ICONS[condition.icon ?? ""] ?? Activity
            return (
              <li key={condition.id}>
                <Link
                  href={`/health-conditions/${condition.slug}`}
                  className="surface surface-hover flex h-full flex-col items-center gap-2 p-3 text-center"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <span className="text-xs font-medium leading-tight text-foreground">
                    {condition.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
