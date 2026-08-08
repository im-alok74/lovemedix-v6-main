#!/usr/bin/env node
/**
 * Migration runner.
 *
 * Migrations were previously applied by hand, which is how the `audit_logs` table went
 * missing while five routes wrote to it, and how `medicines.slug` shipped in code before
 * it existed in the database.
 *
 * Usage:
 *   node scripts/migrate.mjs status     # what is applied, what is pending
 *   node scripts/migrate.mjs up         # apply every pending migration in order
 *   node scripts/migrate.mjs up 024     # apply one file by number prefix
 *   node scripts/migrate.mjs snapshot   # dump the current schema to stdout as JSON
 *
 * Each file runs inside its own transaction. A file that fails rolls back completely and
 * is not recorded, so re-running after a fix is safe.
 *
 * Legacy files (001–023) predate this runner and may already be applied by hand. Use
 * `node scripts/migrate.mjs baseline` to record them as applied without executing them.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"
import { Pool, neonConfig } from "@neondatabase/serverless"

if (typeof WebSocket !== "undefined") neonConfig.webSocketConstructor = WebSocket

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = join(SCRIPTS_DIR, "..")

function loadConnectionString() {
  if (process.env.DATABASE_URL) return normalize(process.env.DATABASE_URL)

  // Fall back to .env / .env.local so the runner works without extra tooling.
  for (const file of [".env.local", ".env"]) {
    const path = join(ROOT, file)
    if (!existsSync(path)) continue
    const match = readFileSync(path, "utf8").match(/^DATABASE_URL\s*=\s*(.*)$/m)
    if (match) return normalize(match[1])
  }

  throw new Error("DATABASE_URL not set, and not found in .env.local or .env")
}

function normalize(value) {
  return value.trim().replace(/^psql\s+/, "").replace(/^['"]|['"]$/g, "")
}

function listMigrations() {
  return readdirSync(SCRIPTS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => {
      const body = readFileSync(join(SCRIPTS_DIR, name), "utf8")
      return {
        name,
        body,
        checksum: createHash("sha256").update(body).digest("hex").slice(0, 16),
      }
    })
}

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        VARCHAR(255) PRIMARY KEY,
      checksum    VARCHAR(64)  NOT NULL,
      applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      duration_ms INTEGER
    )
  `)
}

async function appliedSet(client) {
  const { rows } = await client.query("SELECT name, checksum FROM schema_migrations")
  return new Map(rows.map((r) => [r.name, r.checksum]))
}

async function main() {
  const command = process.argv[2] ?? "status"
  const filter = process.argv[3]

  const pool = new Pool({ connectionString: loadConnectionString() })
  const client = await pool.connect()

  try {
    await ensureTable(client)
    const migrations = listMigrations()
    const applied = await appliedSet(client)

    if (command === "status") {
      console.log("name                                          status     checksum")
      console.log("-".repeat(78))
      for (const m of migrations) {
        const was = applied.get(m.name)
        const status = !was ? "PENDING" : was === m.checksum ? "applied" : "CHANGED!"
        console.log(`${m.name.padEnd(45)} ${status.padEnd(10)} ${m.checksum}`)
      }
      const pending = migrations.filter((m) => !applied.has(m.name)).length
      console.log(`\n${applied.size} applied, ${pending} pending`)
      return
    }

    if (command === "baseline") {
      // Record legacy migrations as applied without running them.
      const legacy = migrations.filter((m) => /^0(0[1-9]|1\d|2[0-3])/.test(m.name))
      for (const m of legacy) {
        await client.query(
          `INSERT INTO schema_migrations (name, checksum, duration_ms) VALUES ($1, $2, 0)
           ON CONFLICT (name) DO NOTHING`,
          [m.name, m.checksum],
        )
      }
      console.log(`baselined ${legacy.length} legacy migrations (not executed)`)
      return
    }

    if (command === "snapshot") {
      const { rows } = await client.query(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, column_name
      `)
      console.log(JSON.stringify(rows))
      return
    }

    if (command !== "up") {
      throw new Error(`unknown command "${command}" — use status | up | baseline | snapshot`)
    }

    const pending = migrations.filter(
      (m) => !applied.has(m.name) && (!filter || m.name.startsWith(filter)),
    )

    if (pending.length === 0) {
      console.log(filter ? `nothing pending matching "${filter}"` : "nothing to apply")
      return
    }

    for (const m of pending) {
      process.stdout.write(`applying ${m.name} ... `)
      const started = Date.now()
      try {
        // Files that manage their own BEGIN/COMMIT are left alone; the rest get wrapped
        // so a partial failure cannot leave the schema half-migrated.
        const selfTransacting = /^\s*BEGIN\s*;/im.test(m.body)
        if (!selfTransacting) await client.query("BEGIN")
        await client.query(m.body)
        if (!selfTransacting) await client.query("COMMIT")

        const duration = Date.now() - started
        await client.query(
          `INSERT INTO schema_migrations (name, checksum, duration_ms) VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = NOW()`,
          [m.name, m.checksum, duration],
        )
        console.log(`ok (${duration}ms)`)
      } catch (error) {
        console.log("FAILED")
        try {
          await client.query("ROLLBACK")
        } catch {
          /* already rolled back by the server */
        }
        console.error(`\n  ${error.message}`)
        if (error.detail) console.error(`  detail: ${error.detail}`)
        if (error.hint) console.error(`  hint:   ${error.hint}`)
        if (error.position) console.error(`  at character ${error.position}`)
        process.exitCode = 1
        return
      }
    }

    console.log(`\napplied ${pending.length} migration(s)`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
