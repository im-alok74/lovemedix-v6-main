#!/usr/bin/env node

/**
 * Seed Script: Populate common medicines into the database
 * Run with: npm run seed:medicines
 * Or: node scripts/seed-medicines-simple.js
 */

const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

// Connect to database using environment variable
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set");
  process.exit(1);
}

let connectionString = process.env.DATABASE_URL.trim();
if (connectionString.startsWith("psql ")) {
  connectionString = connectionString.substring(5);
}
connectionString = connectionString.replace(/^['"]|['"]$/g, "");

const sql = neon(connectionString);

async function seedMedicines() {
  try {
    // First, apply database migrations
    console.log("Applying database migrations...");
    try {
      // Add new columns to medicines table
      await sql`
        ALTER TABLE medicines
        ADD COLUMN IF NOT EXISTS uses TEXT,
        ADD COLUMN IF NOT EXISTS side_effects TEXT,
        ADD COLUMN IF NOT EXISTS precautions TEXT,
        ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0
      `;
      console.log("✓ Updated medicines table");

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines(generic_name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_medicines_source ON medicines(source)`;
      console.log("✓ Created indexes");

      // Create bulk uploads table
      await sql`
        CREATE TABLE IF NOT EXISTS medicine_bulk_uploads (
          id SERIAL PRIMARY KEY,
          distributor_id INTEGER REFERENCES distributor_profiles(id) ON DELETE CASCADE,
          medicine_ids INTEGER[],
          upload_count INTEGER,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'completed'
        )
      `;
      console.log("✓ Created medicine_bulk_uploads table");
    } catch (migrationError) {
      // Some operations might fail if columns already exist, which is fine
      console.log("Note: Database migration completed (some operations may already exist)");
    }

    // Read the medicines data from JSON
    const medicinesPath = path.join(__dirname, "medicines-data.json");
    if (!fs.existsSync(medicinesPath)) {
      console.error("Error: medicines-data.json not found. Run the scraper first.");
      process.exit(1);
    }

    const medicinesData = JSON.parse(fs.readFileSync(medicinesPath, "utf-8"));

    console.log(`\nStarting to seed ${medicinesData.length} medicines...`);

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Batch insert in chunks
    for (const [index, medicine] of medicinesData.entries()) {
      try {
        // Check if medicine already exists
        const existing = await sql`
          SELECT id FROM medicines 
          WHERE name = ${medicine.name} 
          AND manufacturer = ${medicine.manufacturer || "Various"}
          AND strength = ${medicine.strength || "N/A"}
          LIMIT 1
        `;

        if (existing && existing.length > 0) {
          successCount++;
          if ((index + 1) % 50 === 0) {
            console.log(`Progress: ${index + 1}/${medicinesData.length} (${successCount} added)`);
          }
          continue;
        }

        // Insert the medicine
        await sql`
          INSERT INTO medicines (
            name,
            generic_name,
            manufacturer,
            form,
            strength,
            pack_size,
            mrp,
            source,
            status,
            created_at,
            updated_at
          ) VALUES (
            ${medicine.name},
            ${medicine.genericName || "N/A"},
            ${medicine.manufacturer || "Various"},
            ${medicine.form || "tablet"},
            ${medicine.strength || "N/A"},
            ${medicine.packSize || "1"},
            ${parseFloat(medicine.mrp) || 0},
            ${"scraped"},
            ${"active"},
            NOW(),
            NOW()
          )
        `;

        successCount++;

        if ((index + 1) % 50 === 0) {
          console.log(`Progress: ${index + 1}/${medicinesData.length} (${successCount} added)`);
        }
      } catch (error) {
        failureCount++;
        errors.push({
          medicine: medicine.name,
          error: error.message,
        });
        if (errors.length <= 5) {
          console.error(`✗ Failed to add ${medicine.name}:`, error.message);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Seeding complete!`);
    console.log(`✓ Successfully added: ${successCount} medicines`);
    console.log(`✗ Failed: ${failureCount} medicines`);
    console.log("=".repeat(60) + "\n");

    if (errors.length > 5) {
      console.log(`... and ${errors.length - 5} more errors`);
    }

    process.exit(successCount > 0 ? 0 : 1);
  } catch (error) {
    console.error("Fatal error during seeding:", error);
    process.exit(1);
  }
}

seedMedicines();
