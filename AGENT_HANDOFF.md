# Agent handoff — Davaa.in

Copy everything below the line into a fresh agent session.

---

## Context

You are working on **Davaa.in**, an online pharmacy marketplace for the Indian market. The
repo directory and `package.json` name still say `lovemedix` — that is the old brand and
should not appear in any user-facing string.

**Stack:** Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS v4, Neon serverless
Postgres accessed with raw tagged-template SQL (no ORM), Cloudinary for images, bcryptjs +
DB-backed sessions for auth.

**Roles:** `customer`, `pharmacy`, `distributor`, `admin` — all in one `users` table
discriminated by `user_type`.

**Business model:** marketplace. Davaa does not hold stock. Verified pharmacies list
inventory; customers order; distributors supply pharmacies through a procurement flow.

### Read these first

| File | Why |
|---|---|
| `lib/site.ts` | Single source of truth for brand, contact details, delivery promises. Never hardcode these. |
| `lib/pricing.ts` | **All money goes through here.** Never recompute a total inline. |
| `lib/db.ts` | `sql` for reads, `query<T>` when you want a row type, `withTransaction` for multi-write operations. |
| `lib/auth-server.ts` | `requireUser`, `requireRole`, `requirePharmacyProfile`, `requireDistributorProfile`. |
| `lib/api-response.ts` | `handleApiError(error, scope)` — every route handler's catch block should end with this. |
| `lib/seo.ts` | `buildMetadata()` and the JSON-LD builders. Every new page needs `buildMetadata`. |
| `middleware.ts` | Role-based route protection, covers pages *and* `/api/*`. |
| `scripts/024-production-hardening.sql` | The current schema baseline. Read it before assuming a column does not exist. |
| `components/page-shell.tsx` | `PageShell` + `Prose`. Use for any new content page — gives breadcrumbs and BreadcrumbList JSON-LD for free. |

### Ground rules — do not violate these

1. **Never trust the client for money, identity, or quantity.** Prices, discounts and stock
   are re-derived server-side from the database on every order. A previous version of the
   checkout summed prices posted by the browser; do not reintroduce that pattern anywhere.
2. **Never render invented data.** No fake ratings, review counts, "trusted by N customers",
   or delivery promises the platform cannot keep. Ratings render only when
   `medicine_reviews` has published rows. This is a pharmacy — fabricated trust signals are
   a legal exposure. Emitting a fake `aggregateRating` in JSON-LD also gets rich results
   revoked.
3. **Ownership checks on every `[id]` route.** Never take a `pharmacy_id` or
   `distributor_id` from the request body. Resolve it from the session via
   `requirePharmacyProfile()` / `requireDistributorProfile()`.
4. **`params` is a Promise** in Next 16. Always `const { id } = await params`.
5. **`next.config.mjs` has `typescript.ignoreBuildErrors: false`.** Keep it that way. Run
   `npx tsc --noEmit` before you claim anything is done. It is currently at **0 errors** —
   do not regress it.
6. Do not commit unless explicitly asked.

---

## What has already been done — do not redo

- Server-side pricing + stock reservation in a real transaction (`app/api/orders/create/route.ts`)
- `middleware.ts` (replaced a dead `proxy.ts` that Next never loaded)
- Auth hardening: removed password-hash logging, zod validation, bcrypt rounds 12, account
  lockout, rate limiting (`lib/rate-limit.ts`)
- Full rebrand LoveMedix → Davaa.in
- Minimal design system rebuilt in `app/globals.css` (semantic colour tokens, `.surface`,
  `.page-container`, `.price*` helpers)
- New header (type-ahead search, accessible mobile drawer, role-aware user menu), new
  homepage, new footer
- SEO/AEO: `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, JSON-LD, canonical URLs,
  FAQ system (`lib/faqs.ts` + `components/faq-section.tsx`)
- Created 6 pages the footer was 404ing to: `/about`, `/contact`, `/faq`, `/privacy`,
  `/terms`, `/refund`, plus `/partner-with-us` and `/health-conditions[/slug]`
- Removed fabricated ratings from the product card **and** the catalog's rating filter/sort
- Fixed ~7 classes of runtime bug: async `params` in 9 routes, `sql.raw`/`sql.join` (do not
  exist on the Neon driver), `user.role` (field is `user_type`), missing `audit_logs` table,
  `result.rows` on an array, `new jsPDF.jsPDF()`

`npx next build` currently passes. Keep it passing.

---

## Tooling — use these, do not work blind

Most of this handoff is frontend work, and frontend work cannot be verified by reading code.
**You must look at what you built.** Use the strongest tool available for each job rather
than guessing and asking the user to check.

### Verifying UI — required, not optional

| Tool | Use it for |
|---|---|
| `mcp__Claude_Browser__preview_start` | Start the dev server. Create `.claude/launch.json` with `npm run dev` on port 3000 if it does not exist. **Always use this instead of running `next dev` through Bash** — Bash will block. |
| `mcp__Claude_Browser__navigate` | Load the page you just changed. |
| `mcp__Claude_Browser__read_console_messages` | **Check this on every page.** A screenshot can look perfect while the console is full of hydration errors. |
| `mcp__Claude_Browser__resize_window` | `preset: "mobile"` (375px) and `preset: "desktop"` (1280px). Reload after switching so load-time device gates re-run. Also has `colorScheme` for dark mode. |
| `mcp__Claude_Browser__read_page` | Accessibility tree. Better than a screenshot for checking heading order, labels and landmarks — this is how you verify a11y properly. |
| `mcp__Claude_Browser__computer` `{action:"screenshot"}` | Visual check once the structural checks pass. |
| `mcp__Claude_Browser__read_network_requests` | Catch failed image loads and slow API calls. |
| `browser-automation` skill | Faster one-shot alternative for "does this page render, any console errors". |

**Minimum bar before calling any page done:** loaded in the browser, console clean, checked
at 375px and 1280px, no horizontal body scroll.

### Skills worth invoking

| Skill | When |
|---|---|
| `design:design-critique` | After building a page, before declaring it finished. Catches the things you stop seeing. |
| `design:accessibility-review` | On the PDP, catalogue filters, cart and checkout. These are the flows where a11y failures block real purchases. |
| `design:design-system` | If you find yourself inventing tokens instead of using `app/globals.css`. |
| `dataviz` | **Required before writing any chart code** for the dashboards (task 3). Do not hand-roll chart colours. |
| `figma:figma-design-to-code` | Only if the user supplies Figma files. Do not invent designs in Figma first. |
| `run` | To launch and drive the app end to end. |
| `simplify` | After a large refactor, to clean up duplication before review. |
| `security-review` | Before touching anything in the order, payment or auth path. |

### Rules

- **Never tell the user "please check the page and let me know."** You have a browser. Use it.
- **A screenshot is not proof.** Console + accessibility tree + screenshot together are proof.
- Do not spawn subagents or workflows unless the user explicitly asks. This work is
  sequential and shares context; a cold subagent will re-derive everything and produce
  inconsistent styling.
- Work page by page. Finish and verify one page before starting the next. A half-converted
  storefront where the header is new and the catalogue is old is worse than either.

---

## Your tasks, in priority order

### 1. Remove unused dependencies

27 of 59 runtime dependencies are never imported. Removing them cuts install time and
supply-chain surface.

**Safe to remove** (verified: zero imports anywhere in `app/`, `components/`, `lib/`, `hooks/`):

```
@hookform/resolvers  react-hook-form         @radix-ui/react-accordion
@radix-ui/react-aspect-ratio                 @radix-ui/react-collapsible
@radix-ui/react-context-menu                 @radix-ui/react-hover-card
@radix-ui/react-menubar                      @radix-ui/react-navigation-menu
@radix-ui/react-popover                      @radix-ui/react-scroll-area
@radix-ui/react-slider                       @radix-ui/react-switch
@radix-ui/react-toggle                       @radix-ui/react-toggle-group
@radix-ui/react-tooltip                      autoprefixer
cmdk                 embla-carousel-react    input-otp
react-day-picker     react-resizable-panels  recharts
sonner               tailwindcss-animate     vaul
```

Notes before you delete:
- `autoprefixer` is not referenced in `postcss.config.mjs`; Tailwind v4 handles prefixing.
- `tailwindcss-animate` is unused; `tw-animate-css` (a different package) **is** imported by
  `app/globals.css` — keep that one.
- `sonner` is unused because the app uses the Radix-based `components/ui/toaster.tsx`. Pick
  one toast system; do not run both.
- `recharts` is unused **today**, but task 4 below adds dashboard charts. Either keep it and
  use it, or remove it and add a lighter chart approach. Decide deliberately.
- **Do NOT remove**: `react-dom`, `typescript`, `postcss`, `@tailwindcss/postcss`,
  `@types/*` — nothing imports them by name but the build requires them.

After removing, delete `node_modules` and the lockfile, reinstall, then run `npx tsc --noEmit`
and `npx next build`. Both must pass.

Also consider: `html2canvas` + `html2pdf.js` + `jspdf` are three overlapping PDF libraries for
one feature (invoice download). Consolidate to one — server-side PDF generation would be
better still, since the current client-side approach rasterises the invoice into an image,
which produces large, unsearchable, inaccessible PDFs.

### 2. Frontend — build the storefront to 1mg / Apollo standard

This is the largest task. Read it fully before writing any component.

#### 2.0 What "copy from 1mg and Apollo" means here

Replicate their **information architecture, interaction patterns and page structure**.
Layout conventions and UX patterns are not protectable, and matching them is the right call
— Indian pharmacy customers already know how these pages work, so deviating costs
conversions.

Do **not** copy their actual assets: page copy, product photography, editorial drug
monographs, their written FAQ answers, or their safety-advice ratings. That is copyright
infringement, and for drug content it is also unsafe — their monographs are written and
reviewed by named pharmacists under their editorial policy, and lifting that text means
publishing medical claims nobody at Davaa has verified.

Where a section needs real drug content (uses, side effects, interactions, safety advice),
the correct sources are:
- **CDSCO** package inserts / product monographs
- **India's National Formulary (NFI)** and the **National List of Essential Medicines**
- **openFDA** or **DailyMed** for structured drug label data (free APIs, machine-readable)
- the manufacturer's own approved package insert

Build the **UI shell** for these sections now, populated from `medicines` columns that
migration 024 added (`salt_composition`, `uses`, `how_to_use`, `storage_info`,
`side_effects`, `precautions`, `drug_schedule`). Render a section only when its column has
content — never show an empty accordion, and never fill it with placeholder prose.

#### 2.1 Design system rules

Use the tokens in `app/globals.css`. Do not invent new styles.

| Use | Not |
|---|---|
| `.page-container` | `container mx-auto px-4` |
| `.surface`, `.surface-hover` | ad-hoc `border rounded-lg bg-card shadow-*` |
| `.price`, `.price-strike`, `.price-save` | raw `text-green-600 line-through` |
| `.skeleton` | bespoke pulse divs |
| `var(--success)` / `var(--warning)` | `green-600` / `amber-500` |
| `rounded-md` (8px base) | `rounded-[1.75rem]`, `rounded-[2rem]` |

The old design used stacked gradients, glassmorphism and 60px shadows. The new direction is
calm and clinical: one elevation level, colour used only to carry meaning (price, savings,
stock, Rx status). `components/medicines/medicine-card.tsx`, `app/page.tsx`,
`components/header.tsx` and `components/footer.tsx` are already converted — match them.

**Mobile first.** Over 80% of Indian pharmacy traffic is mobile. Design at 360px, then scale
up. Tap targets ≥ 44px. Never let the page body scroll horizontally.

#### 2.2 `/` — the landing page

The homepage has been rebuilt once (hero, trust strip, health-concern rail, featured
products, partner CTAs, FAQ). It is a solid skeleton, **not a finished landing page**. This
section is what still has to go on it.

Ordering principle from both competitors: **the first screen must answer "can you get me my
medicine, to my address, today?"** Everything merchandising-related comes after that.

**Final section order, top to bottom:**

1. **Utility bar** — location / "Delivering to <city>" selector, persisted in a cookie.
   Both competitors put this above everything else, because serviceability gates the whole
   experience. Wire it to `/api/serviceability`.
2. **Search** — already in the header and sticky. Add **popular search chips** underneath on
   the homepage only (`Paracetamol`, `Vitamin D`, `BP monitor`, `Insulin`), driven by real
   query volume once you have it, hardcoded to a sensible starter list until then.
3. **Hero** — currently a two-column split (value proposition + prescription-upload card).
   Keep the structure. Add a **promotional banner carousel** beneath it: auto-advancing,
   pausable, swipeable, max 3–4 slides. `swiper` is already a dependency and
   `components/home/hero-slider.tsx` exists — rework it rather than adding a new carousel lib.
   Every slide needs a real link and real `alt` text.
4. **Quick-action tiles** — 4 large tap targets: *Order medicines · Upload prescription ·
   Shop by health · Reorder past order*. On mobile this is the primary navigation; most users
   never touch the header nav.
5. **Trust strip** — done (`components/home/trust-strip.tsx`). Do not inflate the claims.
6. **Shop by health concern** — rail is built. It renders empty because
   `medicine_health_conditions` has no rows. **Tagging medicines is a prerequisite for this
   section to be worth anything.**
7. **Deals row** — "Best value right now" exists. Add a countdown or an explicit "offer ends"
   only if the offer is real and stored; otherwise leave it out.
8. **Shop by category** — a horizontal icon rail distinct from health concerns:
   *Vitamins & supplements · Diabetes care · Devices & monitors · Baby care · Personal care ·
   Ayurveda · Sexual wellness · Pet care*. Drives `/medicines?category=`.
9. **Bestsellers / most reordered** — computed from real `order_items` counts. If you have no
   order volume yet, **omit the section** rather than faking it.
10. **Brand rail** — logos linking to `/medicines?manufacturer=`. Only brands you actually
    stock.
11. **Reorder strip** (signed-in customers only) — "Buy again" from their last delivered
    order. Highest-converting block on the page for chronic-medication buyers, and cheap to
    build once `order_status_history` is in place.
12. **Health articles teaser** — 3 cards from `/health-articles`. This is an SEO asset;
    give it `Article` schema.
13. **Partner CTAs** — done (pharmacy / distributor registration).
14. **FAQ accordion** — done. This is the AEO block; keep answers self-contained.
15. **SEO link footer** — a crawlable block of internal links: popular medicines, top
    categories, health concerns, top cities. Both competitors run this and it is a large part
    of why they rank on long-tail queries. Real links only, no keyword stuffing.

**Landing-page technical requirements:**

- **LCP under 2.5s.** The hero image or banner is almost certainly your LCP element — give it
  `priority` and explicit `sizes`. Everything below the fold lazy-loads.
- **No layout shift.** Every image and carousel slot needs reserved dimensions. CLS is the
  easiest Core Web Vital to fail and it directly costs ranking.
- **Server-render the content sections.** They are the indexable payload. Only the carousel,
  pincode check and search are client components today — keep it that way.
- **Each section streams independently** via `<Suspense>` with a `.skeleton` fallback, so one
  slow query cannot block the whole page. `app/page.tsx` already does this — follow the
  pattern.
- **Every section must degrade to nothing.** If a query returns no rows, the section renders
  a real empty state or does not render at all. Never a broken grid, never placeholder data.

#### 2.3 `/medicines` — catalogue

**Fix first (correctness, not cosmetics):** `components/medicines/medicine-list.tsx` fetches
up to 500 rows and filters/sorts in JavaScript. That silently truncates results and will not
survive a real catalogue. Push filtering, sorting and pagination into SQL before touching
the visuals.

Patterns to replicate:
- **Left filter rail** on desktop, **bottom-sheet filter drawer** on mobile with an "Apply"
  button and a live result count
- Filter groups: price bands, brand/manufacturer, form (tablet/syrup/injection), prescription
  required, discount available, in stock, rating
- **Active filters as removable chips** above the grid, plus "Clear all"
- Sort: relevance, price low→high, price high→low, discount, name
- Every filter and sort in the **URL query string**, so results are shareable and
  back-button works
- Sticky result count + sort control on scroll
- Skeleton grid while loading; a real empty state ("No medicines matched — try the salt name,
  or upload your prescription") rather than a blank page
- Pagination or infinite scroll — if infinite, still emit real paginated URLs for crawlers

#### 2.4 `/medicines/[slug]` — product detail page

**This is your single most important page.** It is the main SEO surface, the main conversion
surface, and the main AEO surface.

**Route by slug.** Migration 024 populated `medicines.slug` and `app/sitemap.ts` already
emits slug URLs, but the page still resolves by numeric id. Once Google crawls that sitemap
those URLs must work. Accept both, canonicalise to the slug with a 301.

Section order, following the convention both competitors converged on:

1. **Breadcrumb** — `Home > Category > Sub-category > Product` (use `PageShell` crumbs)
2. **Product header** — name, salt composition as a subtitle (`Paracetamol 650mg`),
   manufacturer, pack size
3. **Image gallery** — thumbnails + zoom. Falls back to a clean placeholder, never a broken image
4. **Price block** — final price, MRP struck through, `% off` badge, **per-unit price**
   (`₹2.13 per tablet` — Apollo does this and it materially helps comparison)
5. **Pack-size / variant selector** where variants exist
6. **Delivery block** — reuse `components/home/pincode-check.tsx`, show the ETA and whether
   COD is available for that pincode
7. **Rx banner** — if `requires_prescription`, an unmissable band explaining a prescription is
   required, with an upload link. Do not hide this below the fold
8. **Add to cart / Buy now** — sticky bottom bar on mobile (both competitors do this; it is
   the single biggest mobile conversion lever)
9. **Trust row** — genuine products, batch & expiry on invoice, returns window. Pull copy from
   `SITE.promise`, do not invent new claims
10. **Substitutes / generic alternatives** ⭐ — **the highest-value feature on this page.**
    Same `salt_composition` and strength, sorted cheapest first, each showing per-unit price
    and **"X% cheaper"**. This is the main reason people use 1mg over a local chemist, and
    you already have `salt_composition` in the schema
11. **Product information accordions** — Uses · Benefits · Side effects · How to use · How it
    works · Safety advice · Storage · Missed dose. Use `<details>` like
    `components/faq-section.tsx` so content is in the initial HTML for crawlers and AI
    answer engines. **Render only the sections that have data.**
12. **Safety advice icon row** — alcohol / pregnancy / breastfeeding / driving / kidney /
    liver, each Safe / Caution / Unsafe. Needs a new column; source the values from the
    package insert, never guess them
13. **Ratings & reviews** — real rows from `medicine_reviews` only. Rating breakdown bar
    chart, "Verified purchase" badge driven by `is_verified_purchase`. If there are no
    reviews, show a write-a-review prompt, **not** an empty five-star widget
14. **Product FAQs** — per-medicine, with `faqJsonld()`
15. **Related / similar products** — horizontal scroll rail (`.no-scrollbar`)
16. **Manufacturer & marketer details** — legally expected on a pharmacy PDP
17. **Medical disclaimer** — already in the footer; repeat it inline here

**Structured data:** `productJsonld()` + `breadcrumbJsonld()` + `faqJsonld()` from
`lib/seo.ts`. Pass `aggregateRating` **only** when real reviews exist — `productJsonld`
already omits it when they don't. Do not defeat that.

#### 2.5 `/cart`

- Group line items **by pharmacy**, since each becomes its own order — say so explicitly so
  split deliveries aren't a surprise
- Quantity stepper with stock ceiling; disable "+" at `stock_quantity`
- Per-line savings, order summary from `calculateOrderTotals` in `lib/pricing.ts`
- **Free-delivery progress bar** — "Add ₹120 more for free delivery". `amountToFreeDelivery()`
  already exists
- Unavailable items in a separate "Not available" block with a Remove action — never silently
  drop them
- Rx items flagged in-cart, so the prescription requirement is known before checkout
- Sticky summary on desktop, sticky checkout bar on mobile
- Real empty state with a route back to `/medicines`

#### 2.6 `/checkout`

Logic is done — server-side pricing, prescription selector, and 409/422 handling are wired.
This is a **visual and flow pass only**:
- Collapse to a clear 3-step flow: Address → Prescription (only when needed) → Payment
- Saved-address picker (the `addresses` table exists; checkout currently only takes free text)
- Show the order summary at every step on mobile

#### 2.7 Cross-cutting

- **Loading:** add `loading.tsx` per route segment using `.skeleton`
- **Errors:** add `error.tsx` per segment and a designed `app/not-found.tsx` — there is
  currently no custom 404
- **Accessibility:** every image needs a real `alt` or `alt=""` if decorative; every icon
  button needs `aria-label`; forms need real `<label>`s; verify keyboard traversal of the
  filter drawer and mobile nav
- **Images:** `next/image` everywhere with correct `sizes`. Optimisation is now on — do not
  reintroduce `unoptimized`
- **Verify visually before claiming done.** Use the `browser-automation` skill or
  `mcp__Claude_Browser__*` to load each page at 360px and 1280px, check the console for
  errors, and confirm no horizontal scroll

### 3. Rebuild the three role dashboards

Build one shared dashboard shell (sidebar + topbar) and use it for all three roles.
`components/admin/admin-layout.tsx` exists but is admin-only and minimal.

Real workflow gaps to close, not just visual work:

- **Pharmacy:** order queue with working status transitions (`pending → confirmed →
  preparing → packed → out_for_delivery → delivered`), writing a row to
  `order_status_history` on every change. Low-stock and expiry alerts —
  `pharmacy_inventory.reorder_level` and the expiry index exist for this. Prescription
  verification queue.
- **Distributor:** incoming purchase requests, out-of-stock requests routed to them,
  inventory with bulk upload, settlement view.
- **Admin:** verification queues for pharmacies and distributors, order oversight, user
  management, platform settings. `platform_settings` already holds
  `free_delivery_threshold`, `delivery_charge`, `cod_enabled`, `support_email` — surface
  them in the settings UI instead of leaving the constants in `lib/pricing.ts` as the only
  source.

### 4. Audit all 45 pages and 69 API routes

For each route confirm:
- correct `requireRole` for the role that should reach it
- **ownership check** on every `[id]` route — this is where IDOR lives, and it has not been
  systematically verified
- input validated with zod (`lib/validation.ts`)
- `catch` ends with `handleApiError(error, scope)` — several routes still return
  `{ details: String(error) }`, which leaks SQL and stack traces to the browser
- no `console.log` of user data (there were ~79 `console.log` calls; many remain)
- every internal `<Link href>` resolves to a page that exists

Known remaining offenders using the old error pattern:
`app/api/admin/orders/[orderId]/route.ts`, `app/api/admin/users/[id]/route.ts`,
`app/api/pharmacy/orders/[orderId]/accept/route.ts`.

### 5. Finish the competitor-informed features

Schema for all of these already exists in migration 024:

- **Generic substitutes with savings** on the PDP — `medicines.salt_composition`
- **Order tracking timeline** — `order_status_history`
- **Wishlist page** at `/wishlist` — API is built (`app/api/wishlist/route.ts`), the page is not
- **Refill reminders** — `refill_reminders`
- **Notifications** — `notifications`
- **Tag medicines to health conditions** — `medicine_health_conditions` is empty, so
  `/health-conditions/[slug]` renders an empty state. Needs an admin UI to tag, or a seed
  script that maps by category/salt.
- **Serviceable pincodes** — `serviceable_pincodes` is empty; the check falls back to "is
  there a verified pharmacy in this pincode".

### 6. Database follow-ups

Migration 024 is the baseline. Still worth doing:

- **Consolidate the conflicting early migrations.** There are two `001`, two `015` and two
  `016` files, and the two `001`s define *different* `users` tables. Write a single
  `000-baseline.sql` reflecting current reality and archive the historical ones.
- **Add a migration runner.** Migrations are currently applied by hand, which is how the
  `audit_logs` table went missing for months. Even a simple `schema_migrations` table plus a
  `npm run migrate` script would prevent a repeat.
- **Backfill `order_items.medicine_name` / `hsn_code`** on write. The columns exist and are
  backfilled historically, but new inserts should populate them so a reprinted invoice
  survives a medicine being renamed.
- Consider partitioning or archiving `sessions` — it grows unbounded.

---

---

## Appendix A — competitor feature parity checklist

Researched from 1mg and Apollo Pharmacy directly. Ordered by impact on conversion. Tick as
you ship. Again: replicate the **pattern**, write your own copy and source your own drug data.

### Highest impact — do these first

| # | Feature | Seen on | Status | Notes |
|---|---|---|---|---|
| 1 | **Generic substitutes with % cheaper** | Both | ❌ | The single biggest reason people use these sites. `salt_composition` exists. |
| 2 | **Per-unit price** (`₹2.13 per tablet`) | Apollo | ❌ | Trivial to compute from `pack_size`; makes comparison honest. |
| 3 | **Sticky mobile add-to-cart bar** | Both | ❌ | Biggest single mobile conversion lever. |
| 4 | **Pincode delivery + ETA on PDP** | Both | 🟡 | Component built (`pincode-check.tsx`), not yet on the PDP. |
| 5 | **Prescription upload as a first-class path** | Both | 🟡 | On the homepage; needs to be a full guided flow with pharmacist quote + approve. |
| 6 | **Shop by health concern** | Both | 🟡 | Pages + 16 seeded conditions exist; `medicine_health_conditions` is **empty**, so they render empty. Needs tagging. |
| 7 | **Free-delivery progress bar** | Both | ❌ | `amountToFreeDelivery()` already written. |

### Medium impact

| # | Feature | Seen on | Status | Notes |
|---|---|---|---|---|
| 8 | Drug info accordions (uses, side effects, how it works, storage) | Both | ❌ | Columns exist from migration 024. Render only populated sections. |
| 9 | Safety advice icon row (alcohol / pregnancy / driving / kidney / liver) | 1mg | ❌ | Needs a new column. Source from package inserts — never guess. |
| 10 | Order tracking timeline | Both | ❌ | `order_status_history` exists and is written on order creation. |
| 11 | Ratings with breakdown bars + verified-purchase badge | Both | 🟡 | `medicine_reviews` has `is_verified_purchase`. Real data only. |
| 12 | Per-medicine FAQs with FAQPage schema | 1mg | 🟡 | `faqJsonld()` built; site-level FAQs live; per-product not done. |
| 13 | Wishlist / save for later | Both | 🟡 | API done (`app/api/wishlist/route.ts`), `/wishlist` page missing. |
| 14 | Filter drawer (bottom sheet) on mobile | Both | ❌ | See §2.3. |
| 15 | Reorder from past orders | Both | ❌ | High repeat-purchase value for chronic medication. |
| 16 | Refill reminders | 1mg | ❌ | `refill_reminders` table exists. |

### Lower priority / later

| # | Feature | Seen on | Status | Notes |
|---|---|---|---|---|
| 17 | Coupons & offer codes | Both | ❌ | Needs a `coupons` table — not in migration 024. |
| 18 | Health articles hub | Both | 🟡 | `/health-articles` exists; needs SEO treatment + Article schema. |
| 19 | Membership / care plan | Both | ❌ | Business decision before engineering. |
| 20 | Lab tests, doctor consult | Both | ❌ | Whole new verticals. Out of scope unless the business wants them. |
| 21 | Social proof ("23,549 bought recently") | 1mg | ❌ | **Only if you can compute it from real orders.** Otherwise skip — see ground rule 2. |

### Deliberately not copying

- Their editorial drug monographs and FAQ text — copyrighted, and written under a named
  pharmacist's editorial review that Davaa does not have
- Their product photography
- Their "user feedback" percentage widgets — those come from a survey panel Davaa doesn't have,
  and inventing the numbers breaks ground rule 2

---

## Before you report anything as done

```bash
npx tsc --noEmit      # must be 0 errors
npx next build        # must exit 0
```

For frontend work, also load the page in a browser at 360px and 1280px, confirm the console
is clean and the body does not scroll horizontally. A screenshot is not proof the page works —
check the console.

If you changed anything touching orders, prices or stock, state explicitly how you verified
that the server — not the client — determines the amount charged.
