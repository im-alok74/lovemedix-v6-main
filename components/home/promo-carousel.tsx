"use client"

import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { A11y, Autoplay, Keyboard, Pagination } from "swiper/modules"
import { ArrowRight, FileText, Pill, ShieldCheck, Store } from "lucide-react"

import "swiper/css"
import "swiper/css/pagination"

/**
 * Promotional banner carousel.
 *
 * Two things the previous version got wrong, both fixed here:
 *
 * 1. It advertised "20% off your first order" — an offer with no coupon system behind it.
 *    Every slide now points at something that actually exists.
 * 2. Each slide rendered an `<h1>`, so the homepage shipped six of them. A page gets one
 *    h1; these are `<h2>`, and the carousel sits below the page heading.
 *
 * Slide height is fixed per breakpoint so the carousel reserves its space and cannot
 * shift layout as slides swap — CLS is the cheapest Core Web Vital to fail.
 */

const SLIDES = [
  {
    id: "prescription",
    icon: FileText,
    title: "Upload a prescription, we do the rest",
    body: "A licensed pharmacist reads it, confirms the medicines and price with you, then dispatches.",
    href: "/upload-prescription",
    cta: "Upload prescription",
  },
  {
    id: "generics",
    icon: Pill,
    title: "See the generic version of any medicine",
    body: "Same salt, same strength, often a fraction of the price. Shown on every product page.",
    href: "/medicines",
    cta: "Browse medicines",
  },
  {
    id: "verified",
    icon: ShieldCheck,
    title: "Every seller holds a valid drug licence",
    body: "Batch number, manufacturing date and expiry are printed on every invoice.",
    href: "/about",
    cta: "How it works",
  },
  {
    id: "partner",
    icon: Store,
    title: "Run a pharmacy? Sell on Davaa.in",
    body: "List your stock, reach customers in your delivery radius, manage orders in one place.",
    href: "/pharmacy/register",
    cta: "Register your pharmacy",
  },
] as const

export function PromoCarousel() {
  return (
    <section aria-label="Highlights" className="relative">
      <Swiper
        modules={[Autoplay, Pagination, Keyboard, A11y]}
        // Pauses when the pointer is over it and when the tab is hidden, so an
        // auto-advancing banner never yanks content away mid-read.
        autoplay={{ delay: 6000, disableOnInteraction: true, pauseOnMouseEnter: true }}
        loop
        keyboard={{ enabled: true }}
        pagination={{ clickable: true }}
        a11y={{
          prevSlideMessage: "Previous highlight",
          nextSlideMessage: "Next highlight",
          paginationBulletMessage: "Go to highlight {{index}}",
        }}
        className="hero-swiper !pb-10"
      >
        {SLIDES.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="surface flex h-44 flex-col justify-center gap-2 bg-muted/40 p-5 sm:h-40 sm:p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-background">
                <slide.icon className="h-[18px] w-[18px] text-primary" aria-hidden />
              </span>
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {slide.title}
              </h2>
              <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {slide.body}
              </p>
              <Link
                href={slide.href}
                className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {slide.cta}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
