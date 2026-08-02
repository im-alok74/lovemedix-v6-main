"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import { ArrowRight, BadgeCheck, HeartPulse, ShieldCheck, Stethoscope, Microscope, Baby, Sparkles, ShoppingBag, Search, Laptop, ChevronRight, PlayCircle, Download, Heart, Star, Clock3, Smartphone, FileText, TrendingUp, Package, Shield, CreditCard, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionCard } from "@/components/home/section-card"
import { SearchBar } from "@/components/search-bar"

import "swiper/css"
import "swiper/css/pagination"

const categoryCards = [
  { title: "Pain Relief", icon: <HeartPulse className="h-6 w-6" />, href: "/medicines?category=pain-relief" },
  { title: "Heart Care", icon: <Heart className="h-6 w-6" />, href: "/medicines?category=heart-care" },
  { title: "Diabetes", icon: <Activity className="h-6 w-6" />, href: "/medicines?category=diabetes" },
  { title: "Baby Care", icon: <Baby className="h-6 w-6" />, href: "/medicines?category=baby-care" },
  { title: "Women's Care", icon: <ShieldCheck className="h-6 w-6" />, href: "/medicines?category=womens-care" },
  { title: "Supplements", icon: <Sparkles className="h-6 w-6" />, href: "/medicines?category=supplements" },
  { title: "Ayurveda", icon: <LeafIcon />, href: "/medicines?category=ayurveda" },
  { title: "Medical Devices", icon: <Microscope className="h-6 w-6" />, href: "/medicines?category=medical-devices" },
  { title: "Skin Care", icon: <Shield className="h-6 w-6" />, href: "/medicines?category=skin-care" },
  { title: "Hair Care", icon: <Sparkles className="h-6 w-6" />, href: "/medicines?category=hair-care" },
]

const healthConditions = [
  { title: "Cold & Fever", description: "Rapid relief essentials", href: "/medicines?condition=cold-fever" },
  { title: "Joint Pain", description: "Trusted support", href: "/medicines?condition=joint-pain" },
  { title: "Skin Issues", description: "Gentle routines", href: "/medicines?condition=skin-issues" },
  { title: "Digestion", description: "Daily wellness", href: "/medicines?condition=digestion" },
]

const tabs = ["Trending", "Best Sellers", "New Arrivals", "Prescription", "OTC"]

const deals = [
  { title: "Buy 2, Save 15%", subtitle: "On everyday essentials" },
  { title: "Free Shipping", subtitle: "Orders above ₹500" },
  { title: "New Member Offer", subtitle: "Enjoy added savings" },
]

const brands = [
  "Cipla", "Abbott", "Sun Pharma", "Lupin", "Glenmark", "Mankind"
]

const testimonials = [
  {
    quote: "The delivery was incredibly fast and the app experience felt premium throughout.",
    name: "Ananya S.",
    role: "Verified customer",
  },
  {
    quote: "I could upload my prescription in minutes and get everything delivered without hassle.",
    name: "Rohit M.",
    role: "Regular buyer",
  },
  {
    quote: "The category browsing and trusted recommendations made my experience effortless.",
    name: "Meera K.",
    role: "Pharmacy partner",
  },
]

const articles = [
  { title: "How to store medicines safely at home", category: "Wellness" },
  { title: "Understanding everyday supplements", category: "Nutrition" },
  { title: "When to consult a pharmacist", category: "Health Tips" },
]

function LeafIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path d="M5 19c8-2 12-8 14-14 0 0-6 1-10 5-3 4-4 7-4 9Z" /></svg>
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/70 p-5 text-center shadow-sm">
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function HomepageSections() {
  return (
    <div className="space-y-8">
      <section className="py-4 md:py-6">
        <SectionCard
          title="Search Medicines"
          description="Find trusted products quickly with smart search, popular suggestions, and recent picks."
          icon={<Search className="h-6 w-6" />}
        >
          <div className="rounded-4xl border border-border/70 bg-linear-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-6">
            <div className="mx-auto max-w-3xl">
              <SearchBar showButton className="w-full" />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Paracetamol",
                "Vitamin D3",
                "Insulin",
                "Cetirizine",
                "Omeprazole",
              ].map((query) => (
                <Link key={query} href="/medicines" className="rounded-full border border-border/70 bg-background/80 px-3.5 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                  {query}
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Cough Syrup', 'Multivitamin', 'Pain relief'].map((item) => <span key={item} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{item}</span>)}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">Recent Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Blood Pressure', 'Diabetic Care', 'Baby Essentials'].map((item) => <span key={item} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{item}</span>)}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Shop by Categories" description="Browse trusted categories designed for everyday care." icon={<ShoppingBag className="h-6 w-6" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {categoryCards.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.04 }}>
                <Link href={item.href} className="group flex h-full flex-col rounded-[1.75rem] border border-border/70 bg-linear-to-br from-background to-muted/40 p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_45px_-28px_rgba(15,23,42,0.3)]">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-110">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Explore curated essentials</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Shop by Health Conditions" description="Support your wellness goals with targeted care options." icon={<Stethoscope className="h-6 w-6" />}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {healthConditions.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.05 }}>
                <Link href={item.href} className="block rounded-[1.75rem] border border-border/70 bg-background/80 p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_45px_-30px_rgba(15,23,42,0.3)]">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Browse now <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Today's Deals" description="Limited-time offers curated for everyday savings." icon={<BadgeCheck className="h-6 w-6" />}>
          <div className="grid gap-4 lg:grid-cols-3">
            {deals.map((deal, index) => (
              <motion.div key={deal.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.06 }} className="rounded-[1.75rem] border border-border/70 bg-linear-to-br from-primary/10 to-accent/10 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Offer</p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">{deal.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{deal.subtitle}</p>
                <Button asChild className="mt-6 rounded-full">
                  <Link href="/medicines">Shop now</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Trending Medicines" description="Explore the most sought after essentials across categories." icon={<TrendingUp className="h-6 w-6" />} action={<div className="flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab} className="rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">{tab}</button>)}</div>}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {['Amoxicillin', 'Paracetamol', 'Vitamin C', 'Multivitamin'].map((medicine, index) => (
              <motion.div key={medicine} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.05 }} className="rounded-[1.75rem] border border-border/70 bg-background/80 p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{medicine}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Fast delivery from verified pharmacies</p>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Popular Brands" description="Trusted names available for every need." icon={<ShieldCheck className="h-6 w-6" />}>
          <div className="rounded-[2rem] border border-border/70 bg-gradient-to-br from-muted/40 to-background p-4 sm:p-6">
            <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 2600, disableOnInteraction: false }} loop pagination={{ clickable: true }} className="brands-swiper">
              {brands.map((brand) => (
                <SwiperSlide key={brand}>
                  <div className="flex h-36 items-center justify-center rounded-3xl border border-border/70 bg-background/90 text-center text-xl font-semibold text-foreground shadow-sm">
                    {brand}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Upload Prescription" description="Share your prescription and get a smoother healthcare checkout." icon={<FileText className="h-6 w-6" />}>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Fast & secure</p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">Upload once, order confidently</h3>
              <p className="mt-3 text-base leading-8 text-muted-foreground">Receive verified support for prescription-only medicines without any extra friction.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/upload-prescription">Upload prescription</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/medicines">Browse medicines</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-primary/10 to-accent/10 p-6">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck className="h-6 w-6" />
                <p className="text-sm font-semibold">Verified by pharmacists</p>
              </div>
              <div className="mt-6 space-y-3">
                {['Prescription review', 'Secure uploads', 'Faster checkout'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                    <BadgeCheck className="h-4 w-4 text-primary" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Why Choose Davaa" description="Trusted care, transparent pricing, and dependable delivery for every order." icon={<Shield className="h-6 w-6" />}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['30 min', 'Average delivery window'],
              ['100%', 'Verified pharmacies'],
              ['24/7', 'Care support'],
              ['₹500+', 'Free delivery threshold'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-[1.75rem] border border-border/70 bg-background/80 p-5 text-center">
                <p className="text-3xl font-semibold text-foreground">{value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Trusted by Families" description="Numbers that reflect our growing impact across communities." icon={<Activity className="h-6 w-6" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat value="10k+" label="Happy customers" />
            <Stat value="250+" label="Verified pharmacies" />
            <Stat value="98%" label="Satisfaction rate" />
            <Stat value="4.9/5" label="Average rating" />
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Become a Pharmacy or Distributor" description="Grow your business with the trusted Davaa platform." icon={<Laptop className="h-6 w-6" />}>
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-6">
              <h3 className="text-2xl font-semibold text-foreground">Expand your reach with confidence</h3>
              <p className="mt-3 text-base leading-8 text-muted-foreground">Manage inventory, get more visibility, and serve communities faster with our growing healthcare network.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/pharmacy/register">Register as pharmacy</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/distributor/register">Register as distributor</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-primary/10 to-accent/10 p-6">
              <div className="space-y-3">
                {['Digital inventory tools', 'Verified customer demand', 'Simple onboarding'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                    <ArrowRight className="h-4 w-4 text-primary" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Health Articles" description="Helpful reads to support everyday wellness decisions." icon={<FileText className="h-6 w-6" />}>
          <div className="grid gap-4 lg:grid-cols-3">
            {articles.map((article, index) => (
              <motion.div key={article.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.05 }} className="rounded-[1.75rem] border border-border/70 bg-background/80 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{article.category}</p>
                <h3 className="mt-3 text-xl font-semibold text-foreground">{article.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">Insights for cleaner routines and better health choices.</p>
                <Link href="/health-articles" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">Read article <ChevronRight className="h-4 w-4" /></Link>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Testimonials" description="What customers and partners say about their Davaa experience." icon={<Star className="h-6 w-6" />}>
          <div className="rounded-[2rem] border border-border/70 bg-gradient-to-br from-muted/40 to-background p-4 sm:p-6">
            <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 3000, disableOnInteraction: false }} loop pagination={{ clickable: true }} className="testimonials-swiper">
              {testimonials.map((item) => (
                <SwiperSlide key={item.name}>
                  <div className="rounded-[1.75rem] border border-border/70 bg-background/90 p-8 text-center shadow-sm">
                    <div className="mb-4 flex justify-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-5 w-5 fill-current" />)}
                    </div>
                    <p className="text-lg leading-8 text-foreground">“{item.quote}”</p>
                    <p className="mt-6 text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </SectionCard>
      </section>

      <section className="py-2 md:py-4">
        <SectionCard title="Download the App" description="Stay connected to medicine delivery, prescriptions, and order tracking." icon={<Smartphone className="h-6 w-6" />}>
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Get it on the go</p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">A faster, simpler way to shop healthcare</h3>
              <p className="mt-3 text-base leading-8 text-muted-foreground">From order tracking to prescription uploads, your essentials stay one tap away.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="#"><Download className="mr-2 h-4 w-4" />Download app</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/medicines">Explore medicines</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-primary/10 to-accent/10 p-6">
              <div className="flex items-center gap-3 rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground">
                <PlayCircle className="h-6 w-6 text-primary" /> See how the app helps you order in minutes
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {['Order history', 'Quick refills', 'Medicine reminders', 'Fast support'].map((item) => (
                  <div key={item} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  )
}
