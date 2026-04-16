import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, type MatchRequest } from '@/lib/db'
import { voidAuthHold } from '@/lib/stripe'
import { sendRequestFailed } from '@/lib/email'

const Schema = z.object({
  requestId: z.string().min(1),
  reason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const db = getDb()
  const request = db
    .prepare(`SELECT * FROM match_requests WHERE id = ?`)
    .get(parsed.data.requestId) as MatchRequest | undefined

  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }
  if (request.status !== 'pending') {
    return NextResponse.json(
      { error: `Request already ${request.status}` },
      { status: 400 }
    )
  }

  let voidError: string | null = null
  if (request.stripe_payment_intent_id) {
    try {
      await voidAuthHold(request.stripe_payment_intent_id)
    } catch (e) {
      voidError = e instanceof Error ? e.message : 'Unknown error'
      console.error('[fail] Stripe void failed:', voidError)
    }
  }

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE match_requests
     SET status = ?, admin_notes = ?, voided_at = ?
     WHERE id = ?`
  ).run('voided', parsed.data.reason || null, now, request.id)

  sendRequestFailed({
    to: request.learner_email,
    name: request.learner_name,
  }).catch((e) => console.error('[fail] email error:', e))

  return NextResponse.json({ ok: true, voidError })
}
