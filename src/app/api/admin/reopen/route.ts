import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequest, updateRequest } from '@/lib/db'

const Schema = z.object({
  requestId: z.string().min(1),
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
  if (['submitted', 'confirmed', 'pending'].includes(request.status)) {
    return NextResponse.json(
      { error: `Already active (${request.status})` },
      { status: 400 }
    )
  }

  const now = new Date()
  const newDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  await updateRequest(request.id, {
    status: 'submitted',
    deadline_at: newDeadline.toISOString(),
    delivered_at: null,
    voided_at: null,
  })

  return NextResponse.json({ ok: true })
}
