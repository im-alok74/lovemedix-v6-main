-- Migration to seed common medicines from 1mg website
-- This table will contain the master list of available medicines
-- Distributors and pharmacies can reference these medicines

-- First, let's ensure we have the core medicines table structure
-- (This is likely already created, but we'll ensure it has the right columns)

ALTER TABLE medicines
ADD COLUMN IF NOT EXISTS uses TEXT,
ADD COLUMN IF NOT EXISTS side_effects TEXT,
ADD COLUMN IF NOT EXISTS precautions TEXT,
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual', -- 'scraped' or 'manual'
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_source ON medicines(source);

-- Insert the common medicines data
-- This is automatically populated by the seed script
-- The data comes from scrape-1mg-medicines.js

-- Table to track bulk uploads (optional, for audit trail)
CREATE TABLE IF NOT EXISTS medicine_bulk_uploads (
  id SERIAL PRIMARY KEY,
  distributor_id INTEGER REFERENCES distributor_profiles(id) ON DELETE CASCADE,
  medicine_ids INTEGER[],
  upload_count INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'completed' -- 'pending', 'completed', 'failed'
);

CREATE INDEX IF NOT EXISTS idx_medicine_bulk_uploads_distributor ON medicine_bulk_uploads(distributor_id);
