/**
 * Backfill watch_fee_cents on existing watch list records.
 *
 * The earnings total used to add a flat $9 for anyone with a watch_paid_at, but
 * three different buttons set that field and one of them, "Add to Watch List
 * (Free Goodwill)", gives the spot away for nothing. Those were being counted
 * as $9 of revenue that was never collected.
 *
 * Don confirmed on 2026-10-14 that nobody ever paid the $10 post-delivery
 * upsell, so every watch record created AFTER that lead was already delivered
 * and paid for was a free goodwill add and is worth 0.
 *
 *   node scripts/backfill-watch-fees.mjs [--dry-run]
 */
import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const DRY = process.argv.includes('--dry-run')
const DONE = ['delivered', 'captured']

const ids = await redis.lrange('drivefinder:requests', 0, -1)
const rp = redis.pipeline()
for (const id of ids) rp.hgetall(`drivefinder:req:${id}`)
const reqs = (await rp.exec()).filter(Boolean)

const mp = redis.pipeline()
for (const id of ids) mp.hgetall(`drivefinder:req-meta:${id}`)
const ms = await mp.exec()
const meta = {}
ids.forEach((id, i) => { if (ms[i] && Object.keys(ms[i]).length) meta[id] = ms[i] })

const plan = []
for (const r of reqs) {
  const m = meta[r.id] || {}
  if (!m.watch_paid_at) continue
  if (m.watch_fee_cents !== undefined && m.watch_fee_cents !== '') continue

  const paidForDelivery =
    DONE.includes(r.status) &&
    (m.earned_cents !== undefined && m.earned_cents !== ''
      ? parseInt(String(m.earned_cents), 10) > 0
      : (Number(r.amount_cents) || 0) > 0)
  const afterDelivery = Boolean(r.delivered_at) && m.watch_paid_at > r.delivered_at

  // Already paid and got their contact, then handed a watch spot afterwards:
  // that is the goodwill button, because nobody ever paid the upsell.
  const fee = paidForDelivery && afterDelivery ? 0 : 900
  plan.push({ id: r.id, name: String(r.learner_name || '').trim(), status: r.status, fee })
}

const free = plan.filter((p) => p.fee === 0)
const paid = plan.filter((p) => p.fee === 900)

console.log('FREE goodwill, now worth $0 (was counted as $9):')
for (const p of free) console.log('   ', p.name, '|', p.status)
console.log('\nSTANDARD $9 watchers, unchanged:', paid.length)

const delta = free.length * 900
console.log('\nrecords to write:', plan.length)
console.log('earnings correction:', '-$' + (delta / 100).toFixed(2))

if (DRY) {
  console.log('\ndry run, nothing written')
  process.exit(0)
}

const wp = redis.pipeline()
for (const p of plan) wp.hset(`drivefinder:req-meta:${p.id}`, { watch_fee_cents: String(p.fee) })
await wp.exec()
console.log('\nwritten.')
