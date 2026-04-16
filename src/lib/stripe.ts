import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || key.includes('REPLACE_ME')) {
      throw new Error(
        'STRIPE_SECRET_KEY not set. Add your Stripe TEST key to .env.local — see https://dashboard.stripe.com/test/apikeys'
      )
    }
    _stripe = new Stripe(key)
  }
  return _stripe
}

export const PRICE_CENTS = parseInt(process.env.PRICE_AMOUNT_CENTS || '1900', 10)

// Creates an auth-hold (manual capture). Money is NOT taken until we call capture().
export async function createAuthHold(params: {
  email: string
  requestId: string
  description: string
}): Promise<{ paymentIntentId: string; clientSecret: string }> {
  const stripe = getStripe()
  const intent = await stripe.paymentIntents.create({
    amount: PRICE_CENTS,
    currency: 'sgd',
    capture_method: 'manual', // THE KEY: auth-only, no capture yet
    receipt_email: params.email,
    description: params.description,
    metadata: {
      request_id: params.requestId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  })
  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret!,
  }
}

// Captures the auth-hold → money moves to us
export async function captureAuthHold(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe()
  return stripe.paymentIntents.capture(paymentIntentId)
}

// Voids the auth-hold → no money moves, no fees
export async function voidAuthHold(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe()
  return stripe.paymentIntents.cancel(paymentIntentId, {
    cancellation_reason: 'requested_by_customer',
  })
}
