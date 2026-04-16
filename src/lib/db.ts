import Database from 'better-sqlite3'
import path from 'path'
import { initSchema } from './schema'
import { seedInstructors } from './seed'

const DB_PATH = path.join(process.cwd(), 'drive-finder.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
    seedInstructors(db)
  }
  return db
}

export type RequestStatus =
  | 'submitted'
  | 'confirmed'
  | 'pending'
  | 'delivered'
  | 'failed'
  | 'voided'
  | 'captured'

export interface MatchRequest {
  id: string
  test_centre: string
  transmission: string
  class_type: string
  start_date: string
  budget: string
  language: string
  learner_name: string
  learner_phone: string
  learner_email: string
  notes: string | null
  status: RequestStatus
  stripe_payment_intent_id: string | null
  stripe_client_secret: string | null
  amount_cents: number
  matched_instructor_ids: string | null
  admin_notes: string | null
  created_at: string
  deadline_at: string
  delivered_at: string | null
  voided_at: string | null
  captured_at: string | null
}

export interface Instructor {
  id: string
  name: string
  phone: string
  test_centre: string
  class_type: string
  transmission: string
  tested: number
  passed: number
  pass_rate: number
  hourly_rate: number
  notes: string | null
  is_active: number
}
