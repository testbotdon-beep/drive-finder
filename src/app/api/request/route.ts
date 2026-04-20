import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { createRequest, type MatchRequest } from '@/lib/db'
// Emails removed. Don sends payment links manually via WhatsApp.

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

  const request: MatchRequest = {
    id,
    test_centre: data.test_centre,
    transmission: data.transmission,
    class_type: data.class_type,
    learner_name: data.learner_name,
    learner_phone: data.learner_phone,
    learner_email: data.learner_email,
    notes: data.notes || null,
    status: 'submitted',
    stripe_payment_intent_id: null,
    amount_cents: priceCents,
    matched_instructor_ids: null,
    admin_notes: null,
    created_at: now.toISOString(),
    deadline_at: deadline.toISOString(),
    delivered_at: null,
    voided_at: null,
    captured_at: null,
  }

  try {
    await createRequest(request)
  } catch (e) {
    console.error('[request] DB error:', e)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, requestId: id })
}
