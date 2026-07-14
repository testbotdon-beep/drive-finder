import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const statuses = await redis.hgetall('drivefinder:instructor-status')
const dates = await redis.hgetall('drivefinder:instructor-status-date')

console.log('Total status entries:', Object.keys(statuses || {}).length)
console.log('Total date entries:', Object.keys(dates || {}).length)

const counts = {}
for (const v of Object.values(statuses || {})) {
  counts[v] = (counts[v] || 0) + 1
}
console.log('By status:', counts)

console.log('\nFirst 5 entries:')
const entries = Object.entries(statuses || {}).slice(0, 5)
for (const [id, status] of entries) {
  console.log(`  ${id}: ${status} (${dates?.[id] || 'no date'})`)
}
