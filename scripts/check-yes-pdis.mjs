import { config } from 'dotenv'
import { Redis } from '@upstash/redis'
import { readFileSync } from 'fs'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const raw = JSON.parse(readFileSync('./data/spf-instructors.json', 'utf-8'))

function slugify(centre, classType, name) {
  const slug = name.toLowerCase().replace(/\//g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${centre.toLowerCase()}-${classType.toLowerCase()}-${slug}`
}

const instructors = raw.map((i) => ({ ...i, id: slugify(i.test_centre, i.class_type, i.name) }))

const statuses = await redis.hgetall('drivefinder:instructor-status') || {}
const dates = await redis.hgetall('drivefinder:instructor-status-date') || {}

const filterCentre = process.argv[2] || 'CDC'
const filterTrans = (process.argv[3] || 'manual').toLowerCase()

const matches = instructors.filter((i) => {
  if (statuses[i.id] !== 'yes') return false
  if (i.test_centre !== filterCentre) return false
  if (String(i.transmission).toLowerCase() !== filterTrans) return false
  return true
})

console.log(`\n${filterCentre} ${filterTrans.toUpperCase()} instructors marked YES: ${matches.length}\n`)
for (const i of matches) {
  const date = dates[i.id] ? dates[i.id].slice(0, 10) : 'no date'
  const passRate = (i.pass_rate * 100).toFixed(0) + '%'
  console.log(`  ${i.name.padEnd(35)} ${i.phone}   pass ${passRate.padStart(4)}   yes since ${date}`)
}
