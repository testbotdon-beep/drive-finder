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

  // One pipelined round trip, not one HTTP request per request id. Promise.all
  // here meant 450+ separate calls to Upstash on every poll, which took 3-6s and
  // intermittently failed the whole route ("Failed to load" in the dashboard).
  // Cost grows with the request count, so this only ever got worse.
  const metaPipeline = redis.pipeline()
  for (const r of requests) {
    metaPipeline.hgetall(`drivefinder:req-meta:${r.id}`)
  }
  // Always at least one command, so the pipeline is never empty even with no requests.
  metaPipeline.get('drivefinder:earnings-adjustment')
  const pipelineResults = await metaPipeline.exec()

  const metaResults = pipelineResults.slice(0, requests.length)
  const adjustmentRaw = pipelineResults[requests.length]

  requests.forEach((r, idx) => {
    const meta = metaResults[idx] as Record<string, string> | null
    if (meta && Object.keys(meta).length > 0) {
      metaMap[r.id] = meta
    }
  })

  // Manual earnings correction (e.g. watch fees erased by watch-list removals). See drivefinder:earnings-adjustment-note.
  const adjustment_cents = Number(adjustmentRaw) || 0

  return NextResponse.json({ requests, instructors, meta: metaMap, adjustment_cents })
}
