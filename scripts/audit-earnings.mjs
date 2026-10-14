/**
 * Full earnings audit. Recomputes the dashboard total, breaks it down, and
 * flags every record that looks like money earned but not counted.
 */
import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ids = await redis.lrange('drivefinder:requests', 0, -1)
const rp = redis.pipeline()
for (const id of ids) rp.hgetall(`drivefinder:req:${id}`)
const reqs = (await rp.exec()).filter(Boolean)

const mp = redis.pipeline()
for (const id of ids) mp.hgetall(`drivefinder:req-meta:${id}`)
const metas = await mp.exec()
const meta = {}
ids.forEach((id, i) => { if (metas[i] && Object.keys(metas[i]).length) meta[id] = metas[i] })

const adjustment = Number(await redis.get('drivefinder:earnings-adjustment')) || 0

const DONE = ['delivered', 'captured']
const money = (c) => '$' + (c / 100).toFixed(2)

// Exactly the dashboard formula.
let base = 0, round2 = 0, overrides = 0, watch = 0
let deliveredCount = 0, overrideCount = 0, round2Count = 0, watchCount = 0

for (const r of reqs) {
  const m = meta[r.id] || {}
  if (DONE.includes(r.status)) {
    deliveredCount++
    const ov = m.earned_cents !== undefined && m.earned_cents !== '' ? parseInt(String(m.earned_cents), 10) : NaN
    if (Number.isFinite(ov)) {
      overrides += ov
      overrideCount++
    } else {
      base += Number(r.amount_cents) || 0
      if (String(m.round) === '2' && m.stage === 'paid') { round2 += 1000; round2Count++ }
    }
  }
  if (m.watch_paid_at) {
    const fee = m.watch_fee_cents !== undefined && m.watch_fee_cents !== '' ? parseInt(String(m.watch_fee_cents), 10) : 900
    watch += Number.isFinite(fee) ? fee : 900
    watchCount++
  }
}

const total = base + round2 + overrides + watch + adjustment

console.log('='.repeat(62))
console.log('EARNINGS BREAKDOWN (what the dashboard shows)')
console.log('='.repeat(62))
console.log(`Delivered leads (standard)   ${String(deliveredCount - overrideCount).padStart(4)}  ${money(base).padStart(10)}`)
console.log(`  of which round 2 bonus     ${String(round2Count).padStart(4)}  ${money(round2).padStart(10)}`)
console.log(`Delivered with manual amount ${String(overrideCount).padStart(4)}  ${money(overrides).padStart(10)}`)
console.log(`Watch fees ($9 each)         ${String(watchCount).padStart(4)}  ${money(watch).padStart(10)}`)
console.log(`Manual adjustment                 ${money(adjustment).padStart(10)}`)
console.log('-'.repeat(62))
console.log(`TOTAL                             ${money(total).padStart(10)}`)

console.log('\n' + '='.repeat(62))
console.log('POSSIBLE MISSING MONEY')
console.log('='.repeat(62))

const flags = []

// Paid but never marked delivered: the $19 is not counted at all.
for (const r of reqs) {
  const m = meta[r.id] || {}
  if (!DONE.includes(r.status) && m.stage === 'paid') {
    flags.push({ kind: 'PAID BUT NOT MARKED DELIVERED', worth: Number(r.amount_cents) || 1900, r, m })
  }
}

// Round 2 delivered without stage=paid: the extra $10 is not counted.
for (const r of reqs) {
  const m = meta[r.id] || {}
  if (DONE.includes(r.status) && String(m.round) === '2' && m.stage !== 'paid') {
    const ov = m.earned_cents !== undefined && m.earned_cents !== '' ? parseInt(String(m.earned_cents), 10) : NaN
    if (!Number.isFinite(ov)) flags.push({ kind: 'ROUND 2 DELIVERED, $10 NOT COUNTED', worth: 1000, r, m })
  }
}

// Delivered but counted as zero.
for (const r of reqs) {
  const m = meta[r.id] || {}
  if (!DONE.includes(r.status)) continue
  const ov = m.earned_cents !== undefined && m.earned_cents !== '' ? parseInt(String(m.earned_cents), 10) : NaN
  const counted = Number.isFinite(ov) ? ov : Number(r.amount_cents) || 0
  if (counted === 0) flags.push({ kind: 'DELIVERED BUT COUNTS AS $0', worth: 0, r, m })
}

// Notes mentioning payment on a lead that is not counted as delivered.
for (const r of reqs) {
  const m = meta[r.id] || {}
  if (DONE.includes(r.status)) continue
  const text = `${m.notes || ''} ${r.admin_notes || ''}`.toLowerCase()
  if (/\bpaid\b|\bpayment received\b|\btransferred\b/.test(text) && m.stage !== 'paid') {
    flags.push({ kind: 'NOTES SAY PAID, NOT COUNTED', worth: Number(r.amount_cents) || 1900, r, m })
  }
}

// Asked about the watch list and the thread suggests they paid, but no fee recorded.
for (const r of reqs) {
  const m = meta[r.id] || {}
  if (m.watch_paid_at || !m.watch_asked_at) continue
  const text = `${m.notes || ''}`.toLowerCase()
  if (/\bpaid\b|\bwatch\b.*\bpaid\b/.test(text)) {
    flags.push({ kind: 'WATCH NOTES SAY PAID, NO FEE RECORDED', worth: 900, r, m })
  }
}

if (flags.length === 0) {
  console.log('Nothing flagged.')
} else {
  const byKind = {}
  for (const f of flags) (byKind[f.kind] ||= []).push(f)
  let potential = 0
  for (const [kind, list] of Object.entries(byKind)) {
    const sum = list.reduce((s, f) => s + f.worth, 0)
    potential += sum
    console.log(`\n${kind}  (${list.length}, up to ${money(sum)})`)
    for (const f of list) {
      const note = (f.m.notes || f.r.admin_notes || '').toString().slice(0, 52)
      console.log(`   ${String(f.r.learner_name || '').trim().padEnd(26).slice(0, 26)} ${f.r.status.padEnd(10)} ${String(f.r.created_at).slice(0, 10)}  ${note}`)
    }
  }
  console.log(`\nMAXIMUM uncounted if every flag is real money: ${money(potential)}`)
  console.log(`Would take the total to: ${money(total + potential)}`)
}

console.log('\n' + '='.repeat(62))
console.log('NOTE ON THE MANUAL ADJUSTMENT')
console.log('='.repeat(62))
console.log(`The ${money(adjustment)} adjustment was added on 2026-07-30 to put back 8 watch`)
console.log('fees the old Remove button had erased. Those 8 leads no longer carry a')
console.log('watch_paid_at, so they are NOT also being counted in the $9 line above.')
console.log('Mellissa was erased after that date and has now been restored properly,')
console.log('so she is counted once, in the $9 line, not in the adjustment.')
