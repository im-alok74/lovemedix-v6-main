import { sql } from "@/lib/db"
import medicinesData from "./medicines-data.json" assert { type: "json" }

/**
 * Seed Script: Populate common medicines into the database
 * Run with: node --loader ts-node/esm scripts/seed-medicines.ts
 * Or: npx ts-node scripts/seed-medicines.ts
 */

async function seedMedicines() {
  try {
    console.log(`Starting to seed ${medicinesData.length} medicines...`)

    let successCount = 0
    let failureCount = 0
    const errors: any[] = []

    // Batch insert in chunks to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < medicinesData.length; i += batchSize) {
      const batch = medicinesData.slice(i, i + batchSize)

      for (const medicine of batch) {
        try {
          // Check if medicine already exists
          const existing = await sql`
            SELECT id FROM medicines 
            WHERE name = ${medicine.name} 
            AND manufacturer = ${medicine.manufacturer || "Various"}
            AND strength = ${medicine.strength || "N/A"}
          `

          if (existing.length > 0) {
            console.log(`✓ Medicine already exists: ${medicine.name}`)
            successCount++
            continue
          }

          // Insert the medicine
          const result = await sql`
            INSERT INTO medicines (
              name,
              generic_name,
              manufacturer,
              form,
              strength,
              pack_size,
              mrp,
              source,
              description,
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
              ${medicine.mrp || 0},
              'scraped',
              ${`Common medicine - ${medicine.form || "tablet"}`},
              'active',
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
            RETURNING id
          `

          console.log(`✓ Added medicine: ${medicine.name} (ID: ${result[0].id})`)
          successCount++
        } catch (error: any) {
          failureCount++
          errors.push({
            medicine: medicine.name,
            error: error.message,
          })
          console.error(`✗ Failed to add ${medicine.name}:`, error.message)
        }
      }

      console.log(`Progress: ${i + batch.length}/${medicinesData.length}`)
    }

    console.log("\n" + "=".repeat(50))
    console.log(`Seeding complete!`)
    console.log(`✓ Successfully added: ${successCount} medicines`)
    console.log(`✗ Failed: ${failureCount} medicines`)
    console.log("=".repeat(50) + "\n")

    if (errors.length > 0) {
      console.log("Errors encountered:")
      errors.slice(0, 10).forEach((err) => {
        console.log(`  - ${err.medicine}: ${err.error}`)
      })
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`)
      }
    }

    process.exit(successCount > 0 ? 0 : 1)
  } catch (error) {
    console.error("Fatal error during seeding:", error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMedicines()
}

export { seedMedicines }
