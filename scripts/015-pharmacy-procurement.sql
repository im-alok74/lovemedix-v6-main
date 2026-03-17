-- Distributor inventory locking + pharmacy procurement

-- Add reserved_quantity to distributor_medicines to support stock locking
ALTER TABLE distributor_medicines
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;

-- Ensure no NULLs in existing data
UPDATE distributor_medicines
SET reserved_quantity = 0
WHERE reserved_quantity IS NULL;

-- Purchase requests from pharmacies to distributors
CREATE TABLE IF NOT EXISTS purchase_requests (
  id SERIAL PRIMARY KEY,
  pharmacy_id INTEGER REFERENCES pharmacy_profiles(id) ON DELETE CASCADE,
  -- Overall status of the request lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'EXPIRED')),
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Items within a purchase request, each linked to a distributor batch
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES purchase_requests(id) ON DELETE CASCADE,
  distributor_medicine_id INTEGER REFERENCES distributor_medicines(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  line_total DECIMAL(12, 2) NOT NULL,
  -- Snapshot fields for audit
  medicine_id INTEGER REFERENCES medicines(id),
  pharmacy_id INTEGER REFERENCES pharmacy_profiles(id),
  distributor_id INTEGER REFERENCES distributor_profiles(id),
  batch_number VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice per purchase request (admin-generated, offline payment)
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id SERIAL PRIMARY KEY,
  request_id INTEGER UNIQUE REFERENCES purchase_requests(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED_UNPAID'
    CHECK (payment_status IN ('APPROVED_UNPAID', 'PAID', 'CANCELLED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_purchase_requests_pharmacy
  ON purchase_requests(pharmacy_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_status
  ON purchase_requests(status);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_expires_at
  ON purchase_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_purchase_items_request
  ON purchase_items(request_id);

CREATE INDEX IF NOT EXISTS idx_purchase_items_distributor_medicine
  ON purchase_items(distributor_medicine_id);

