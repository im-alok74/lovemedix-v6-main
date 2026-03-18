-- Multiple images per medicine

CREATE TABLE IF NOT EXISTS medicine_images (
  id SERIAL PRIMARY KEY,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  source VARCHAR(20) DEFAULT 'distributor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicine_images_medicine
  ON medicine_images(medicine_id);

