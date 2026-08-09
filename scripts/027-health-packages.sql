-- ===========================================================================
-- 027 — Health check-up packages (diagnostics)
-- ===========================================================================
--
-- Lab test packages, the "Health Checkups" shelf. Additive and idempotent; safe on a
-- database that already has 001–026, and safe to run twice.
--
-- The table ships EMPTY on purpose. Davaa has no diagnostics partner yet, and a homepage
-- advertising a "Comprehensive Full Body Checkup — ₹2499, 50% off" that nobody can
-- actually book is not a design placeholder, it is a false offer on a healthcare site.
-- The storefront section reads from this table and renders nothing while it is empty, so
-- the shelf appears the day a real lab is signed and rows are inserted — and not before.
--
--   psql "$DATABASE_URL" -f scripts/027-health-packages.sql
--
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS diagnostic_labs (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(160) NOT NULL,
  slug                VARCHAR(180) UNIQUE,
  -- NABL / ICMR registration. This is what "verified" is checked against, and the reason
  -- a lab cannot be listed publicly before an admin has seen it.
  accreditation       VARCHAR(120),
  registration_number VARCHAR(120),
  city                VARCHAR(100),
  state               VARCHAR(100),
  pincode             VARCHAR(10),
  latitude            DECIMAL(10, 8),
  longitude           DECIMAL(11, 8),
  home_collection     BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_labs_public
  ON diagnostic_labs (city) WHERE verification_status = 'verified';

CREATE TABLE IF NOT EXISTS health_packages (
  id              SERIAL PRIMARY KEY,
  lab_id          INTEGER NOT NULL REFERENCES diagnostic_labs(id) ON DELETE CASCADE,

  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(220) UNIQUE,
  description     TEXT,
  -- How many individual parameters the panel covers. Shown as "88 tests included";
  -- nullable, because a package with an unknown count shows no count rather than a guess.
  test_count      INTEGER CHECK (test_count > 0),
  -- Free text, e.g. '10-12 hours fasting required'. Null means no preparation needed.
  preparation     VARCHAR(200),
  report_hours    INTEGER CHECK (report_hours > 0),
  home_collection BOOLEAN NOT NULL DEFAULT FALSE,

  -- Two prices so a discount can be shown honestly. `mrp` is the lab's listed rate and
  -- `price` is what the customer pays; the storefront computes the percentage rather
  -- than storing one, so a stale "50% off" can never outlive the price behind it.
  mrp             DECIMAL(10, 2) NOT NULL CHECK (mrp > 0),
  price           DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  CONSTRAINT health_packages_price_not_above_mrp CHECK (price <= mrp),

  image_url       TEXT,
  display_order   INTEGER NOT NULL DEFAULT 100,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_packages_active
  ON health_packages (display_order, price) WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_health_packages_lab ON health_packages (lab_id);

-- Deliberately no seed data. See the note at the top of this file.
