/**
 * Restore a full export into a target Redis database.
 *
 * Used to move Drive Finder off the shared strata-listings database onto its
 * own. Writes through the raw REST API with the exact strings the export
 * captured, so values land byte-identical to the originals rather than being
 * re-serialised by the SDK.
 *
 *   node scripts/restore-to-db.mjs <rest-url> <rest-token> [--dry-run]
 */
import { readFileSync } from 'fs'

const [URL_ARG, TOKEN_ARG] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const DRY = process.argv.includes('--dry-run')
const SRC = 'backups/drivefinder-export.json'

if (!URL_ARG || !TOKEN_ARG) {
  console.error('usage: node scripts/restore-to-db.mjs <rest-url> <rest-token> [--dry-run]')
  process.exit(1)
}

const dump = JSON.parse(readFileSync(SRC, 'utf-8'))

async function pipeline(commands, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${URL_ARG}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN_ARG}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(commands),
      })
      const data = await res.json()
      if (Array.isArray(data) && !data.some((d) => d?.error)) return data.map((d) => d.result)
      if (Array.isArray(data)) {
        const firstError = data.find((d) => d?.error)
        if (i === attempts - 1) throw new Error(firstError.error)
      }
    } catch (e) {
      if (i === attempts - 1) throw e
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)))
  }
  throw new Error('pipeline failed')
}

/** A flat [field, value, ...] array becomes HSET arguments unchanged. */
const hsetArgs = (key, flat) => ['HSET', key, ...flat.map(String)]

const commands = []

// Request hashes.
let reqCount = 0
for (const id of dump.ids) {
  const flat = dump.requests[id]
  if (Array.isArray(flat) && flat.length) {
    commands.push(hsetArgs(`drivefinder:req:${id}`, flat))
    reqCount++
  }
}

// Meta sidecars.
let metaCount = 0
for (const id of dump.ids) {
  const flat = dump.meta[id]
  if (Array.isArray(flat) && flat.length) {
    commands.push(hsetArgs(`drivefinder:req-meta:${id}`, flat))
    metaCount++
  }
}

// Shared hashes.
let hashCount = 0
for (const [key, flat] of Object.entries(dump.hashes)) {
  if (Array.isArray(flat) && flat.length) {
    commands.push(hsetArgs(key, flat))
    hashCount++
  }
}

// Standalone values.
for (const [key, val] of Object.entries(dump.singles)) {
  if (val !== null && val !== undefined) commands.push(['SET', key, String(val)])
}

console.log('to write:')
console.log('  request hashes:', reqCount)
console.log('  meta hashes:   ', metaCount)
console.log('  shared hashes: ', hashCount, Object.keys(dump.hashes).join(', '))
console.log('  singles:       ', Object.keys(dump.singles).length)
console.log('  id list:       ', dump.ids.length, '(RPUSH in export order, newest first)')
console.log('  total commands:', commands.length + 1)

if (DRY) {
  console.log('\ndry run, nothing written')
  process.exit(0)
}

// The id list is rebuilt from scratch so a rerun cannot double up entries.
await pipeline([['DEL', 'drivefinder:requests']])

const BATCH = 40
for (let i = 0; i < commands.length; i += BATCH) {
  await pipeline(commands.slice(i, i + BATCH))
  const done = Math.min(i + BATCH, commands.length)
  if (done % 200 === 0 || done === commands.length) console.log(`  written ${done}/${commands.length}`)
}

// LRANGE returned newest first, so RPUSH in that same order preserves it.
for (let i = 0; i < dump.ids.length; i += 200) {
  await pipeline([['RPUSH', 'drivefinder:requests', ...dump.ids.slice(i, i + 200)]])
}

console.log('\nrestore complete')

const [llen, dbsize] = await pipeline([['LLEN', 'drivefinder:requests'], ['DBSIZE']])
console.log('  list length:', llen)
console.log('  keys in db: ', dbsize)
