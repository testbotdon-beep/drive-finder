import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/db'
import { getSnapshot, patchStatusInSnapshot } from '@/lib/snapshot'

const KEY = 'drivefinder:instructor-status'
const DATE_KEY = 'drivefinder:instructor-status-date'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Served from the same cached snapshot as /api/admin/list, so polling this
  // costs one GET rather than two HGETALLs of a 114-field hash.
  const snap = await getSnapshot()
  return NextResponse.json({ statuses: snap.statuses, dates: snap.dates })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.instructorId || body?.status === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const redis = getRedis()
  if (body.status === '') {
    await Promise.all([
      redis.hdel(KEY, body.instructorId),
      redis.hdel(DATE_KEY, body.instructorId),
    ])
    await patchStatusInSnapshot(body.instructorId, null, null)
  } else {
    const date = typeof body.updated_at === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(body.updated_at)
      ? body.updated_at
      : new Date().toISOString()
    await Promise.all([
      redis.hset(KEY, { [body.instructorId]: body.status }),
      redis.hset(DATE_KEY, { [body.instructorId]: date }),
    ])
    await patchStatusInSnapshot(body.instructorId, body.status, date)
  }
  return NextResponse.json({ ok: true })
}
