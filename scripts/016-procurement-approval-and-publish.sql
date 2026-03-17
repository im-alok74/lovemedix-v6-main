-- Procurement workflow updates:
-- - Tie request to single distributor
-- - Allow approval by either admin or distributor
-- - Distributor collects COD payment
-- - Pharmacy publishes PAID stock to website (pharmacy_inventory) later

ALTER TABLE purchase_requests
ADD COLUMN IF NOT EXISTS distributor_id INTEGER REFERENCES distributor_profiles(id),
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(20)
  CHECK (approved_by IN ('admin', 'distributor')),
ADD COLUMN IF NOT EXISTS payment_collected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS published_to_store_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_purchase_requests_distributor
  ON purchase_requests(distributor_id);

