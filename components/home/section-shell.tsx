import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionShellProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionShell({ title, description, action, children, className }: SectionShellProps) {
  return (
    <section className={cn("rounded-4xl border border-border/70 bg-card/70 p-6 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.25)] backdrop-blur sm:p-8", className)}>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
