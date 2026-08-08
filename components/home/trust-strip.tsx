import { BadgeCheck, PackageCheck, RotateCcw, Truck } from "lucide-react"

import { SITE } from "@/lib/site"
import { formatINR } from "@/lib/pricing"

/**
 * Trust signals.
 *
 * Every claim here is one the platform can actually keep — sourcing from licensed
 * pharmacies, the real delivery window, the real free-delivery threshold. Inflated
 * promises ("delivery in 10 minutes") are the fastest way to generate refund requests.
 */
const SIGNALS = [
  {
    icon: BadgeCheck,
    title: "Licensed pharmacies only",
    body: "Every seller is verified against a valid drug licence before they can list stock.",
  },
  {
    icon: Truck,
    title: `Delivery in ${SITE.promise.deliveryWindow}`,
    body: `Free above ${formatINR(SITE.promise.freeDeliveryAbove)}. Live tracking on every order.`,
  },
  {
    icon: PackageCheck,
    title: "Batch and expiry on the invoice",
    body: "Batch number, manufacturing and expiry dates are printed on every bill.",
  },
  {
    icon: RotateCcw,
    title: `${SITE.promise.returnWindow} easy returns`,
    body: "Wrong or damaged item? Report it and we arrange a pickup and refund.",
  },
] as const

export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="border-y border-border bg-muted/30">
      <div className="page-container">
        <ul className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNALS.map((signal) => (
            <li key={signal.title} className="flex gap-3">
              <signal.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="text-sm font-medium text-foreground">{signal.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{signal.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
