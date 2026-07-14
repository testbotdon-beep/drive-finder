import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ids = await redis.lrange('drivefinder:requests', 0, -1)
console.log(`Total requests: ${ids.length}\n`)

const requests = []
for (const id of ids) {
  const r = await redis.hgetall(`drivefinder:req:${id}`)
  if (r && Object.keys(r).length > 0) requests.push(r)
}

const byStatus = {}
for (const r of requests) {
  const s = r.status || 'unknown'
  byStatus[s] = (byStatus[s] || 0) + 1
}

console.log('By status:')
for (const [k, v] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${v}`)
}

const submitted = requests.length
const paid = requests.filter((r) => r.status === 'delivered' || r.status === 'completed' || r.status === 'paid').length
const matched = requests.filter((r) => ['confirmed', 'paid', 'delivered', 'completed'].includes(r.status)).length
const noMatch = requests.filter((r) => r.status === 'voided' || r.status === 'no_match' || r.status === 'closed_no_match').length
const pending = requests.filter((r) => r.status === 'submitted' || r.status === 'pending').length

console.log('\nFunnel:')
console.log(`  Submissions:        ${submitted}`)
console.log(`  Pending review:     ${pending}`)
console.log(`  Matched (offered):  ${matched}`)
console.log(`  No match closed:    ${noMatch}`)
console.log(`  Paid:               ${paid}`)

if (submitted > 0) {
  console.log(`\nConversion rates:`)
  console.log(`  Submission → Match: ${((matched / submitted) * 100).toFixed(1)}%`)
  console.log(`  Submission → Paid:  ${((paid / submitted) * 100).toFixed(1)}%`)
  if (matched > 0) console.log(`  Match → Paid:       ${((paid / matched) * 100).toFixed(1)}%`)
}

const now = Date.now()
const last30 = requests.filter((r) => {
  const t = new Date(r.created_at || r.submitted_at || 0).getTime()
  return now - t < 30 * 24 * 60 * 60 * 1000
})
console.log(`\nLast 30 days:`)
console.log(`  Submissions: ${last30.length}`)
const last30Paid = last30.filter((r) => ['paid', 'delivered', 'completed'].includes(r.status)).length
console.log(`  Paid:        ${last30Paid}`)
if (last30.length > 0) {
  console.log(`  Conv rate:   ${((last30Paid / last30.length) * 100).toFixed(1)}%`)
}
