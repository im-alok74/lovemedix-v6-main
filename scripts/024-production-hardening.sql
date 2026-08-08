-- 024 — Production hardening.
--
-- Idempotent. Safe to re-run. Run this BEFORE deploying the updated app: the new
-- checkout, invoice and dashboard code depends on the columns and tables added here.
--
-- Covers:
--   1. Order financials that were previously computed but never stored (tax, contact)
--   2. Order status history so "where is my order" has an actual audit trail
--   3. Per-medicine GST so invoices are legally correct
--   4. Normalised inventory MRP (013 created `mrp_price`, app code reads `mrp`)
--   5. Health-condition taxonomy + salt composition (1mg/Apollo-style browsing)
--   6. Wishlist, pincode serviceability, notifications, audit log
--   7. Missing constraints, indexes and updated_at triggers

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Users / roles
-- ---------------------------------------------------------------------------

-- scripts/001-init-tables.sql created a `users` table whose CHECK omits 'admin',
-- so on databases initialised from that file no admin can ever be inserted.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('customer', 'pharmacy', 'distributor', 'admin'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until      TIMESTAMPTZ;

-- Emails are case-insensitive in practice; stop 'A@x.com' and 'a@x.com' coexisting.
UPDATE users SET email = LOWER(email) WHERE email <> LOWER(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- ---------------------------------------------------------------------------
-- 2. Sessions
-- ---------------------------------------------------------------------------

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_agent  TEXT,
  ADD COLUMN IF NOT EXISTS ip_address  VARCHAR(64),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Every request joins sessions -> users on a live, unexpired token.
CREATE INDEX IF NOT EXISTS idx_sessions_token_active
  ON sessions (session_token, expires_at);

DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '30 days';

-- ---------------------------------------------------------------------------
-- 3. Medicines: GST, composition, and health conditions
-- ---------------------------------------------------------------------------

ALTER TABLE medicines
  ADD COLUMN IF NOT EXISTS gst_rate          DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS salt_composition  TEXT,
  ADD COLUMN IF NOT EXISTS uses              TEXT,
  ADD COLUMN IF NOT EXISTS how_to_use        TEXT,
  ADD COLUMN IF NOT EXISTS storage_info      TEXT,
  ADD COLUMN IF NOT EXISTS drug_schedule     VARCHAR(10),
  ADD COLUMN IF NOT EXISTS is_banned         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS slug              VARCHAR(280),
  ADD COLUMN IF NOT EXISTS search_keywords   TEXT;

-- Dosage forms. The original CHECK allowed only 8 values while the live catalogue
-- already contained 16, so bulk uploads were writing values the constraint would reject.
--
-- Two changes make this safe to apply to real data:
--   1. the list covers every form actually present, plus the common pharma forms
--   2. anything still unrecognised is normalised to 'other' *before* the constraint is
--      added, so this can never fail on a catalogue we have not seen
ALTER TABLE medicines DROP CONSTRAINT IF EXISTS medicines_form_check;

UPDATE medicines SET form = LOWER(TRIM(form)) WHERE form IS NOT NULL AND form <> LOWER(TRIM(form));

UPDATE medicines SET form = 'other'
WHERE form IS NOT NULL
  AND form NOT IN (
    'tablet', 'capsule', 'syrup', 'suspension', 'injection', 'infusion', 'cream',
    'ointment', 'gel', 'drops', 'inhaler', 'respule', 'powder', 'granules', 'sachet',
    'spray', 'patch', 'solution', 'lotion', 'soap', 'shampoo', 'device', 'kit',
    'bandage', 'suppository', 'pessary', 'mouthwash', 'oil', 'liquid', 'other'
  );

ALTER TABLE medicines ADD CONSTRAINT medicines_form_check
  CHECK (form IS NULL OR form IN (
    'tablet', 'capsule', 'syrup', 'suspension', 'injection', 'infusion', 'cream',
    'ointment', 'gel', 'drops', 'inhaler', 'respule', 'powder', 'granules', 'sachet',
    'spray', 'patch', 'solution', 'lotion', 'soap', 'shampoo', 'device', 'kit',
    'bandage', 'suppository', 'pessary', 'mouthwash', 'oil', 'liquid', 'other'
  ));

-- MRP must be a real price.
ALTER TABLE medicines DROP CONSTRAINT IF EXISTS medicines_mrp_positive;
ALTER TABLE medicines ADD CONSTRAINT medicines_mrp_positive CHECK (mrp >= 0);

-- SEO slugs: "dolo-650-tablet-1423". Stable, unique, and safe in a URL.
UPDATE medicines
SET slug = TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')) || '-' || id
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_medicines_slug ON medicines (slug);

-- Health-condition taxonomy: the "shop by concern" navigation 1mg and Apollo lead with.
CREATE TABLE IF NOT EXISTS health_conditions (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(120) NOT NULL UNIQUE,
  slug         VARCHAR(140) NOT NULL UNIQUE,
  description  TEXT,
  icon         VARCHAR(60),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicine_health_conditions (
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  condition_id INTEGER NOT NULL REFERENCES health_conditions(id) ON DELETE CASCADE,
  PRIMARY KEY (medicine_id, condition_id)
);

CREATE INDEX IF NOT EXISTS idx_mhc_condition ON medicine_health_conditions (condition_id);

INSERT INTO health_conditions (name, slug, description, icon, display_order) VALUES
  ('Diabetes Care',    'diabetes-care',    'Blood sugar monitoring, insulin and oral antidiabetics', 'Droplet',   1),
  ('Heart Care',       'heart-care',       'Blood pressure, cholesterol and cardiac support',        'HeartPulse', 2),
  ('Stomach Care',     'stomach-care',     'Acidity, indigestion, constipation and gut health',      'Soup',      3),
  ('Pain Relief',      'pain-relief',      'Analgesics, balms and anti-inflammatory medicines',      'Bandage',   4),
  ('Cold & Immunity',  'cold-immunity',    'Cough, cold, fever and immunity boosters',               'Thermometer', 5),
  ('Liver Care',       'liver-care',       'Liver support and hepatoprotective medicines',           'Activity',  6),
  ('Respiratory Care', 'respiratory-care', 'Asthma, inhalers, nebulisers and breathing support',     'Wind',      7),
  ('Skin Care',        'skin-care',        'Dermatology, antifungals and medicated skincare',        'Sparkles',  8),
  ('Bone & Joint',     'bone-joint-care',  'Calcium, arthritis and joint mobility support',          'Bone',      9),
  ('Kidney Care',      'kidney-care',      'Renal support and electrolyte balance',                  'Filter',   10),
  ('Eye Care',         'eye-care',         'Eye drops, lubricants and vision support',               'Eye',      11),
  ('Women''s Health',  'womens-health',    'Prenatal, menstrual and hormonal health',                'Flower2',  12),
  ('Baby Care',        'baby-care',        'Infant nutrition, diapers and paediatric care',          'Baby',     13),
  ('Elderly Care',     'elderly-care',     'Mobility aids, supplements and geriatric support',       'Accessibility', 14),
  ('Sexual Wellness',  'sexual-wellness',  'Contraceptives and intimate wellness',                   'Heart',    15),
  ('Mental Wellness',  'mental-wellness',  'Sleep, stress and mood support',                         'Brain',    16)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Pharmacy inventory
-- ---------------------------------------------------------------------------

-- 013 added `mrp_price`, but the application reads `pharmacy_inventory.mrp`. The old
-- checkout code wrapped that read in a try/catch, so batch details silently never
-- reached order_items. Standardise on `mrp` and backfill.
ALTER TABLE pharmacy_inventory
  ADD COLUMN IF NOT EXISTS mrp             DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS mfg_date        DATE,
  ADD COLUMN IF NOT EXISTS reorder_level   INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE pharmacy_inventory SET mrp = mrp_price WHERE mrp IS NULL AND mrp_price IS NOT NULL;

ALTER TABLE pharmacy_inventory DROP CONSTRAINT IF EXISTS pharmacy_inventory_stock_non_negative;
ALTER TABLE pharmacy_inventory ADD CONSTRAINT pharmacy_inventory_stock_non_negative
  CHECK (stock_quantity >= 0);

ALTER TABLE pharmacy_inventory DROP CONSTRAINT IF EXISTS pharmacy_inventory_price_positive;
ALTER TABLE pharmacy_inventory ADD CONSTRAINT pharmacy_inventory_price_positive
  CHECK (selling_price >= 0 AND discount_percentage >= 0 AND discount_percentage <= 100);

-- Checkout picks the cheapest in-stock, unexpired offer per medicine on every request.
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_offer
  ON pharmacy_inventory (medicine_id, selling_price)
  WHERE stock_quantity > 0;

-- Powers the low-stock dashboard widget.
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_low_stock
  ON pharmacy_inventory (pharmacy_id, stock_quantity);

CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry
  ON pharmacy_inventory (expiry_date)
  WHERE expiry_date IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Orders
-- ---------------------------------------------------------------------------

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tax_amount        DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_name      VARCHAR(150),
  ADD COLUMN IF NOT EXISTS contact_phone     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS packed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS delivery_partner  VARCHAR(120),
  ADD COLUMN IF NOT EXISTS tracking_number   VARCHAR(120),
  ADD COLUMN IF NOT EXISTS invoice_number    VARCHAR(60),
  ADD COLUMN IF NOT EXISTS notes             TEXT;

-- 'packed' and 'ready_for_pickup' are real states the pharmacy dashboard needs.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN (
    'pending', 'confirmed', 'preparing', 'packed', 'ready_for_pickup',
    'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'
  ));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod', 'online', 'wallet', 'upi', 'card', 'netbanking'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_totals_non_negative;
ALTER TABLE orders ADD CONSTRAINT orders_totals_non_negative
  CHECK (subtotal >= 0 AND total_amount >= 0 AND delivery_charge >= 0 AND tax_amount >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_invoice_number
  ON orders (invoice_number) WHERE invoice_number IS NOT NULL;

-- The customer's "my orders" list and the pharmacy queue are the two hottest reads.
CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_status_created
  ON orders (pharmacy_id, order_status, created_at DESC);

-- Audit trail. Every status change gets a row, so order tracking is derived, not guessed.
CREATE TABLE IF NOT EXISTS order_status_history (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     VARCHAR(30) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON order_status_history (order_id, created_at DESC);

-- Backfill history for orders that predate this table so tracking isn't blank.
INSERT INTO order_status_history (order_id, status, note, created_at)
SELECT o.id, o.order_status, 'Backfilled from order record', o.created_at
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id);

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mfg_date     DATE,
  ADD COLUMN IF NOT EXISTS expiry_date  DATE,
  ADD COLUMN IF NOT EXISTS mrp          DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS gst_rate     DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  -- Denormalised so an invoice reprinted in 2030 still shows what was actually sold,
  -- even if the medicine has since been renamed or delisted.
  ADD COLUMN IF NOT EXISTS medicine_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hsn_code      VARCHAR(20);

UPDATE order_items oi
SET medicine_name = m.name
FROM medicines m
WHERE m.id = oi.medicine_id AND oi.medicine_name IS NULL;

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_quantity_positive;
ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- ---------------------------------------------------------------------------
-- 6. Payments — a real ledger instead of a single payment_status enum
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
  id                SERIAL PRIMARY KEY,
  order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount            DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency          VARCHAR(3) NOT NULL DEFAULT 'INR',
  method            VARCHAR(20) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')),
  gateway           VARCHAR(40),
  gateway_payment_id VARCHAR(160),
  gateway_order_id  VARCHAR(160),
  -- Lets a retried webhook be recognised instead of double-crediting an order.
  idempotency_key   VARCHAR(120) UNIQUE,
  failure_reason    TEXT,
  refunded_amount   DECIMAL(10, 2) NOT NULL DEFAULT 0,
  raw_response      JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_gateway_payment
  ON payments (gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 7. Customer engagement: wishlist, refill reminders, notifications
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wishlist_items (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, medicine_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items (user_id);

CREATE TABLE IF NOT EXISTS refill_reminders (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medicine_id   INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  interval_days INTEGER NOT NULL DEFAULT 30 CHECK (interval_days > 0),
  next_due_on   DATE NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_notified_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, medicine_id)
);

CREATE INDEX IF NOT EXISTS idx_refill_due ON refill_reminders (next_due_on) WHERE is_active;

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(40) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  link       VARCHAR(300),
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

-- ---------------------------------------------------------------------------
-- 8. Serviceability — "do you deliver to my pincode?"
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS serviceable_pincodes (
  id                  SERIAL PRIMARY KEY,
  pincode             VARCHAR(10) NOT NULL UNIQUE,
  city                VARCHAR(100),
  state               VARCHAR(100),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  estimated_hours_min INTEGER NOT NULL DEFAULT 2,
  estimated_hours_max INTEGER NOT NULL DEFAULT 24,
  cod_available       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_serviceable_pincode ON serviceable_pincodes (pincode) WHERE is_active;

-- ---------------------------------------------------------------------------
-- 9. Audit log — who changed what, for verification and money actions
-- ---------------------------------------------------------------------------

-- Named `audit_logs` (plural) because five existing routes already INSERT into that
-- name — the out-of-stock assign/cancel/fulfill flows among them. No migration ever
-- created it, so every one of those writes was throwing and 500ing the request.
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_role  VARCHAR(20),
  action      VARCHAR(80) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id   VARCHAR(60),
  -- `details` is what the existing callers write; before/after are for new code.
  details     JSONB,
  before_data JSONB,
  after_data  JSONB,
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_logs (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 10. Reviews — the storefront shows a rating, so it needs a real source
-- ---------------------------------------------------------------------------

-- `medicine_reviews` already exists (migration 018) with `user_id` as the reviewer
-- reference and no moderation status. CREATE TABLE IF NOT EXISTS would silently no-op
-- and leave the columns the storefront reads missing — which is exactly why the product
-- grid was failing with "column mr.status does not exist".
CREATE TABLE IF NOT EXISTS medicine_reviews (
  id           SERIAL PRIMARY KEY,
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title        VARCHAR(160),
  review_text  TEXT NOT NULL,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bring an existing table up to the shape the application expects.
ALTER TABLE medicine_reviews
  ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status   VARCHAR(20) NOT NULL DEFAULT 'published';

ALTER TABLE medicine_reviews DROP CONSTRAINT IF EXISTS medicine_reviews_status_check;
ALTER TABLE medicine_reviews ADD CONSTRAINT medicine_reviews_status_check
  CHECK (status IN ('published', 'pending', 'rejected'));

-- One review per customer per medicine.
CREATE UNIQUE INDEX IF NOT EXISTS idx_medicine_reviews_unique
  ON medicine_reviews (medicine_id, user_id);

CREATE INDEX IF NOT EXISTS idx_medicine_reviews_medicine
  ON medicine_reviews (medicine_id) WHERE status = 'published';

-- ---------------------------------------------------------------------------
-- 11. Profiles: verification metadata the admin queue needs
-- ---------------------------------------------------------------------------

ALTER TABLE pharmacy_profiles
  ADD COLUMN IF NOT EXISTS verification_notes  TEXT,
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS license_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS drug_license_url    TEXT,
  ADD COLUMN IF NOT EXISTS logo_url            TEXT,
  ADD COLUMN IF NOT EXISTS rating              DECIMAL(3, 2),
  ADD COLUMN IF NOT EXISTS is_accepting_orders BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- One profile per user, in both directions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pharmacy_profiles_user ON pharmacy_profiles (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_distributor_profiles_user ON distributor_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_pharmacy_profiles_verified
  ON pharmacy_profiles (verification_status) WHERE verification_status = 'verified';

-- ---------------------------------------------------------------------------
-- 12. Prescriptions
-- ---------------------------------------------------------------------------

ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS expires_on   DATE,
  ADD COLUMN IF NOT EXISTS patient_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS pharmacy_id  INTEGER REFERENCES pharmacy_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prescriptions_customer
  ON prescriptions (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pending
  ON prescriptions (status, created_at DESC) WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- 13. updated_at triggers — stop relying on every code path remembering
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'medicines', 'orders', 'payments',
    'pharmacy_profiles', 'distributor_profiles'
  ] LOOP
    -- Only attach where an updated_at column actually exists.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = t AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 14. Platform settings used by the new UI
-- ---------------------------------------------------------------------------

INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
  ('free_delivery_threshold', '500',  'Order subtotal (INR) at or above which delivery is free'),
  ('delivery_charge',         '40',   'Flat delivery charge (INR) below the free-delivery threshold'),
  ('default_gst_rate',        '5',    'Fallback GST %% when a medicine has no explicit rate'),
  ('support_email',           'support@davaa.in', 'Contact email shown on invoices and the footer'),
  ('support_phone',           '+91 9508178521',   'Contact phone shown on invoices and the footer'),
  ('cod_enabled',             'true', 'Whether cash on delivery is offered at checkout')
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;
