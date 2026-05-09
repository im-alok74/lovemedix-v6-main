#!/usr/bin/env node

/**
 * Standalone Seed Script - No external dependencies
 * This script seeds the medicines database directly using the Neon client
 */

const fs = require("fs");
const path = require("path");

// Load environment from .env file
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env file not found at", envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");

  for (const line of lines) {
    if (line.trim() && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}

// Load environment first
loadEnv();

const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL not found in environment");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL.trim();
console.log("Connecting to database...");

const sql = neon(connectionString);

async function seedMedicines() {
  try {
    console.log("Loading medicines data...");
    const medicinesPath = path.join(__dirname, "medicines-data.json");
    if (!fs.existsSync(medicinesPath)) {
      console.error("Error: medicines-data.json not found");
      process.exit(1);
    }

    const medicinesData = JSON.parse(fs.readFileSync(medicinesPath, "utf-8"));
    console.log(`Loaded ${medicinesData.length} medicines\n`);

    // Apply database migrations
    console.log("Step 1: Applying database migrations...");
    try {
      await sql`
        ALTER TABLE medicines
        ADD COLUMN IF NOT EXISTS uses TEXT,
        ADD COLUMN IF NOT EXISTS side_effects TEXT,
        ADD COLUMN IF NOT EXISTS precautions TEXT,
        ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0
      `;
      console.log("✓ Updated medicines table");

      await sql`CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines(generic_name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_medicines_source ON medicines(source)`;
      console.log("✓ Created indexes");

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
      console.log("✓ Created medicine_bulk_uploads table\n");
    } catch (migrationError) {
      console.log("ℹ Database migration info:", migrationError.message.substring(0, 100));
      console.log("(This is normal if columns/tables already exist)\n");
    }

    // Seed medicines
    console.log("Step 2: Seeding medicines into database...");
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let index = 0; index < medicinesData.length; index++) {
      const medicine = medicinesData[index];

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
          skipCount++;
          if ((index + 1) % 100 === 0) {
            process.stdout.write(`\rProgress: ${index + 1}/${medicinesData.length} (Added: ${successCount}, Skipped: ${skipCount})`);
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

        if ((index + 1) % 100 === 0) {
          process.stdout.write(`\rProgress: ${index + 1}/${medicinesData.length} (Added: ${successCount}, Skipped: ${skipCount})`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`\n✗ Error adding ${medicine.name}:`, error.message.substring(0, 100));
        }
      }
    }

    console.log(`\n\n${"=".repeat(70)}`);
    console.log(`SEEDING COMPLETE!`);
    console.log(`${"=".repeat(70)}`);
    console.log(`✓ Successfully added: ${successCount} medicines`);
    console.log(`↻ Skipped (already exist): ${skipCount} medicines`);
    console.log(`✗ Errors: ${errorCount} medicines`);
    console.log(`${"=".repeat(70)}\n`);

    process.exit(successCount > 0 ? 0 : 1);
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
}

seedMedicines();
