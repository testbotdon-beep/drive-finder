/**
 * Full export of the Drive Finder Redis dataset to local JSON.
 *
 * The source database is at its monthly command cap, so it only lets a
 * fraction of requests through. Everything here is therefore small-batch,
 * retried with backoff, and resumable: rerun it and it picks up whatever is
 * still missing from the output file.
 */
import { config } from 'dotenv'
import { readFileSync, writeFileSync, existsSync } from 'fs'

config({ path: '.env.local' })

const URL = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const OUT = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'backups/drivefinder-export.json'

const BATCH = 5          // commands per pipeline call; larger batches get rejected
const MAX_RETRIES = 40
const BASE_DELAY = 400   // ms

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function isQuotaError(v) {
  return v && typeof v === 'object' && typeof v.error === 'string' && v.error.includes('max requests limit')
}

/** Run a pipeline of commands, retrying until every entry comes back clean. */
async function pipeline(commands) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${URL}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(commands),
      })
      const data = await res.json()
      if (Array.isArray(data) && !data.some(isQuotaError)) {
        return data.map((d) => d.result)
      }
    } catch {
      // network hiccup, fall through to the backoff
    }
    // Backoff grows but stays bounded, the cap frees up in bursts rather than linearly.
    await sleep(Math.min(BASE_DELAY * Math.pow(1.4, attempt), 8000))
  }
  throw new Error('gave up after ' + MAX_RETRIES + ' attempts')
}

// --fresh discards the previous export and re-reads everything. Use it after
// any script that writes to Redis directly, since those bypass the snapshot.
const fresh = process.argv.includes('--fresh')
const out = !fresh && existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, 'utf-8'))
  : { exported_at: null, source: URL, ids: [], requests: {}, meta: {}, singles: {}, hashes: {} }

function save() {
  out.exported_at = new Date().toISOString()
  writeFileSync(OUT, JSON.stringify(out, null, 2))
}

// 1. The id list drives everything else.
if (!out.ids.length) {
  console.log('fetching request id list...')
  const [ids] = await pipeline([['LRANGE', 'drivefinder:requests', 0, -1]])
  out.ids = ids
  save()
}
console.log('request ids:', out.ids.length)

// 2. Standalone keys.
const SINGLE_KEYS = ['drivefinder:earnings-adjustment']
const HASH_KEYS = [
  'drivefinder:instructor-status',
  'drivefinder:instructor-status-date',
  'drivefinder:instructor-notes',
]

for (const k of SINGLE_KEYS) {
  if (out.singles[k] !== undefined) continue
  const [v] = await pipeline([['GET', k]])
  out.singles[k] = v
  save()
  console.log('got', k)
}
for (const k of HASH_KEYS) {
  if (out.hashes[k] !== undefined) continue
  const [v] = await pipeline([['HGETALL', k]])
  out.hashes[k] = v
  save()
  console.log('got', k, Object.keys(v || {}).length, 'fields')
}

// 3. Per request: the record and its meta sidecar.
async function drain(label, prefix, bucket) {
  const missing = out.ids.filter((id) => bucket[id] === undefined)
  if (!missing.length) {
    console.log(label, 'already complete')
    return
  }
  console.log(label, 'missing', missing.length)
  for (let i = 0; i < missing.length; i += BATCH) {
    const slice = missing.slice(i, i + BATCH)
    const results = await pipeline(slice.map((id) => ['HGETALL', `${prefix}${id}`]))
    slice.forEach((id, j) => { bucket[id] = results[j] ?? null })
    save()
    const done = Math.min(i + BATCH, missing.length)
    if (done % 50 === 0 || done === missing.length) {
      console.log(`  ${label}: ${done}/${missing.length}`)
    }
  }
}

await drain('requests', 'drivefinder:req:', out.requests)
await drain('meta', 'drivefinder:req-meta:', out.meta)

save()

const reqCount = Object.values(out.requests).filter((r) => r && Object.keys(r).length).length
const metaCount = Object.values(out.meta).filter((r) => r && Object.keys(r).length).length
console.log('\nDONE ->', OUT)
console.log('  ids:      ', out.ids.length)
console.log('  requests: ', reqCount)
console.log('  meta rows:', metaCount)
console.log('  instructor statuses:', Object.keys(out.hashes['drivefinder:instructor-status'] || {}).length)
console.log('  adjustment:', out.singles['drivefinder:earnings-adjustment'])
