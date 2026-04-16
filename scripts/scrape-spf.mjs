/**
 * Scrapes the SPF private driving instructor data from the saved HTML page.
 * Extracts pass rate tables (6 tables: 3 centres x 2 class types) and the
 * contact directory table, then merges them into a single JSON file.
 *
 * Usage: node scripts/scrape-spf.mjs
 * Output: data/spf-instructors.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const html = readFileSync('/tmp/spf-page.html', 'utf-8')

// ─── Extract pass rate tables ──────────────────────────────────────────────
// The page has two accordion sections: Class 3 and Class 3A
// Each section has 3 tables: BBDC, CDC, SSDC
// Tables contain: No, Name, Total Tested, Total Passed, %

/**
 * Extracts instructor rows from a single HTML table.
 * Each data row has cells: No | Name | Tested | Passed | %
 */
function extractTableRows(tableHtml) {
  const rows = []
  // Match each <tr> that has instructor data (has a number in first cell and a name)
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch

  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const trContent = trMatch[1]
    // Extract all <td> contents
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
    const cells = []
    let tdMatch
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      // Strip HTML tags and decode entities, trim whitespace
      const text = tdMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&ndash;/g, '-')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&amp;/g, '&')
        .trim()
      cells.push(text)
    }

    // Skip header rows (contain "No", "Name", "Total Tested", etc.)
    if (cells.length >= 4 && /^\d+$/.test(cells[0])) {
      const name = cells[1].trim()
      const tested = parseInt(cells[2], 10)
      const passed = parseInt(cells[3], 10)
      const passRatePct = parseInt(cells[4], 10)
      if (name && !isNaN(tested)) {
        rows.push({
          name,
          tested,
          passed: isNaN(passed) ? 0 : passed,
          pass_rate_pct: isNaN(passRatePct) ? 0 : passRatePct,
        })
      }
    }
  }
  return rows
}

/**
 * Finds the section boundaries for Class 3 and Class 3A pass rate tables.
 * Uses the accordion-item divs with id="acc-3-1" (Class 3) and id="acc-3-2" (Class 3A).
 * We need the content INSIDE these accordion items, not the side-nav links.
 */
function findPassRateSections(html) {
  // Find the actual accordion-item elements (not the side-nav links)
  // These are: <div class="accordion-item" id="acc-3-1">
  const acc31Pattern = '<div class="accordion-item" id="acc-3-1">'
  const acc32Pattern = '<div class="accordion-item" id="acc-3-2">'
  const acc33Pattern = '<div class="accordion-item" id="acc-3-3">'

  const class3Start = html.indexOf(acc31Pattern)
  const class3AStart = html.indexOf(acc32Pattern)
  const contactStart = html.indexOf(acc33Pattern)

  if (class3Start === -1 || class3AStart === -1) {
    throw new Error('Cannot find Class 3 / Class 3A accordion sections')
  }

  const class3Html = html.slice(class3Start, class3AStart)
  const class3AHtml = html.slice(class3AStart, contactStart !== -1 ? contactStart : undefined)

  return { class3Html, class3AHtml }
}

/**
 * Extracts all tables from a section, identifying which centre each belongs to.
 */
function extractCentreData(sectionHtml, classType, transmission) {
  const results = []

  // Split by centre headers
  const centrePatterns = [
    { pattern: /Bukit Batok Driving Centre/i, centre: 'BBDC' },
    { pattern: /ComfortDelGro Driving Centre/i, centre: 'CDC' },
    { pattern: /Singapore Safety Driving Centre/i, centre: 'SSDC' },
  ]

  // Find each <table> and determine which centre it belongs to
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
  let tableMatch
  const tables = []

  while ((tableMatch = tableRegex.exec(sectionHtml)) !== null) {
    tables.push({ index: tableMatch.index, html: tableMatch[0] })
  }

  for (const table of tables) {
    // Look backwards from the table to find the nearest centre header
    const beforeTable = sectionHtml.slice(0, table.index)
    let centre = 'UNKNOWN'
    let bestPos = -1

    for (const cp of centrePatterns) {
      const matches = [...beforeTable.matchAll(new RegExp(cp.pattern, 'gi'))]
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1]
        if (lastMatch.index > bestPos) {
          bestPos = lastMatch.index
          centre = cp.centre
        }
      }
    }

    const rows = extractTableRows(table.html)
    for (const row of rows) {
      results.push({
        ...row,
        test_centre: centre,
        class_type: classType,
        transmission,
      })
    }
  }

  return results
}

// ─── Extract contact directory ──────────────────────────────────────────────
function extractContacts(html) {
  const contacts = new Map() // name -> phone

  // Find the contact section (acc-3-3)
  const contactIdx = html.indexOf('acc-3-3')
  if (contactIdx === -1) throw new Error('Cannot find contact section')

  const contactSection = html.slice(contactIdx)

  // The contact table has cells with width: 244px for name and width: 151px for phone
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch

  while ((trMatch = trRegex.exec(contactSection)) !== null) {
    const trContent = trMatch[1]
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
    const cells = []
    let tdMatch
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      const text = tdMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim()
      cells.push(text)
    }

    // Contact rows: S/N | Name | Phone
    if (cells.length >= 3 && /^\d+$/.test(cells[0])) {
      const name = cells[1].trim()
      const phone = cells[2].replace(/\s+/g, '').trim()
      if (name && phone && /^\d{8}$/.test(phone)) {
        contacts.set(name.toUpperCase(), phone)
      }
    }
  }

  return contacts
}

// ─── Slugify ──────────────────────────────────────────────────────────────
function slugify(centre, classType, name) {
  const slug = name
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${centre.toLowerCase()}-${classType.toLowerCase()}-${slug}`
}

// ─── Main ─────────────────────────────────────────────────────────────────
const { class3Html, class3AHtml } = findPassRateSections(html)

const class3Data = extractCentreData(class3Html, '3', 'manual')
const class3AData = extractCentreData(class3AHtml, '3A', 'auto')
const contacts = extractContacts(html)

console.log(`Extracted ${class3Data.length} Class 3 entries across all centres`)
console.log(`Extracted ${class3AData.length} Class 3A entries across all centres`)
console.log(`Extracted ${contacts.size} contacts from directory`)

// Merge pass rate data with phone contacts
const allInstructors = [...class3Data, ...class3AData]

// Build final JSON
const output = allInstructors.map((inst) => {
  const phone = contacts.get(inst.name.toUpperCase()) || ''
  const passRate = inst.tested > 0
    ? Math.round((inst.passed / inst.tested) * 100) / 100
    : 0

  return {
    name: inst.name,
    phone,
    test_centre: inst.test_centre,
    class_type: inst.class_type,
    transmission: inst.transmission,
    tested: inst.tested,
    passed: inst.passed,
    pass_rate: passRate,
  }
})

// Sort by centre, class type, then pass rate descending
output.sort((a, b) => {
  if (a.test_centre !== b.test_centre) return a.test_centre.localeCompare(b.test_centre)
  if (a.class_type !== b.class_type) return a.class_type.localeCompare(b.class_type)
  return b.pass_rate - a.pass_rate
})

const outPath = join(__dirname, '..', 'data', 'spf-instructors.json')
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')

console.log(`\nWrote ${output.length} instructors to ${outPath}`)

// Stats
const noPhone = output.filter(i => !i.phone).length
console.log(`  - ${output.filter(i => i.test_centre === 'BBDC').length} at BBDC`)
console.log(`  - ${output.filter(i => i.test_centre === 'CDC').length} at CDC`)
console.log(`  - ${output.filter(i => i.test_centre === 'SSDC').length} at SSDC`)
console.log(`  - ${output.filter(i => i.class_type === '3').length} Class 3 (manual)`)
console.log(`  - ${output.filter(i => i.class_type === '3A').length} Class 3A (auto)`)
console.log(`  - ${noPhone} instructors without phone number`)
