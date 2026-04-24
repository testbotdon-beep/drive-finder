#!/usr/bin/env node
/**
 * Scrapes SPF private driving instructor data (2026 layout).
 *
 * Source page:
 *   https://www.police.gov.sg/Knowledge-Hub/Traffic/Traffic-Matters/Waiting-Time-and-Passing-Rates-of-Theory-and-Practical-Tests
 *
 * Pipeline:
 *   1. Find PDI pass rate tables (6 total: Class 3 x 3 centres, Class 3A x 3 centres, 1st Time only)
 *   2. Find contact directory table (~229 rows with Name + Phone)
 *   3. Join by name
 *
 * Usage:
 *   1. Save the SPF page as HTML (Cmd+S -> Webpage Complete) to ~/Downloads/spf-page.html
 *   2. cp ~/Downloads/spf-page.html /tmp/spf-page.html
 *   3. node scripts/scrape-spf-v2.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'

const __dirname = dirname(fileURLToPath(import.meta.url))
const html = readFileSync('/tmp/spf-page.html', 'utf-8')
const $ = cheerio.load(html)

function centreCode(text) {
  if (/bukit\s*batok/i.test(text)) return 'BBDC'
  if (/comfort\s*del\s*gro/i.test(text)) return 'CDC'
  if (/singapore\s*safety|ssdc/i.test(text)) return 'SSDC'
  return null
}

/** Walk backwards (siblings of self, then siblings of each ancestor) to find
 *  the nearest text that mentions a centre. */
function findCentreBefore($el) {
  let $n = $el
  while ($n.length) {
    const prev = $n.prevAll().toArray()
    for (const e of prev) {
      const t = $(e).text().replace(/\s+/g, ' ')
      const c = centreCode(t)
      if (c) return c
    }
    $n = $n.parent()
    if ($n.is('body') || !$n.length) return null
  }
  return null
}

function extractPassRateTables() {
  const rows = []
  $('table').each((_, tbl) => {
    const $tbl = $(tbl)
    const trs = $tbl.find('tbody tr').toArray()
    if (trs.length < 5 || trs.length > 80) return

    // Header inspection: first 3 rows' combined text
    const headText = trs.slice(0, 3).map((r) => $(r).text().replace(/\s+/g, ' ')).join(' ')

    // Must be a per-PDI pass rate table: "No Name ... Total Tested Total Passed %"
    if (!/No\s+Name/i.test(headText)) return
    if (!/total\s+tested/i.test(headText)) return

    // Must be 1st Time (skip retest)
    if (!/1st\s*time/i.test(headText)) return

    // Class 3 or 3A only
    let classType
    if (/\bclass\s*3a\b/i.test(headText)) classType = '3A'
    else if (/\bclass\s*3\b/i.test(headText)) classType = '3'
    else return

    // Find centre by walking back through DOM
    const centre = findCentreBefore($tbl)
    if (!centre) return

    // Parse data rows (skip header rows until we find one that starts with a digit in col 1)
    for (const tr of trs) {
      const cells = $(tr).find('td').toArray().map((c) => $(c).text().replace(/\s+/g, ' ').trim())
      if (cells.length < 5) continue
      if (!/^\d+$/.test(cells[0])) continue
      const name = cells[1].trim().toUpperCase()
      const tested = parseInt(cells[2], 10)
      const passed = parseInt(cells[3], 10)
      if (!name || !Number.isFinite(tested) || !Number.isFinite(passed)) continue
      rows.push({
        name,
        test_centre: centre,
        class_type: classType,
        transmission: classType === '3A' ? 'auto' : 'manual',
        tested,
        passed,
        pass_rate: tested > 0 ? Number((passed / tested).toFixed(2)) : 0,
      })
    }
  })
  return rows
}

function extractContacts() {
  const contacts = {}
  $('table').each((_, tbl) => {
    const $tbl = $(tbl)
    const trs = $tbl.find('tbody tr').toArray()
    if (trs.length < 50) return // contact list is large

    const headText = trs.slice(0, 3).map((r) => $(r).text().replace(/\s+/g, ' ')).join(' ')
    if (!/S\/?N.*Name.*Phone/i.test(headText)) return

    for (const tr of trs) {
      const cells = $(tr).find('td').toArray().map((c) => $(c).text().replace(/\s+/g, ' ').trim())
      if (cells.length !== 3) continue
      if (!/^\d+$/.test(cells[0])) continue
      const name = cells[1].trim().toUpperCase()
      const phone = cells[2].replace(/\D/g, '')
      if (name && phone.length >= 8) contacts[name] = phone
    }
  })
  return contacts
}

console.log('Parsing per-PDI pass rate tables...')
const passRates = extractPassRateTables()
console.log(`  Pass rate rows: ${passRates.length}`)
const byCentreClass = {}
for (const r of passRates) {
  const k = `${r.test_centre}/${r.class_type}`
  byCentreClass[k] = (byCentreClass[k] || 0) + 1
}
for (const [k, v] of Object.entries(byCentreClass).sort()) console.log(`    ${k}: ${v}`)

console.log('\nParsing contact directory...')
const contacts = extractContacts()
console.log(`  Contact rows: ${Object.keys(contacts).length}`)

console.log('\nMerging...')
const seen = new Set()
const merged = []
for (const r of passRates) {
  const phone = contacts[r.name]
  if (!phone) continue
  const key = `${r.name}__${r.test_centre}__${r.class_type}`
  if (seen.has(key)) continue
  seen.add(key)
  merged.push({
    ...r,
    phone,
    hourly_rate: r.test_centre === 'CDC' && r.pass_rate > 0.65 ? 60 : 55,
  })
}

console.log(`\nFinal merged records: ${merged.length}`)

const nameSet = new Set(merged.map((m) => m.name))
const missingPhone = [...new Set(passRates.map((r) => r.name))].filter((n) => !contacts[n])
const missingPassRate = Object.keys(contacts).filter((n) => !passRates.find((r) => r.name === n))
console.log(`PDIs with pass rate but no phone: ${missingPhone.length}`)
console.log(`PDIs with phone but no pass rate: ${missingPassRate.length}`)
console.log(`Unique PDIs in final merged: ${nameSet.size}`)

const out = join(__dirname, '..', 'data', 'spf-instructors.json')
writeFileSync(out, JSON.stringify(merged, null, 2))
console.log(`\nSaved to ${out}`)
