-- ===========================================================================
-- 026 — Doctors: online consultation and clinic appointments
-- ===========================================================================
--
-- Davaa's second half. Medicines answer "I know what I need"; doctors answer "I don't".
-- The storefront ships with these tables empty, and every doctor surface is written to
-- render an honest empty state rather than placeholder profiles — a fabricated doctor on
-- a healthcare site is not a design shortcut, it is a safety problem.
--
-- Idempotent and additive: safe to run on a database that already has 001–025 applied,
-- and safe to run twice.
--
--   psql "$DATABASE_URL" -f scripts/026-doctors.sql
--
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Doctors
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS doctors (
  id                  SERIAL PRIMARY KEY,
  -- Set once a doctor has a sign-in of their own; profiles can be created by an admin
  -- before that account exists, so it is nullable.
  user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,

  full_name           VARCHAR(160) NOT NULL,
  slug                VARCHAR(200) UNIQUE,
  specialization      VARCHAR(120) NOT NULL,
  qualifications      VARCHAR(200),
  bio                 TEXT,
  photo_url           TEXT,
  gender              VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  experience_years    INTEGER CHECK (experience_years >= 0 AND experience_years <= 80),
  -- e.g. {English,Hindi,Bhojpuri}. Matters more here than on a metro platform.
  languages           TEXT[],

  -- Medical council registration. This is what "verified" is checked against, and it is
  -- the reason a doctor may not be listed publicly until an admin has seen it.
  registration_number VARCHAR(100),
  registration_council VARCHAR(140),

  clinic_name         VARCHAR(200),
  clinic_address      TEXT,
  city                VARCHAR(100),
  state               VARCHAR(100),
  pincode             VARCHAR(10),
  latitude            DECIMAL(10, 8),
  longitude           DECIMAL(11, 8),

  -- Two independent modes. A doctor may offer either, both, or neither while paused.
  offers_online       BOOLEAN NOT NULL DEFAULT FALSE,
  offers_clinic       BOOLEAN NOT NULL DEFAULT FALSE,
  consultation_fee_online DECIMAL(10, 2),
  consultation_fee_clinic DECIMAL(10, 2),

  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at         TIMESTAMPTZ,
  verified_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  -- Lets a verified doctor stop taking new patients without being delisted.
  is_accepting        BOOLEAN NOT NULL DEFAULT TRUE,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The storefront only ever lists verified doctors who are accepting patients, so that is
-- the shape of the index.
CREATE INDEX IF NOT EXISTS idx_doctors_public
  ON doctors (specialization, city)
  WHERE verification_status = 'verified' AND is_accepting;

CREATE INDEX IF NOT EXISTS idx_doctors_city ON doctors (lower(city));
CREATE INDEX IF NOT EXISTS idx_doctors_slug ON doctors (slug);

-- ---------------------------------------------------------------------------
-- 2. Weekly availability
-- ---------------------------------------------------------------------------
--
-- Recurring weekly slots rather than materialised dates: a doctor sets "Mon 10:00–13:00,
-- online" once, and bookable times are derived from it. Storing every future date would
-- mean a job to keep extending the calendar forever.

CREATE TABLE IF NOT EXISTS doctor_availability (
  id          SERIAL PRIMARY KEY,
  doctor_id   INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  -- 0 = Sunday, matching Postgres EXTRACT(DOW) and JavaScript getDay().
  weekday     SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  mode        VARCHAR(10) NOT NULL CHECK (mode IN ('online', 'clinic')),
  slot_minutes SMALLINT NOT NULL DEFAULT 15 CHECK (slot_minutes BETWEEN 5 AND 120),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT doctor_availability_window CHECK (end_time > start_time),
  UNIQUE (doctor_id, weekday, start_time, mode)
);

CREATE INDEX IF NOT EXISTS idx_doctor_availability
  ON doctor_availability (doctor_id, weekday) WHERE is_active;

-- ---------------------------------------------------------------------------
-- 3. Appointments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS doctor_appointments (
  id            SERIAL PRIMARY KEY,
  doctor_id     INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  patient_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  mode          VARCHAR(10) NOT NULL CHECK (mode IN ('online', 'clinic')),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration_minutes SMALLINT NOT NULL DEFAULT 15,

  status        VARCHAR(20) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'no_show')),
  -- What the patient wants to discuss. Clinical notes do NOT belong here; this table is
  -- readable by scheduling code and must not become a medical record.
  reason        TEXT,

  fee_amount    DECIMAL(10, 2),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),

  cancelled_at  TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One doctor cannot be in two places at one instant. Enforced in the database rather
-- than only in application code, because double-booking is the failure people remember.
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_appointment_slot
  ON doctor_appointments (doctor_id, scheduled_at)
  WHERE status IN ('requested', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON doctor_appointments (patient_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_upcoming
  ON doctor_appointments (doctor_id, scheduled_at)
  WHERE status IN ('requested', 'confirmed');

-- ---------------------------------------------------------------------------
-- 4. Specialisations reference list
-- ---------------------------------------------------------------------------
--
-- Seeded because these are labels, not claims about coverage. The doctor list only ever
-- shows a specialisation that has at least one verified doctor behind it, so seeding
-- this table cannot make the marketplace look fuller than it is.

CREATE TABLE IF NOT EXISTS doctor_specializations (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL UNIQUE,
  slug          VARCHAR(140) NOT NULL UNIQUE,
  description   VARCHAR(300),
  display_order INTEGER NOT NULL DEFAULT 100,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO doctor_specializations (name, slug, description, display_order) VALUES
  ('General Physician', 'general-physician', 'Fever, infections, everyday illness and first advice.', 10),
  ('Dermatologist',     'dermatologist',     'Skin, hair and nail concerns.', 20),
  ('Pediatrician',      'pediatrician',      'Health and development of babies and children.', 30),
  ('Gynecologist',      'gynecologist',      'Women''s reproductive and pregnancy care.', 40),
  ('Orthopedic',        'orthopedic',        'Bones, joints, injuries and mobility.', 50),
  ('ENT Specialist',    'ent-specialist',    'Ear, nose and throat conditions.', 60),
  ('Dentist',           'dentist',           'Teeth, gums and oral health.', 70),
  ('Cardiologist',      'cardiologist',      'Heart and blood pressure conditions.', 80),
  ('Diabetologist',     'diabetologist',     'Diabetes management and monitoring.', 90),
  ('Psychiatrist',      'psychiatrist',      'Mental health, sleep and mood concerns.', 100)
ON CONFLICT (slug) DO NOTHING;
