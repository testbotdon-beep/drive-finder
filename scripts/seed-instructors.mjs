// Warms up the SQLite DB with the seed data from the SPF JSON file.
// The app auto-seeds on first DB access, so this is mostly a convenience script.
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '..', 'drive-finder.db')
const JSON_PATH = path.join(__dirname, '..', 'data', 'spf-instructors.json')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS instructors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    test_centre TEXT NOT NULL,
    class_type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    tested INTEGER NOT NULL DEFAULT 0,
    passed INTEGER NOT NULL DEFAULT 0,
    pass_rate REAL NOT NULL DEFAULT 0,
    hourly_rate INTEGER NOT NULL DEFAULT 50,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS match_requests (
    id TEXT PRIMARY KEY,
    test_centre TEXT NOT NULL,
    transmission TEXT NOT NULL,
    class_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    budget TEXT NOT NULL,
    language TEXT NOT NULL,
    learner_name TEXT NOT NULL,
    learner_phone TEXT NOT NULL,
    learner_email TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    stripe_client_secret TEXT,
    amount_cents INTEGER NOT NULL,
    matched_instructor_ids TEXT,
    admin_notes TEXT,
    created_at TEXT NOT NULL,
    deadline_at TEXT NOT NULL,
    delivered_at TEXT,
    voided_at TEXT,
    captured_at TEXT
  );
`)

const existing = db.prepare('SELECT COUNT(*) as n FROM instructors').get()
if (existing.n > 0) {
  console.log(`Already have ${existing.n} instructors — skipping seed`)
  process.exit(0)
}

/**
 * Slugify centre + class + name into a stable ID.
 */
function slugify(centre, classType, name) {
  const slug = name
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${centre.toLowerCase()}-${classType.toLowerCase()}-${slug}`
}

/**
 * Determine hourly rate based on centre and pass rate.
 * Default: 55. CDC instructors with >65% pass rate: 60.
 */
function getHourlyRate(centre, passRate) {
  if (centre === 'CDC' && passRate > 0.65) return 60
  return 55
}

// Load instructors from the scraped SPF JSON
const raw = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))
const INSTRUCTORS = raw.map((inst) => ({
  ...inst,
  id: slugify(inst.test_centre, inst.class_type, inst.name),
  hourly_rate: getHourlyRate(inst.test_centre, inst.pass_rate),
}))

const insert = db.prepare(`
  INSERT INTO instructors (id, name, phone, test_centre, class_type, transmission, tested, passed, pass_rate, hourly_rate, is_active)
  VALUES (@id, @name, @phone, @test_centre, @class_type, @transmission, @tested, @passed, @pass_rate, @hourly_rate, 1)
`)

const tx = db.transaction((rows) => {
  for (const row of rows) insert.run(row)
})
tx(INSTRUCTORS)

console.log(`Seeded ${INSTRUCTORS.length} instructors from ${JSON_PATH}`)
console.log(`  BBDC: ${INSTRUCTORS.filter(i => i.test_centre === 'BBDC').length}`)
console.log(`  CDC:  ${INSTRUCTORS.filter(i => i.test_centre === 'CDC').length}`)
console.log(`  SSDC: ${INSTRUCTORS.filter(i => i.test_centre === 'SSDC').length}`)
