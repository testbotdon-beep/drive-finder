import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ids = await redis.lrange('drivefinder:requests', 0, -1)
const requests = []
const metas = []

for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (!r) continue
  const m = await redis.hgetall(`drivefinder:req-meta:${id}`)
  requests.push(r)
  metas.push(m || {})
}

const total = requests.length
const completed = ['captured', 'delivered']
const active = ['submitted', 'confirmed', 'pending']

const byStatus = {}
for (const r of requests) {
  const s = r.status || 'unknown'
  byStatus[s] = (byStatus[s] || 0) + 1
}

const paidCount = requests.filter((r) => completed.includes(r.status)).length
const voidedCount = requests.filter((r) => r.status === 'voided').length
const activeCount = requests.filter((r) => active.includes(r.status)).length
const watchListPaidCount = metas.filter((m) => m.watch_paid_at).length
const watchAskedCount = metas.filter((m) => m.watch_asked_at && !m.watch_paid_at).length

let totalEarnedCents = 0
for (let i = 0; i < requests.length; i++) {
  const r = requests[i]
  const m = metas[i]
  if (!completed.includes(r.status)) continue
  const override = m.earned_cents ? parseInt(String(m.earned_cents), 10) : NaN
  if (Number.isFinite(override)) {
    totalEarnedCents += override
  } else {
    const base = typeof r.amount_cents === 'number' ? r.amount_cents : parseInt(String(r.amount_cents), 10) || 0
    totalEarnedCents += base
  }
}
for (const m of metas) {
  if (m.watch_paid_at) totalEarnedCents += 900
}

const bySource = {}
for (const r of requests) {
  const s = r.referral_source || 'Unknown'
  bySource[s] = (bySource[s] || 0) + 1
}

const sourceConvert = {}
for (let i = 0; i < requests.length; i++) {
  const r = requests[i]
  const s = r.referral_source || 'Unknown'
  if (!sourceConvert[s]) sourceConvert[s] = { total: 0, paid: 0 }
  sourceConvert[s].total += 1
  if (completed.includes(r.status)) sourceConvert[s].paid += 1
}

const byCentre = {}
for (const r of requests) {
  const c = r.test_centre || 'unknown'
  byCentre[c] = (byCentre[c] || 0) + 1
}
const centreConvert = {}
for (const r of requests) {
  const c = r.test_centre || 'unknown'
  if (!centreConvert[c]) centreConvert[c] = { total: 0, paid: 0 }
  centreConvert[c].total += 1
  if (completed.includes(r.status)) centreConvert[c].paid += 1
}

const byTransmission = {}
for (const r of requests) {
  const t = String(r.transmission || 'unknown').toLowerCase()
  byTransmission[t] = (byTransmission[t] || 0) + 1
}

const byClass = {}
for (const r of requests) {
  const c = String(r.class_type || 'unknown')
  byClass[c] = (byClass[c] || 0) + 1
}

const byDay = {}
for (const r of requests) {
  const created = String(r.created_at || '')
  if (!created) continue
  const d = new Date(created).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  byDay[d] = (byDay[d] || 0) + 1
}
const days = Object.keys(byDay).sort()
const firstDay = days[0]
const lastDay = days[days.length - 1]
const totalDays = days.length
const avgPerDay = (total / totalDays).toFixed(1)
const bestDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]

const last7 = days.slice(-7)
const last7Total = last7.reduce((s, d) => s + byDay[d], 0)
const last14 = days.slice(-14)
const last14Total = last14.reduce((s, d) => s + byDay[d], 0)

const fmt = (n) => `$${(n / 100).toFixed(2)}`
const pct = (a, b) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '0%'

console.log('\n══════════════════════════════════════════════════════════')
console.log(`  DRIVE FINDER SG · MILESTONE: ${total} APPLICATIONS`)
console.log('══════════════════════════════════════════════════════════\n')

console.log('★ FUNNEL')
console.log(`  Total submitted:       ${total}`)
console.log(`  Active in pipeline:    ${activeCount}`)
console.log(`  Paid (delivered):      ${paidCount}`)
console.log(`  Voided / closed:       ${voidedCount}`)
console.log(`  Watch list (paid $9):  ${watchListPaidCount}`)
console.log(`  Watch asked (pending): ${watchAskedCount}`)

console.log('\n★ STATUS BREAKDOWN')
for (const [k, v] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${String(v).padStart(3)}  (${pct(v, total)})`)
}

console.log('\n★ REVENUE')
console.log(`  Total earned:          ${fmt(totalEarnedCents)}`)
console.log(`  From standard match:   ${fmt(totalEarnedCents - watchListPaidCount * 900)}`)
console.log(`  From watch list ($9):  ${fmt(watchListPaidCount * 900)}`)
console.log(`  Avg per paid lead:     ${fmt(paidCount > 0 ? totalEarnedCents / paidCount : 0)}`)
console.log(`  Avg per total lead:    ${fmt(totalEarnedCents / total)}`)

console.log('\n★ CONVERSION')
console.log(`  Submission → paid:     ${pct(paidCount, total)}`)
const resolved = paidCount + voidedCount
console.log(`  Resolved leads → paid: ${pct(paidCount, resolved)}  (excludes pending)`)

console.log('\n★ TIME')
console.log(`  Days active:           ${totalDays}`)
console.log(`  First lead:            ${firstDay}`)
console.log(`  Latest lead:           ${lastDay}`)
console.log(`  Avg per day:           ${avgPerDay}`)
console.log(`  Best day:              ${bestDayEntry[0]} (${bestDayEntry[1]} leads)`)
console.log(`  Last 7 days:           ${last7Total} leads (${(last7Total/7).toFixed(1)}/day)`)
console.log(`  Last 14 days:          ${last14Total} leads (${(last14Total/14).toFixed(1)}/day)`)

console.log('\n★ BY SOURCE')
const sortedSources = Object.entries(sourceConvert).sort((a, b) => b[1].total - a[1].total)
for (const [src, { total: t, paid: p }] of sortedSources) {
  console.log(`  ${src.padEnd(15)} ${String(t).padStart(3)} leads  →  ${String(p).padStart(2)} paid  (${pct(p, t)})`)
}

console.log('\n★ BY TEST CENTRE')
for (const [c, { total: t, paid: p }] of Object.entries(centreConvert).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${c.padEnd(8)} ${String(t).padStart(3)} leads  →  ${String(p).padStart(2)} paid  (${pct(p, t)})`)
}

console.log('\n★ BY TRANSMISSION / CLASS')
for (const [t, n] of Object.entries(byTransmission).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(8)} ${String(n).padStart(3)}`)
}
for (const [c, n] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) {
  console.log(`  Class ${c.padEnd(2)} ${String(n).padStart(3)}`)
}

console.log('\n══════════════════════════════════════════════════════════')
