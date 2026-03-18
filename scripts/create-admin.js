import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL)

async function createAdmin() {
  const email = "speeclo@gmail.com"
  const password = "123456"

  console.log("[admin] Creating admin account...")
  console.log("[admin] Email:", email)
  console.log("[admin] Password:", password)

  // Delete existing admin if exists
  await sql`DELETE FROM users WHERE email = ${email}`
  console.log("[admin] Deleted existing admin (if any)")

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)
  console.log("[admin] Password hash generated:", passwordHash.substring(0, 20) + "...")

  // Create new admin user
  const result = await sql`
    INSERT INTO users (email, password_hash, user_type, created_at)
    VALUES (${email}, ${passwordHash}, 'admin', NOW())
    RETURNING id, email, user_type
  `

  console.log("[admin] Admin created successfully!")
  console.log("[admin] User ID:", result[0].id)
  console.log("[admin] Email:", result[0].email)
  console.log("[admin] Type:", result[0].user_type)
  console.log("\n=== LOGIN CREDENTIALS ===")
  console.log("Email:", email)
  console.log("Password:", password)
  console.log("========================\n")

  return result[0]
}

createAdmin()
  .then(() => {
    console.log("[admin] Admin creation complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[admin] Error creating admin:", error)
    process.exit(1)
  })
