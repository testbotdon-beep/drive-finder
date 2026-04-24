import { load } from 'cheerio'
import { readFileSync } from 'fs'
const $ = load(readFileSync('/tmp/spf-page.html', 'utf-8'))

const pdiTableIdxs = [24, 25, 26, 27, 28, 29]

const allTables = $('table').toArray()
for (const idx of pdiTableIdxs) {
  const t = allTables[idx]
  console.log(`\n=== Table ${idx} ===`)

  // Walk up the DOM to find parent container, then walk backwards to find centre name
  const $t = $(t)
  const parents = [$t]
  let p = $t.parent()
  for (let i = 0; i < 6; i += 1) {
    parents.push(p)
    p = p.parent()
  }

  // Try to find preceding heading or paragraph with centre name
  let found = null
  let $search = $t
  while ($search.length) {
    const prev = $search.prevAll().toArray()
    for (const e of prev) {
      const text = $(e).text().replace(/\s+/g, ' ').trim()
      if (/bukit batok|comfortdelgro|singapore safety|ssdc|bbdc|cdc/i.test(text)) {
        found = text.slice(0, 100)
        break
      }
    }
    if (found) break
    $search = $search.parent()
    if ($search.is('body') || !$search.length) break
  }

  console.log('  preceding centre marker:', found || '(none)')

  // Try reading id/name/data attributes of parent anchors
  const acc = $t.closest('[id], [data-id], section').first()
  if (acc.length) console.log('  nearest container id/data:', acc.attr('id') || acc.attr('data-id') || acc.prop('tagName'))
}
