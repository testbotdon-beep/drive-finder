import { NextRequest, NextResponse } from 'next/server'
import { getInstructors } from '@/lib/db'
import { getSnapshot, rebuildSnapshot, reconcileRecent } from '@/lib/snapshot'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // One GET of a single gzipped key, instead of an LRANGE plus two HGETALLs per
  // request. At 462 requests that was ~926 Redis commands on every 2-minute
  // poll, which is what burned through the monthly plan allowance. ?rebuild=1
  // forces a re-read from the source hashes if the cache ever looks wrong.
  const force = req.nextUrl.searchParams.get('rebuild') === '1'
  // reconcileRecent re-checks the newest ids against Redis on every read, so a
  // new form submission always shows up here even if its cache write failed.
  // `verified` is false only when Redis would not answer at all, and the
  // dashboard surfaces that rather than implying the list is current.
  let snap
  let verified = true
  if (force) {
    snap = await rebuildSnapshot()
  } else {
    const result = await reconcileRecent(await getSnapshot())
    snap = result.snap
    verified = result.verified
  }

  // Instructors come from a JSON file on disk, so they cost nothing.
  const instructors = getInstructors().filter((i) => i.is_active)

  return NextResponse.json({
    requests: snap.requests,
    instructors,
    meta: snap.meta,
    adjustment_cents: snap.adjustment_cents,
    // Folded in so the dashboard no longer needs a second polling request.
    statuses: snap.statuses,
    dates: snap.dates,
    built_at: snap.built_at,
    verified,
  })
}
