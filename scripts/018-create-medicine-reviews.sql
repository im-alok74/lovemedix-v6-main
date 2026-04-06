-- Medicine review support for PDP

CREATE TABLE IF NOT EXISTS medicine_reviews (
  id SERIAL PRIMARY KEY,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT NOT NULL,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicine_reviews_medicine
  ON medicine_reviews(medicine_id);

CREATE INDEX IF NOT EXISTS idx_medicine_reviews_user
  ON medicine_reviews(user_id);
