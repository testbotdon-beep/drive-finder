import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/db'

const KEY = 'drivefinder:instructor-status'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const redis = getRedis()
  const data = await redis.hgetall(KEY)
  return NextResponse.json({ statuses: data || {} })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.instructorId || !body?.status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const redis = getRedis()
  if (body.status === '') {
    await redis.hdel(KEY, body.instructorId)
  } else {
    await redis.hset(KEY, { [body.instructorId]: body.status })
  }
  return NextResponse.json({ ok: true })
}
