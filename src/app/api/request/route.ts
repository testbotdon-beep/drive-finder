import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { getDb } from '@/lib/db'
import { sendRequestReceived, sendAdminNotification } from '@/lib/email'

const Schema = z.object({
  test_centre: z.enum(['BBDC', 'CDC', 'SSDC', 'ANY']),
  transmission: z.enum(['auto', 'manual']),
  class_type: z.enum(['3', '3A']),
  learner_name: z.string().min(1).max(80),
  learner_phone: z.string().min(6).max(24),
  learner_email: z.string().email().max(200),
  notes: z.string().max(500).optional().default(''),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid form data', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data
  const id = randomUUID()
  const now = new Date()
  const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const priceCents = parseInt(process.env.PRICE_AMOUNT_CENTS || '1900', 10)

  const db = getDb()

  try {
    db.prepare(
      `INSERT INTO match_requests
       (id, test_centre, transmission, class_type, start_date, budget, language,
        learner_name, learner_phone, learner_email, notes, status,
        stripe_payment_intent_id, stripe_client_secret, amount_cents,
        created_at, deadline_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.test_centre,
      data.transmission,
      data.class_type,
      '',
      '',
      '',
      data.learner_name,
      data.learner_phone,
      data.learner_email,
      data.notes,
      'submitted',
      null,
      null,
      priceCents,
      now.toISOString(),
      deadline.toISOString()
    )
  } catch (e) {
    console.error('[request] DB error:', e)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }

  sendRequestReceived({
    to: data.learner_email,
    name: data.learner_name,
    requestId: id,
  }).catch((e) => console.error('[request] email error:', e))

  sendAdminNotification({
    requestId: id,
    learnerName: data.learner_name,
    testCentre: data.test_centre,
    transmission: data.transmission,
    notes: data.notes,
  }).catch((e) => console.error('[request] admin notify error:', e))

  return NextResponse.json({ ok: true, requestId: id })
}
