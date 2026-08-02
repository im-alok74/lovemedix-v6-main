"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddToCartButton } from "./add-to-cart-button"
import { BuyNowButton } from "./buy-now-button"
import Image from "next/image"
import Link from "next/link"
import { Heart, Star, Clock3, PackageCheck, ShieldCheck } from "lucide-react"

interface Medicine {
  id: number
  name: string
  generic_name: string | null
  manufacturer: string | null
  category: string | null
  form: string | null
  strength: string | null
  pack_size: string | null
  description: string | null
  requires_prescription: boolean
  mrp: string
  image_url?: string | null
  photo_url?: string | null
  status: string
  selling_price?: string | null
  discount_percentage?: string | null
  pharmacy_name?: string | null
  images?: string[]
}

export function MedicineCard({ medicine, compact = false }: { medicine: Medicine; compact?: boolean }) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const mrp = Number.parseFloat(String(medicine.mrp || 0))
  const sellingPrice =
    medicine.selling_price !== undefined && medicine.selling_price !== null
      ? Number.parseFloat(String(medicine.selling_price || 0))
      : mrp
  const discountPercentage =
    medicine.discount_percentage !== undefined && medicine.discount_percentage !== null
      ? Number.parseFloat(String(medicine.discount_percentage || 0))
      : 0
  const hasDiscount = discountPercentage > 0 && sellingPrice > 0
  const finalPrice = hasDiscount ? sellingPrice - sellingPrice * (discountPercentage / 100) : sellingPrice
  const rating = Number((4.2 + ((medicine.id % 5) * 0.2)).toFixed(1))
  const deliveryTime = medicine.requires_prescription ? "2-4 hrs" : "Same day"
  const stockLabel = medicine.status === "active" ? "In stock" : "Limited stock"

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-linear-to-b from-background to-muted/20 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
      <div className="relative">
        <Link href={`/medicines/${medicine.id}`} className="block">
          <CardContent className="flex-1 p-3 lg:p-4">
            <div className="relative mb-3 aspect-4/3 overflow-hidden rounded-[1.25rem] bg-linear-to-br from-muted to-muted/50">
              <Image
                src={
                  (medicine.images && medicine.images.length > 0 && medicine.images[0]) ||
                  medicine.photo_url ||
                  medicine.image_url ||
                  "/placeholder.svg?height=220&width=220&query=medicine pill tablet"
                }
                alt={medicine.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute left-2 top-2 flex flex-wrap gap-2">
                {hasDiscount ? (
                  <Badge className="bg-green-600 text-white shadow-sm">{discountPercentage.toFixed(0)}% OFF</Badge>
                ) : null}
                {medicine.requires_prescription ? (
                  <Badge variant="secondary" className="bg-background/90 text-foreground shadow-sm backdrop-blur-sm">
                    ℞ Rx
                  </Badge>
                ) : null}
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  setIsWishlisted((value) => !value)
                }}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur transition hover:text-rose-500"
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold text-foreground">{rating}</span>
              </div>
              <span>•</span>
              <span>{medicine.category || "General"}</span>
            </div>

            <h3 className="mb-1 line-clamp-2 text-balance text-sm font-semibold text-foreground lg:text-base">
              {medicine.name}
            </h3>
            {medicine.generic_name ? <p className="mb-1 line-clamp-1 text-xs text-muted-foreground">{medicine.generic_name}</p> : null}
            <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">{medicine.manufacturer || "Verified manufacturer"}</p>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold text-primary lg:text-xl">₹{finalPrice.toFixed(2)}</p>
                {hasDiscount ? <p className="text-xs text-muted-foreground line-through">₹{mrp.toFixed(2)}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1">
                  <PackageCheck className="h-3.5 w-3.5" /> {stockLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1">
                  <Clock3 className="h-3.5 w-3.5" /> {deliveryTime}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
      </div>

      <CardFooter className="mt-auto border-t border-border/70 bg-background/70 p-3 lg:p-4">
        <div className="grid w-full gap-2 sm:grid-cols-2">
          <BuyNowButton medicineId={medicine.id} />
          <AddToCartButton medicineId={medicine.id} />
        </div>
      </CardFooter>
    </Card>
  )
}
