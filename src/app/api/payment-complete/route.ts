import { NextRequest, NextResponse } from 'next/server'
import { getDb, type MatchRequest } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const requestId = body?.requestId
  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
  }

  const db = getDb()
  const request = db
    .prepare(`SELECT * FROM match_requests WHERE id = ?`)
    .get(requestId) as MatchRequest | undefined

  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (request.status === 'confirmed' && request.stripe_payment_intent_id) {
    db.prepare(`UPDATE match_requests SET status = ? WHERE id = ?`).run(
      'pending',
      request.id
    )
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  return NextResponse.json({ ok: true, status: request.status })
}
