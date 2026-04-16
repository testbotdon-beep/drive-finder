import { NextRequest, NextResponse } from 'next/server'
import { getDb, type MatchRequest } from '@/lib/db'
import { voidAuthHold } from '@/lib/stripe'
import { sendRequestFailed } from '@/lib/email'

// Designed to be called by a cron (e.g. Vercel Cron every hour).
// Auth via CRON_SECRET to prevent unauthorized calls.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const now = new Date().toISOString()

  const stale = db
    .prepare(
      `SELECT * FROM match_requests
       WHERE status = 'pending' AND deadline_at < ?
       LIMIT 50`
    )
    .all(now) as MatchRequest[]

  const results: Array<{
    id: string
    voided: boolean
    error: string | null
  }> = []

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
      voided = true // no payment intent = nothing to void
    }

    db.prepare(
      `UPDATE match_requests
       SET status = ?, voided_at = ?, admin_notes = COALESCE(admin_notes, '') || ' [auto-voided: deadline passed]'
       WHERE id = ?`
    ).run('voided', now, r.id)

    sendRequestFailed({ to: r.learner_email, name: r.learner_name }).catch(
      (e) => console.error('[cron] email error:', e)
    )

    results.push({ id: r.id, voided, error })
  }

  return NextResponse.json({
    ok: true,
    processed: stale.length,
    results,
  })
}
