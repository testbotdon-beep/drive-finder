import { NextRequest, NextResponse } from 'next/server'
import { getRequest, updateRequest } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const requestId = body?.requestId
  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
  }

  const request = await getRequest(requestId)
  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (request.status === 'confirmed' && request.stripe_payment_intent_id) {
    await updateRequest(request.id, { status: 'pending' })
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  return NextResponse.json({ ok: true, status: request.status })
}
