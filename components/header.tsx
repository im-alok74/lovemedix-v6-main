export const dynamic = "force-dynamic"

import Link from "next/link"
import { Menu, Pill, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeaderCart } from "@/components/header-cart"
import { SearchBar } from "@/components/search-bar"
import { getCurrentUser } from "@/lib/auth-server"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import SignOutButton from "@/components/auth/signout-button"

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg shadow-primary/20 transition-all group-hover:shadow-xl group-hover:shadow-primary/30">
              <Pill className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-lg font-bold leading-none text-transparent">
                Davaa.in
              </span>
              <span className="text-xs text-muted-foreground">Medicines in Minutes</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link href="/medicines" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
              Medicines
            </Link>
            <Link href="/upload-prescription" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
              Upload Prescription
            </Link>
            <Link href="/health-articles" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
              Health Articles
            </Link>
          </nav>
        </div>

        <div className="hidden flex-1 px-4 lg:block">
          <SearchBar compact showButton={false} className="mx-auto max-w-xl" />
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          {user ? (
            <>
              <HeaderCart />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="gradient-primary text-primary-foreground">
                        {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.full_name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.user_type === "customer" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/orders">My Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/prescriptions">Prescriptions</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.user_type === "pharmacy" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/pharmacy/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/pharmacy/orders">Orders</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.user_type === "distributor" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/distributor/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/distributor/orders">Orders</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.user_type === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <SignOutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="gradient-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Link href="/signup">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            </>
          )}

          <details className="group relative lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm">
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-12 w-72 rounded-3xl border border-border/70 bg-background p-3 shadow-2xl shadow-slate-950/10">
              <nav className="flex flex-col gap-1">
                <Link href="/medicines" className="rounded-2xl px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground">
                  Medicines
                </Link>
                <Link href="/upload-prescription" className="rounded-2xl px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground">
                  Upload Prescription
                </Link>
                <Link href="/health-articles" className="rounded-2xl px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground">
                  Health Articles
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
