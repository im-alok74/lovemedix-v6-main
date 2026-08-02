"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeaderCart() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true

    async function loadCount() {
      try {
        const response = await fetch("/api/cart")
        if (!response.ok) {
          if (mounted) setCount(0)
          return
        }

        const data = await response.json()
        if (mounted) {
          setCount(Array.isArray(data?.cartItems) ? data.cartItems.length : 0)
        }
      } catch {
        if (mounted) setCount(0)
      }
    }

    loadCount()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Button variant="ghost" size="icon" asChild className="relative rounded-full">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {count}
          </span>
        ) : null}
        <span className="sr-only">Shopping Cart</span>
      </Link>
    </Button>
  )
}
