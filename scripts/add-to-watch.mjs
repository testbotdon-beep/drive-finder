import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const NAME = (process.argv[2] || '').toLowerCase()
if (!NAME) { console.log('Usage: node add-to-watch.mjs <name>'); process.exit(1) }

const ids = await redis.lrange('drivefinder:requests', 0, -1)
const matches = []
for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (!r) continue
  if (String(r.learner_name || '').toLowerCase().includes(NAME)) {
    matches.push({ id, name: r.learner_name, status: r.status })
  }
}

if (matches.length === 0) { console.log(`No lead matching "${NAME}"`); process.exit(1) }
if (matches.length > 1) {
  console.log(`Multiple matches:`)
  for (const m of matches) console.log(`  ${m.name}  ref ${m.id.slice(0, 8)}  status: ${m.status}`)
  process.exit(1)
}

const lead = matches[0]
const now = new Date().toISOString()
await redis.hset(`drivefinder:req-meta:${lead.id}`, { watch_paid_at: now, watch_asked_at: now })
console.log(`Added to watch list: ${lead.name} (ref ${lead.id.slice(0, 8)})`)
console.log(`watch_paid_at: ${now}`)
console.log(`30-day watch window starts now.`)
