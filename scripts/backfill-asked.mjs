import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const EXCLUDE_NAMES = ['khan shamim', 'shamim khan', 'khan']

const ids = await redis.lrange('drivefinder:requests', 0, -1)
console.log(`Total requests: ${ids.length}`)

const now = new Date().toISOString()
let asked = 0
let skipped = 0
let already = 0

for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (!r) continue
  const status = String(r.status || '')
  if (!['submitted', 'confirmed', 'pending'].includes(status)) {
    skipped++
    continue
  }
  const name = String(r.learner_name || '').toLowerCase()
  if (EXCLUDE_NAMES.some((ex) => name.includes(ex))) {
    console.log(`  SKIP exclude: ${r.learner_name}`)
    skipped++
    continue
  }
  const meta = await redis.hgetall(`drivefinder:req-meta:${id}`)
  if (meta?.watch_asked_at) {
    already++
    continue
  }
  if (meta?.watch_paid_at) {
    skipped++
    continue
  }
  await redis.hset(`drivefinder:req-meta:${id}`, { watch_asked_at: now })
  console.log(`  ASKED: ${r.learner_name}`)
  asked++
}

console.log(`\nDone. Marked asked: ${asked}, Already asked: ${already}, Skipped: ${skipped}`)
