import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ARG_REF = process.argv[2]
const NEW_CENTRE = process.argv[3]
const DRY_RUN = !process.argv.includes('--apply')

if (!ARG_REF || !NEW_CENTRE) {
  console.error('Usage: node scripts/switch-centre.mjs <ref|name|email> <NEW_CENTRE> [--apply]')
  console.error('Example: node scripts/switch-centre.mjs 74619385 CDC --apply')
  process.exit(1)
}

const ids = await redis.lrange('drivefinder:requests', 0, -1)
const matches = []

for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (!r) continue
  const refSuffix = id.slice(-8)
  const hit =
    refSuffix === ARG_REF ||
    String(r.learner_name || '').toLowerCase().includes(ARG_REF.toLowerCase()) ||
    String(r.learner_email || '').toLowerCase() === ARG_REF.toLowerCase()
  if (hit) matches.push({ id, r })
}

if (matches.length === 0) {
  console.log(`No match for "${ARG_REF}"`)
  process.exit(0)
}

if (matches.length > 1) {
  console.log(`Multiple matches (${matches.length}):`)
  for (const { id, r } of matches) {
    console.log(`  ${id.slice(-8)} · ${r.learner_name} · ${r.learner_email} · ${r.test_centre} · ${r.status}`)
  }
  console.log('Re-run with a more specific ref.')
  process.exit(0)
}

const { id, r } = matches[0]
console.log(`Found: ${r.learner_name} (ref ${id.slice(-8)})`)
console.log(`  Current: ${r.test_centre} · ${r.class_type} · ${r.transmission}`)
console.log(`  Status:  ${r.status} · Earned $${(parseInt(r.amount_cents, 10) || 0) / 100}`)
console.log(`  Change:  test_centre: ${r.test_centre} → ${NEW_CENTRE}`)

if (DRY_RUN) {
  console.log('\nDRY RUN. Re-run with --apply to commit.')
  process.exit(0)
}

await redis.hset(`drivefinder:req:${id}`, { test_centre: NEW_CENTRE })
const after = await redis.hgetall(`drivefinder:req:${id}`)
console.log(`\nApplied. test_centre is now: ${after.test_centre}`)
