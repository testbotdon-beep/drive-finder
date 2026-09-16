/**
 * Build the admin snapshot from the local export and write it as a single key.
 *
 * Used to prime the cache without paying the ~926 command rebuild, which is
 * what the plan allowance currently cannot afford.
 */
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { gzipSync } from 'zlib'

config({ path: '.env.local' })

const URL = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const SRC = args[0] || 'backups/drivefinder-export.json'

/**
 * The Upstash SDK JSON-parses every value it reads back, so "1900" arrives as
 * the number 1900 and "null" as null. The raw REST export used for the backup
 * does not, so replay that parsing here. Without it every numeric field would
 * turn into a string and the earnings total would silently change.
 */
function coerce(v) {
  if (typeof v !== 'string') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

/** Raw REST returns hashes as a flat [field, value, ...] array. */
function unflatten(arr) {
  if (!arr) return {}
  if (!Array.isArray(arr)) return arr
  const o = {}
  for (let i = 0; i < arr.length; i += 2) o[arr[i]] = coerce(arr[i + 1])
  return o
}

const dump = JSON.parse(readFileSync(SRC, 'utf-8'))

const requests = dump.ids
  .map((id) => unflatten(dump.requests[id]))
  .filter((r) => Object.keys(r).length > 0)

const meta = {}
for (const id of dump.ids) {
  const m = unflatten(dump.meta[id])
  if (Object.keys(m).length > 0) meta[id] = m
}

// Statuses stay as plain strings, so no coercion wanted there.
const flatStrings = (arr) => {
  if (!arr) return {}
  if (!Array.isArray(arr)) return arr
  const o = {}
  for (let i = 0; i < arr.length; i += 2) o[arr[i]] = String(arr[i + 1])
  return o
}

const snapshot = {
  requests,
  meta,
  statuses: flatStrings(dump.hashes['drivefinder:instructor-status']),
  dates: flatStrings(dump.hashes['drivefinder:instructor-status-date']),
  instructorNotes: flatStrings(dump.hashes['drivefinder:instructor-notes']),
  adjustment_cents: Number(dump.singles['drivefinder:earnings-adjustment']) || 0,
  built_at: new Date().toISOString(),
}

// Sanity check before writing: recompute the earned total the way the dashboard
// does, so a shape mistake shows up here rather than on Don's screen.
const WATCH_FEE = 900
let earned = snapshot.adjustment_cents
let delivered = 0
let watch = 0
for (const r of snapshot.requests) {
  const m = snapshot.meta[r.id] || {}
  if (m.earned_cents !== undefined && m.earned_cents !== '') {
    earned += Number(m.earned_cents)
  } else if (r.status === 'delivered') {
    earned += Number(r.amount_cents) || 0
  }
  if (r.status === 'delivered') delivered++
  if (m.watch_paid_at) {
    earned += WATCH_FEE
    watch++
  }
}

console.log('requests:  ', snapshot.requests.length)
console.log('meta rows: ', Object.keys(snapshot.meta).length)
console.log('statuses:  ', Object.keys(snapshot.statuses).length)
console.log('delivered: ', delivered)
console.log('watch paid:', watch)
console.log('adjustment:', snapshot.adjustment_cents)
console.log('earned est: $' + (earned / 100).toFixed(2))

const typeCheck = snapshot.requests[0]
console.log('sample amount_cents type:', typeof typeCheck.amount_cents, typeCheck.amount_cents)

const payload = gzipSync(Buffer.from(JSON.stringify(snapshot), 'utf-8')).toString('base64')
console.log('payload:    ' + (payload.length / 1024).toFixed(0) + 'KB gzipped')

if (process.argv.includes('--dry-run')) {
  console.log('\ndry run, nothing written')
  process.exit(0)
}

for (let i = 0; i < 15; i++) {
  const res = await fetch(`${URL}/set/drivefinder:snapshot`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'text/plain' },
    body: payload,
  })
  const data = await res.json().catch(() => ({}))
  if (data.result === 'OK') {
    console.log('\nsnapshot written on attempt', i + 1)
    process.exit(0)
  }
  await new Promise((r) => setTimeout(r, 800))
}
console.error('\nfailed to write snapshot')
process.exit(1)
