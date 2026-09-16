import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/db'
import { getSnapshot, patchInstructorNoteInSnapshot } from '@/lib/snapshot'

const KEY = 'drivefinder:instructor-notes'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Served from the shared snapshot so a dashboard load reads one key, not four.
  const snap = await getSnapshot()
  return NextResponse.json({ notes: snap.instructorNotes || {} })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body?.instructorId) {
    return NextResponse.json({ error: 'Missing instructorId' }, { status: 400 })
  }
  const redis = getRedis()
  const note = String(body.note || '').trim()
  if (note === '') {
    await redis.hdel(KEY, body.instructorId)
  } else {
    await redis.hset(KEY, { [body.instructorId]: note })
  }
  await patchInstructorNoteInSnapshot(body.instructorId, note)
  return NextResponse.json({ ok: true })
}
