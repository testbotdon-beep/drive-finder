import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ids = await redis.lrange('drivefinder:requests', 0, -1)
const submitted = []

for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (!r) continue
  if (r.status !== 'submitted') continue
  const meta = await redis.hgetall(`drivefinder:req-meta:${id}`)
  submitted.push({
    id,
    name: r.learner_name,
    centre: r.test_centre,
    transmission: r.transmission,
    created_at: r.created_at,
    asked: !!meta?.watch_asked_at,
    paid: !!meta?.watch_paid_at,
    follow_up: meta?.follow_up_at || '',
  })
}

submitted.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))

console.log(`\nMost recent submitted leads (newest first):\n`)
for (const l of submitted.slice(0, 20)) {
  const flags = []
  if (l.asked) flags.push('ASKED')
  if (l.paid) flags.push('PAID')
  const date = String(l.created_at).slice(0, 10)
  console.log(`  ${date}  ${l.name.padEnd(30)} ${l.centre} ${l.transmission.padEnd(7)} ${flags.join(' ') || '-'}`)
}
