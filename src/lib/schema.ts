import type Database from 'better-sqlite3'

export function initSchema(db: Database.Database) {
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

    CREATE INDEX IF NOT EXISTS idx_instructors_centre_class
      ON instructors(test_centre, class_type);

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

    CREATE INDEX IF NOT EXISTS idx_requests_status
      ON match_requests(status);

    CREATE INDEX IF NOT EXISTS idx_requests_deadline
      ON match_requests(deadline_at);
  `)
}
