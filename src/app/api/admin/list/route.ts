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
  for (const r of requests) {
    const meta = await redis.hgetall(`drivefinder:req-meta:${r.id}`)
    if (meta && Object.keys(meta).length > 0) {
      metaMap[r.id] = meta as Record<string, string>
    }
  }

  return NextResponse.json({ requests, instructors, meta: metaMap })
}
