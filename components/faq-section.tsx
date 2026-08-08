import { ChevronDown } from "lucide-react"

import type { Faq } from "@/lib/faqs"

/**
 * FAQ accordion.
 *
 * Built on native <details>, so it needs no JavaScript and — importantly for AEO — the
 * answer text is present in the initial HTML rather than injected on expand. A crawler
 * or an AI assistant that does not execute JS still sees every answer.
 */
export function FaqSection({
  faqs,
  title = "Frequently asked questions",
  description,
}: {
  faqs: Faq[]
  title?: string
  description?: string
}) {
  if (faqs.length === 0) return null

  return (
    <section aria-labelledby="faq-heading" className="py-10 sm:py-14">
      <div className="page-container">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          ) : null}

          <div className="mt-6 divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <h3 className="text-sm font-medium text-foreground sm:text-base">{faq.question}</h3>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
