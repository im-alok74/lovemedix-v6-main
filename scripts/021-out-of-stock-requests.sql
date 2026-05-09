-- Create out-of-stock request table
CREATE TABLE IF NOT EXISTS medicine_out_of_stock_requests (
  id SERIAL PRIMARY KEY,
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacy_profiles(id) ON DELETE CASCADE,
  distributor_id INTEGER NOT NULL REFERENCES distributor_profiles(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  distributor_medicine_id INTEGER NOT NULL REFERENCES distributor_medicines(id) ON DELETE CASCADE,
  requested_quantity INTEGER NOT NULL DEFAULT 1,
  mrp DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, fulfilled, rejected, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_out_of_stock_requests_pharmacy ON medicine_out_of_stock_requests(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_out_of_stock_requests_distributor ON medicine_out_of_stock_requests(distributor_id);
CREATE INDEX IF NOT EXISTS idx_out_of_stock_requests_medicine ON medicine_out_of_stock_requests(medicine_id);
CREATE INDEX IF NOT EXISTS idx_out_of_stock_requests_status ON medicine_out_of_stock_requests(status);
