"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"

const slides = [
  {
    eyebrow: "Fast & reliable",
    title: "Medicines delivered in minutes",
    description:
      "Order prescription and everyday essentials from verified pharmacies with transparent pricing and rapid delivery.",
    primaryHref: "/medicines",
    secondaryHref: "/upload-prescription",
    accent: "from-emerald-500/20 via-cyan-500/15 to-sky-600/10",
  },
  {
    eyebrow: "New customers",
    title: "20% off your first order",
    description:
      "Enjoy curated savings on everyday care products and trusted medicines when you get started today.",
    primaryHref: "/signup",
    secondaryHref: "/medicines",
    accent: "from-fuchsia-500/20 via-rose-500/15 to-orange-400/10",
  },
  {
    eyebrow: "Simple and secure",
    title: "Upload your prescription in seconds",
    description:
      "Share your prescription, get verified guidance, and place your order without leaving your home.",
    primaryHref: "/upload-prescription",
    secondaryHref: "/health-articles",
    accent: "from-indigo-500/20 via-violet-500/15 to-cyan-400/10",
  },
  {
    eyebrow: "Seasonal care",
    title: "Monsoon essentials for every home",
    description:
      "Stay prepared with essentials for seasonal wellness, hydration, and everyday family care.",
    primaryHref: "/medicines",
    secondaryHref: "/health-articles",
    accent: "from-sky-500/20 via-blue-500/15 to-cyan-400/10",
  },
  {
    eyebrow: "Grow with Davaa",
    title: "Become a pharmacy partner",
    description:
      "Expand your reach, manage inventory, and serve more local customers with our trusted platform.",
    primaryHref: "/pharmacy/register",
    secondaryHref: "/distributor/register",
    accent: "from-amber-500/20 via-orange-500/15 to-rose-400/10",
  },
  {
    eyebrow: "Trusted platform",
    title: "Healthcare support you can rely on",
    description:
      "From quality assurance to fast fulfillment, every order is designed around a better care experience.",
    primaryHref: "/medicines",
    secondaryHref: "/about",
    accent: "from-teal-500/20 via-emerald-500/15 to-lime-400/10",
  },
]

export function HeroSlider() {
  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop
        pagination={{ clickable: true }}
        navigation={{ nextEl: ".hero-next", prevEl: ".hero-prev" }}
        className="hero-swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.title}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className={`overflow-hidden rounded-4xl border border-white/70 bg-linear-to-br ${slide.accent} shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)]`}
            >
              <div className="grid min-h-105 items-center gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-10">
                <div className="max-w-2xl space-y-6 text-slate-900">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-slate-700 backdrop-blur">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    {slide.eyebrow}
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                      {slide.title}
                    </h1>
                    <p className="max-w-xl text-base leading-8 text-slate-700 sm:text-lg">
                      {slide.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="rounded-full px-6 shadow-lg shadow-emerald-600/20">
                      <Link href={slide.primaryHref}>
                        Explore now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full border-slate-300 bg-white/80 px-6">
                      <Link href={slide.secondaryHref}>Learn more</Link>
                    </Button>
                  </div>
                </div>

                <div className="relative mx-auto flex w-full max-w-105 items-center justify-center">
                  <div className="absolute inset-0 rounded-4xl bg-white/30 blur-3xl" />
                  <div className="relative w-full overflow-hidden rounded-[1.75rem] border border-white/60 bg-slate-950/90 p-4 shadow-2xl shadow-slate-950/20">
                    <Image
                      src="/hero-illustration.svg"
                      alt="Placeholder healthcare illustration"
                      width={640}
                      height={480}
                      className="h-auto w-full rounded-[1.25rem]"
                      priority={false}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        type="button"
        className="hero-prev absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:bg-white"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        className="hero-next absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:bg-white"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
