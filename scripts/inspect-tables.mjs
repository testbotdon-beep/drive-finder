import { load } from 'cheerio'
import { readFileSync } from 'fs'
const $ = load(readFileSync('/tmp/spf-page.html', 'utf-8'))
$('table').each((i, t) => {
  const rows = $(t).find('tbody tr').toArray()
  if (rows.length < 5 || rows.length > 400) return
  const head = rows.slice(0, 3).map(r => $(r).text().replace(/\s+/g, ' ').trim()).join(' | ').slice(0, 200)
  const firstData = rows[Math.min(5, rows.length - 1)]
  const fd = $(firstData).find('td').toArray().map(c => $(c).text().trim().slice(0, 30)).join(' / ')
  console.log(`\n=== Table ${i}: rows=${rows.length} ===`)
  console.log('  head:', head)
  console.log('  data:', fd.slice(0, 200))
})
