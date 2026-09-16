import { NextRequest, NextResponse } from 'next/server'
import { getInstructors } from '@/lib/db'
import { getSnapshot, rebuildSnapshot } from '@/lib/snapshot'

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
  const snap = force ? await rebuildSnapshot() : await getSnapshot()

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
  })
}
