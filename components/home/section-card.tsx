import { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, description, icon, action, children, className }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className={cn("rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.25)] backdrop-blur sm:p-8", className)}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          {icon ? <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div> : null}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  )
}
