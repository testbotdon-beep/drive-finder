import { NextRequest, NextResponse } from 'next/server'
import { listRequests, getInstructors, getRedis } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requests = await listRequests()
  const instructors = getInstructors().filter((i) => i.is_active)

  const redis = getRedis()
  const metaMap: Record<string, Record<string, string>> = {}
  const metaResults = await Promise.all(
    requests.map((r) => redis.hgetall(`drivefinder:req-meta:${r.id}`))
  )
  requests.forEach((r, idx) => {
    const meta = metaResults[idx]
    if (meta && Object.keys(meta).length > 0) {
      metaMap[r.id] = meta as Record<string, string>
    }
  })

  // Manual earnings correction (e.g. watch fees erased by watch-list removals). See drivefinder:earnings-adjustment-note.
  const adjustmentRaw = await redis.get('drivefinder:earnings-adjustment')
  const adjustment_cents = Number(adjustmentRaw) || 0

  return NextResponse.json({ requests, instructors, meta: metaMap, adjustment_cents })
}
