/**
 * Compare a restored database field by field against the export it came from.
 *   node scripts/verify-restore.mjs <rest-url> <rest-token>
 */
import { readFileSync } from 'fs'

const [URL_ARG, TOKEN_ARG] = process.argv.slice(2)
const dump = JSON.parse(readFileSync('backups/drivefinder-export.json', 'utf-8'))

async function pipeline(commands) {
  const res = await fetch(`${URL_ARG}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN_ARG}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error(JSON.stringify(data))
  return data.map((d) => d.result)
}

const flatToObj = (a) => {
  const o = {}
  if (!Array.isArray(a)) return o
  for (let i = 0; i < a.length; i += 2) o[a[i]] = String(a[i + 1])
  return o
}

let mismatches = 0
let fieldsChecked = 0

async function compare(label, prefix, source) {
  const ids = dump.ids.filter((id) => Array.isArray(source[id]) && source[id].length)
  for (let i = 0; i < ids.length; i += 25) {
    const slice = ids.slice(i, i + 25)
    const got = await pipeline(slice.map((id) => ['HGETALL', `${prefix}${id}`]))
    slice.forEach((id, j) => {
      const expected = flatToObj(source[id])
      const actual = flatToObj(got[j])
      for (const [k, v] of Object.entries(expected)) {
        fieldsChecked++
        if (actual[k] !== v) {
          mismatches++
          if (mismatches <= 5) console.log(`  MISMATCH ${label} ${id}.${k}: expected ${JSON.stringify(v)} got ${JSON.stringify(actual[k])}`)
        }
      }
      const extra = Object.keys(actual).filter((k) => !(k in expected))
      if (extra.length) { mismatches++; console.log(`  EXTRA FIELDS ${label} ${id}:`, extra) }
    })
  }
  console.log(`${label}: ${ids.length} records compared`)
}

await compare('requests', 'drivefinder:req:', dump.requests)
await compare('meta', 'drivefinder:req-meta:', dump.meta)

for (const [key, flat] of Object.entries(dump.hashes)) {
  const [got] = await pipeline([['HGETALL', key]])
  const expected = flatToObj(flat)
  const actual = flatToObj(got)
  let bad = 0
  for (const [k, v] of Object.entries(expected)) { fieldsChecked++; if (actual[k] !== v) bad++ }
  if (bad) mismatches += bad
  console.log(`${key}: ${Object.keys(expected).length} fields, ${bad} bad`)
}

const [adj, ids] = await pipeline([
  ['GET', 'drivefinder:earnings-adjustment'],
  ['LRANGE', 'drivefinder:requests', 0, -1],
])
console.log('adjustment:', adj, adj === String(dump.singles['drivefinder:earnings-adjustment']) ? 'OK' : 'MISMATCH')

const orderOk = ids.length === dump.ids.length && ids.every((id, i) => id === dump.ids[i])
console.log('id list:', ids.length, 'entries, order', orderOk ? 'OK' : 'MISMATCH')
if (!orderOk) mismatches++

console.log('\nfields checked:', fieldsChecked)
console.log('MISMATCHES:', mismatches)
process.exit(mismatches === 0 ? 0 : 1)
