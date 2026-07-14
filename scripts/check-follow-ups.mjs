import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ids = await redis.lrange('drivefinder:requests', 0, -1)

const withFollowUp = []
for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (!r) continue
  const status = String(r.status || '')
  if (!['submitted', 'confirmed', 'pending'].includes(status)) continue
  const meta = await redis.hgetall(`drivefinder:req-meta:${id}`)
  if (!meta?.follow_up_at) continue
  withFollowUp.push({
    id,
    name: r.learner_name,
    follow_up_at: meta.follow_up_at,
    watch_asked_at: meta.watch_asked_at || '',
    watch_paid_at: meta.watch_paid_at || '',
  })
}

console.log(`Leads with follow_up_at set: ${withFollowUp.length}\n`)
for (const l of withFollowUp.sort((a, b) => a.follow_up_at.localeCompare(b.follow_up_at))) {
  const flags = []
  if (l.watch_asked_at) flags.push('ASKED')
  if (l.watch_paid_at) flags.push('PAID')
  console.log(`  ${l.follow_up_at}  ${l.name.padEnd(28)}  ${flags.join(' ') || '-'}`)
}
