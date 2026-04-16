import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, type MatchRequest, type Instructor } from '@/lib/db'
import { captureAuthHold } from '@/lib/stripe'
import { sendMatchesDelivered } from '@/lib/email'

const Schema = z.object({
  requestId: z.string().min(1),
  instructorIds: z.array(z.string()).min(1).max(5),
  notes: z.string().max(500).optional(),
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

  const placeholders = parsed.data.instructorIds.map(() => '?').join(',')
  const instructors = db
    .prepare(`SELECT * FROM instructors WHERE id IN (${placeholders})`)
    .all(...parsed.data.instructorIds) as Instructor[]

  if (instructors.length === 0) {
    return NextResponse.json({ error: 'No valid instructors' }, { status: 400 })
  }

  let captureStatus = 'captured'
  let captureError: string | null = null

  if (request.stripe_payment_intent_id) {
    try {
      await captureAuthHold(request.stripe_payment_intent_id)
    } catch (e) {
      captureStatus = 'delivered'
      captureError = e instanceof Error ? e.message : 'Unknown error'
      console.error('[deliver] Stripe capture failed:', captureError)
    }
  } else {
    captureStatus = 'delivered'
  }

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE match_requests
     SET status = ?, matched_instructor_ids = ?, admin_notes = ?, delivered_at = ?, captured_at = ?
     WHERE id = ?`
  ).run(
    captureStatus,
    JSON.stringify(parsed.data.instructorIds),
    parsed.data.notes || null,
    now,
    captureStatus === 'captured' ? now : null,
    request.id
  )

  sendMatchesDelivered({
    to: request.learner_email,
    name: request.learner_name,
    matches: instructors.map((i) => ({
      name: i.name,
      phone: i.phone,
      pass_rate: i.pass_rate,
      test_centre: i.test_centre,
      class_type: i.class_type,
    })),
  }).catch((e) => console.error('[deliver] email error:', e))

  return NextResponse.json({
    ok: true,
    status: captureStatus,
    captureError,
  })
}
