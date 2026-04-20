import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequest, updateRequest } from '@/lib/db'
import { getStripe, PRICE_CENTS } from '@/lib/stripe'

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

  const request = await getRequest(parsed.data.requestId)
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }
  if (request.status !== 'submitted') {
    return NextResponse.json(
      { error: `Request status is "${request.status}", expected "submitted"` },
      { status: 400 }
    )
  }

  let checkoutUrl: string | null = null
  let paymentIntentId: string | null = null

  try {
    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://drivefindersg.uqlabs.co'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sgd',
            unit_amount: PRICE_CENTS,
            product_data: {
              name: 'Driving Instructor Match',
              description:
                'We have confirmed 2 to 3 available, high pass rate instructors matching your criteria. Pay $19 and we will send you their details with a warm intro.',
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        capture_method: 'manual',
        description: `Drive Finder SG match for ${request.learner_name}`,
        metadata: {
          request_id: request.id,
          learner_name: request.learner_name,
        },
      },
      customer_email: request.learner_email,
      success_url: `${appUrl}/success?id=${request.id}&paid=1`,
      cancel_url: `${appUrl}/`,
      metadata: { request_id: request.id },
    })
    checkoutUrl = session.url
    paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    if (msg.includes('STRIPE_SECRET_KEY not set')) {
      console.warn('[confirm] Stripe not configured, simulating confirmation')
      checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/success?id=${request.id}&paid=1`
    } else {
      console.error('[confirm] Stripe error:', msg)
      return NextResponse.json({ error: 'Payment link creation failed' }, { status: 500 })
    }
  }

  await updateRequest(request.id, {
    status: 'confirmed',
    stripe_payment_intent_id: paymentIntentId,
    matched_instructor_ids: JSON.stringify(parsed.data.instructorIds),
    admin_notes: parsed.data.notes || null,
  })

  return NextResponse.json({ ok: true, checkoutUrl })
}
