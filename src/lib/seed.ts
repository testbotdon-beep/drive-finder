import type Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import path from 'path'

interface RawInstructor {
  name: string
  phone: string
  test_centre: string
  class_type: string
  transmission: string
  tested: number
  passed: number
  pass_rate: number
}

/**
 * Slugify centre + class + name into a stable ID.
 * e.g. "bbdc-3-chong-song-peng"
 */
function slugify(centre: string, classType: string, name: string): string {
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
function getHourlyRate(centre: string, passRate: number): number {
  if (centre === 'CDC' && passRate > 0.65) return 60
  return 55
}

function loadInstructors(): Array<RawInstructor & { id: string; hourly_rate: number }> {
  const jsonPath = path.join(process.cwd(), 'data', 'spf-instructors.json')
  const raw: RawInstructor[] = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  return raw.map((inst) => ({
    ...inst,
    id: slugify(inst.test_centre, inst.class_type, inst.name),
    hourly_rate: getHourlyRate(inst.test_centre, inst.pass_rate),
  }))
}

export function seedInstructors(db: Database.Database) {
  const existing = db.prepare('SELECT COUNT(*) as n FROM instructors').get() as { n: number }
  if (existing.n > 0) return

  const instructors = loadInstructors()

  const insert = db.prepare(`
    INSERT INTO instructors (id, name, phone, test_centre, class_type, transmission, tested, passed, pass_rate, hourly_rate, is_active)
    VALUES (@id, @name, @phone, @test_centre, @class_type, @transmission, @tested, @passed, @pass_rate, @hourly_rate, 1)
  `)
  const tx = db.transaction((rows: typeof instructors) => {
    for (const row of rows) insert.run(row)
  })
  tx(instructors)
}
