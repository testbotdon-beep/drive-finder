import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ids = await redis.lrange('drivefinder:requests', 0, -1)
const byDay = {}

for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (!r) continue
  const created = String(r.created_at || '')
  if (!created) continue
  const sgDate = new Date(created).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  byDay[sgDate] = (byDay[sgDate] || 0) + 1
}

const sorted = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
const todaySG = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

console.log(`\nSubmissions by day (SGT):`)
for (const [d, n] of sorted) {
  const marker = d === todaySG ? ' ← TODAY' : ''
  console.log(`  ${d}  ${String(n).padStart(3)}${marker}`)
}

const max = sorted.reduce((m, [d, n]) => (n > m.n ? { d, n } : m), { d: '', n: 0 })
const todayCount = byDay[todaySG] || 0
const total = sorted.reduce((s, [, n]) => s + n, 0)

console.log(`\nTotal: ${total} submissions across ${sorted.length} days`)
console.log(`Today (${todaySG}): ${todayCount}`)
console.log(`Best day: ${max.d} with ${max.n} submissions`)
