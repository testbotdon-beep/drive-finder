import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/db'

const PREFIX = 'drivefinder:req-meta:'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestId = req.nextUrl.searchParams.get('requestId')
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })

  const redis = getRedis()
  const data = await redis.hgetall(`${PREFIX}${requestId}`)
  return NextResponse.json({ meta: data || {} })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.requestId) {
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
  }

  const redis = getRedis()
  const updates: Record<string, string> = {}
  if (body.round !== undefined) updates.round = String(body.round)
  if (body.stage !== undefined) updates.stage = body.stage
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.follow_up_at !== undefined) updates.follow_up_at = body.follow_up_at

  if (body.follow_up_at === '') {
    await redis.hdel(`${PREFIX}${body.requestId}`, 'follow_up_at')
    delete updates.follow_up_at
  }

  if (Object.keys(updates).length > 0) {
    await redis.hset(`${PREFIX}${body.requestId}`, updates)
  }

  return NextResponse.json({ ok: true })
}
