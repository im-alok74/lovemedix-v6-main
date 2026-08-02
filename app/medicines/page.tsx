import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MedicineList } from "@/components/medicines/medicine-list"
import { MedicineFilters } from "@/components/medicines/medicine-filters"
import { SearchBar } from "@/components/search-bar"
import { Suspense } from "react"

export const revalidate = 0
export const dynamic = 'force-dynamic'

function MedicineListFallback() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-72 animate-pulse rounded-lg border border-border bg-card" />
      ))}
    </div>
  )
}

export default function MedicinesPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string }
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-linear-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="mb-8 space-y-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground lg:text-4xl">Browse Medicines</h1>
              <p className="text-muted-foreground lg:text-lg">Discover from our wide range of quality medicines</p>
            </div>
            <div className="max-w-2xl">
              <SearchBar />
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <MedicineFilters />
            </aside>
            <div className="lg:col-span-3">
              <Suspense fallback={<MedicineListFallback />}>
                <MedicineList searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
