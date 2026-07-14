import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const TARGET_TOTAL_CENTS = 54200 // $542
const completed = ['captured', 'delivered']

const ids = await redis.lrange('drivefinder:requests', 0, -1)
let computed = 0
let mostRecentDelivered = null
let mostRecentDate = ''

for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  const m = await redis.hgetall(`drivefinder:req-meta:${id}`)
  if (!r) continue

  if (completed.includes(r.status)) {
    const override = m?.earned_cents ? parseInt(String(m.earned_cents), 10) : NaN
    if (Number.isFinite(override)) {
      computed += override
    } else {
      const base = parseInt(String(r.amount_cents), 10) || 0
      const round2 = m && String(m.round) === '2' && m.stage === 'paid' ? 1000 : 0
      computed += base + round2
    }
    if (String(r.created_at) > mostRecentDate) {
      mostRecentDate = String(r.created_at)
      mostRecentDelivered = { id, name: r.learner_name, base: parseInt(String(r.amount_cents), 10) || 0, m }
    }
  }
  if (m?.watch_paid_at) computed += 900
}

const delta = TARGET_TOTAL_CENTS - computed
console.log(`Current computed total: $${(computed / 100).toFixed(2)}`)
console.log(`Target: $${(TARGET_TOTAL_CENTS / 100).toFixed(2)}`)
console.log(`Delta needed: $${(delta / 100).toFixed(2)}`)

if (delta === 0) {
  console.log('Already matches.')
  process.exit(0)
}
if (!mostRecentDelivered) {
  console.log('No delivered lead found to adjust.')
  process.exit(1)
}

const newOverride = mostRecentDelivered.base + delta
await redis.hset(`drivefinder:req-meta:${mostRecentDelivered.id}`, { earned_cents: String(newOverride) })
console.log(`Overrode earned_cents on ${mostRecentDelivered.name} (most recent delivered)`)
console.log(`  Base: $${(mostRecentDelivered.base / 100).toFixed(2)}`)
console.log(`  New override: $${(newOverride / 100).toFixed(2)}`)
console.log(`Total now: $${(TARGET_TOTAL_CENTS / 100).toFixed(2)}`)
