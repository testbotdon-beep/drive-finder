import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ids = await redis.lrange('drivefinder:requests', 0, -1)
const confirmed = []
for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (r?.status === 'confirmed') confirmed.push({ id, name: r.learner_name, centre: r.test_centre, created: r.created_at })
}

console.log(`Found ${confirmed.length} confirmed lead(s):`)
for (const c of confirmed) {
  console.log(`  ${c.name}  ${c.centre}  ref ${c.id.slice(0, 8)}  (${String(c.created).slice(0, 10)})`)
}

if (confirmed.length === 0) {
  console.log('Nothing to void.')
  process.exit(0)
}

for (const c of confirmed) {
  await redis.hset(`drivefinder:req:${c.id}`, { status: 'voided' })
  console.log(`Voided: ${c.name}`)
}
console.log('Done.')
