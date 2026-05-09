-- High-scale medicine master search support + distributor bulk upload audit

-- Enable trigram similarity search for large medicine catalogs
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fast fuzzy/exact search across medicine identity fields
CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm
  ON medicines USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_generic_name_trgm
  ON medicines USING GIN (generic_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_manufacturer_trgm
  ON medicines USING GIN (manufacturer gin_trgm_ops);

-- Full text search index for broad search queries
CREATE INDEX IF NOT EXISTS idx_medicines_search_tsv
  ON medicines
  USING GIN (
    to_tsvector(
      'simple',
      COALESCE(name, '') || ' ' ||
      COALESCE(generic_name, '') || ' ' ||
      COALESCE(manufacturer, '') || ' ' ||
      COALESCE(strength, '') || ' ' ||
      COALESCE(form, '')
    )
  );

-- Helpful supporting indexes for filtering + ordering
CREATE INDEX IF NOT EXISTS idx_medicines_status_form
  ON medicines (status, form);

CREATE INDEX IF NOT EXISTS idx_medicines_status_name
  ON medicines (status, name);

-- Audit table for distributor bulk uploads from file and catalog actions
CREATE TABLE IF NOT EXISTS medicine_bulk_uploads (
  id SERIAL PRIMARY KEY,
  distributor_id INTEGER NOT NULL REFERENCES distributor_profiles(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL DEFAULT 'catalog' CHECK (source IN ('catalog', 'csv', 'xlsx')),
  file_name VARCHAR(255),
  medicine_ids JSONB,
  upload_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'failed')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE medicine_bulk_uploads
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'catalog';

ALTER TABLE medicine_bulk_uploads
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);

ALTER TABLE medicine_bulk_uploads
  ADD COLUMN IF NOT EXISTS failure_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE medicine_bulk_uploads
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_medicine_bulk_uploads_distributor
  ON medicine_bulk_uploads(distributor_id, created_at DESC);
