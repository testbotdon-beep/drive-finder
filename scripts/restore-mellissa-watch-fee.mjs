/**
 * Restore the watch fee wiped when Mellissa was removed from the watch list,
 * and mark her off the active list using the new field instead.
 *
 * The old Remove button deleted watch_paid_at, which is also what the earnings
 * total counts, so taking someone off the list silently erased the $9 they had
 * already paid. watch_removed_at now carries list membership and watch_paid_at
 * stays as the payment record.
 *
 *   node scripts/restore-mellissa-watch-fee.mjs [--dry-run]
 */
import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ID = '35c708bf-bb4d-498b-b0e8-1b7181b2e4c6'
const ORIGINAL_PAID_AT = '2026-06-29T08:02:03.620Z' // from backups/drivefinder-export.json, 22 Sep
const DRY = process.argv.includes('--dry-run')

const req = await redis.hgetall(`drivefinder:req:${ID}`)
if (!req || !req.learner_name) {
  console.error('request not found, aborting')
  process.exit(1)
}
const before = (await redis.hgetall(`drivefinder:req-meta:${ID}`)) || {}

console.log('lead:   ', String(req.learner_name).trim(), '|', req.test_centre, req.transmission, '| status', req.status)
console.log('before: ', JSON.stringify(before))

if (before.watch_paid_at) {
  console.log('\nwatch_paid_at already present, nothing to restore')
  process.exit(0)
}

const after = { watch_paid_at: ORIGINAL_PAID_AT, watch_removed_at: new Date().toISOString() }
console.log('after:  ', JSON.stringify({ ...before, ...after }))
console.log('\neffect: +$9 back on the earned total, and she stays off the active watch list')

if (DRY) {
  console.log('\ndry run, nothing written')
  process.exit(0)
}

await redis.hset(`drivefinder:req-meta:${ID}`, after)
const check = await redis.hgetall(`drivefinder:req-meta:${ID}`)
console.log('\nwritten. verified:', JSON.stringify(check))
