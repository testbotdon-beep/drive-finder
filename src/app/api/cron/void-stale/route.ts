import { NextRequest, NextResponse } from 'next/server'
import { listRequestsByStatus, updateRequest } from '@/lib/db'
import { voidAuthHold } from '@/lib/stripe'
import { sendRequestFailed } from '@/lib/email'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()
  const pending = await listRequestsByStatus('pending')
  const submitted = await listRequestsByStatus('submitted')
  const stale = [...pending, ...submitted].filter((r) => r.deadline_at < now)

  const results: Array<{ id: string; voided: boolean; error: string | null }> = []

  for (const r of stale) {
    let voided = false
    let error: string | null = null
    if (r.stripe_payment_intent_id) {
      try {
        await voidAuthHold(r.stripe_payment_intent_id)
        voided = true
      } catch (e) {
        error = e instanceof Error ? e.message : 'Unknown error'
      }
    } else {
      voided = true
    }

    await updateRequest(r.id, {
      status: 'voided',
      voided_at: now,
      admin_notes: (r.admin_notes || '') + ' [auto-voided: deadline passed]',
    })

    sendRequestFailed({ to: r.learner_email, name: r.learner_name }).catch(
      (e) => console.error('[cron] email error:', e)
    )

    results.push({ id: r.id, voided, error })
  }

  return NextResponse.json({ ok: true, processed: stale.length, results })
}
