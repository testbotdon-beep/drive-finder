import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequest, updateRequest } from '@/lib/db'

const Schema = z.object({
  requestId: z.string().min(1),
  amount_cents: z.number().int().nonnegative().optional(),
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

  const request = await getRequest(parsed.data.requestId)
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }
  if (!['submitted', 'confirmed', 'pending'].includes(request.status)) {
    return NextResponse.json(
      { error: `Request already ${request.status}` },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const updates: Partial<{
    status: string
    matched_instructor_ids: string
    admin_notes: string | null
    delivered_at: string
    amount_cents: number
  }> = {
    status: 'delivered',
    matched_instructor_ids: '[]',
    admin_notes: parsed.data.notes || 'Closed without match, customer paid but no available PDI found',
    delivered_at: now,
  }
  if (parsed.data.amount_cents !== undefined) {
    updates.amount_cents = parsed.data.amount_cents
  }
  await updateRequest(request.id, updates as Parameters<typeof updateRequest>[1])

  return NextResponse.json({ ok: true })
}
