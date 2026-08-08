import Link from "next/link"
import { FileText, Pill, RotateCcw, Stethoscope } from "lucide-react"

/**
 * Four primary entry points, as large tap targets.
 *
 * On mobile this is the real navigation — most users never open the header menu. Kept to
 * four so each stays comfortably above the 44px minimum touch target at 360px wide.
 */
const ACTIONS = [
  {
    href: "/medicines",
    icon: Pill,
    label: "Order medicines",
    hint: "Search the catalogue",
  },
  {
    href: "/upload-prescription",
    icon: FileText,
    label: "Upload prescription",
    hint: "A pharmacist reads it",
  },
  {
    href: "/health-conditions",
    icon: Stethoscope,
    label: "Shop by health",
    hint: "Browse by concern",
  },
  {
    href: "/orders",
    icon: RotateCcw,
    label: "Reorder",
    hint: "From past orders",
  },
] as const

export function QuickActions() {
  return (
    <section aria-label="Quick actions" className="py-6 sm:py-8">
      <div className="page-container">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ACTIONS.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="surface surface-hover flex min-h-[88px] flex-col items-center justify-center gap-2 p-4 text-center sm:flex-row sm:justify-start sm:text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent">
                  <action.icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{action.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{action.hint}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
