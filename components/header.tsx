import Link from "next/link"
import { FileText, Newspaper, Pill, Stethoscope, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HeaderCart } from "@/components/header-cart"
import { HeaderSearch } from "@/components/header-search"
import { MobileNav } from "@/components/mobile-nav"
import { UserMenu } from "@/components/user-menu"
import { getCurrentUser } from "@/lib/auth-server"
import { SITE } from "@/lib/site"

/**
 * `icon` is a *name*, not a component: MobileNav is a client component, and functions
 * cannot be serialised across the server/client boundary. It maps the name back to an
 * icon on its side. The desktop nav below renders in this server component, so it can
 * hold the real component in `Icon`.
 */
export const NAV_LINKS: ReadonlyArray<{ href: string; label: string; icon: string; Icon: LucideIcon }> = [
  { href: "/medicines", label: "Medicines", icon: "Pill", Icon: Pill },
  { href: "/health-conditions", label: "Shop by Health", icon: "Stethoscope", Icon: Stethoscope },
  { href: "/upload-prescription", label: "Upload Prescription", icon: "FileText", Icon: FileText },
  { href: "/health-articles", label: "Health Articles", icon: "Newspaper", Icon: Newspaper },
]

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="page-container">
        <div className="flex h-16 items-center gap-3">
          <MobileNav
            links={NAV_LINKS.map(({ href, label, icon }) => ({ href, label, icon }))}
            user={user}
          />

          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${SITE.name} home`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Pill className="h-[18px] w-[18px] text-primary-foreground" aria-hidden />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-base font-semibold tracking-tight text-foreground">{SITE.name}</span>
              <span className="mt-0.5 text-[11px] text-muted-foreground">{SITE.tagline}</span>
            </span>
          </Link>

          {/* Search is the primary action on a pharmacy — it gets the centre of the bar
              and all remaining width, rather than sitting below the fold on the hero. */}
          <div className="ml-1 flex-1 lg:ml-6">
            <HeaderSearch />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {user?.user_type === "customer" || !user ? <HeaderCart /> : null}

            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Secondary nav. Hidden on mobile, where MobileNav covers the same links. */}
      <nav
        aria-label="Primary"
        className="hidden border-t border-border/70 lg:block"
      >
        <div className="page-container">
          <ul className="flex h-11 items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <link.Icon className="h-4 w-4" aria-hidden />
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="ml-auto">
              <Link
                href="/pharmacy/register"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sell on {SITE.name}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
