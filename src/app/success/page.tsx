'use client'

import Link from 'next/link'
import { LogoFull } from '@/components/Logo'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const paid = params.get('paid') === '1'
  const requestId = params.get('id')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (paid && requestId) {
      fetch('/api/payment-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
        .then((r) => r.json())
        .then(() => setConfirmed(true))
        .catch(() => setConfirmed(true))
    }
  }, [paid, requestId])

  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center px-6 py-12">
      <div className="max-w-lg w-full">
        <div className="flex justify-center mb-8">
          <Link href="/"><LogoFull /></Link>
        </div>

        <div
          className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 20px 60px -12px rgba(10,22,40,0.08)' }}
        >
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 grid place-items-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>

          {paid ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                Payment received
              </h1>
              <p className="text-center text-slate-500 mb-8">
                {confirmed
                  ? "We're preparing your instructor matches now. You'll receive them by email and WhatsApp shortly."
                  : 'Processing...'}
              </p>
              <InfoRow
                title="What happens next"
                desc="We'll send you 2 to 3 verified instructor details with warm introductions via email. They're expecting your message."
              />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                Request submitted
              </h1>
              <p className="text-center text-slate-500 mb-8">
                We'll check which instructors are available and match your criteria. You'll hear from us within 7 days.
              </p>
              <div className="space-y-3 mb-8">
                <InfoRow
                  title="No payment taken"
                  desc="You haven't been charged. We'll only send a payment link if we confirm we can match you."
                />
                <InfoRow
                  title="Check your email"
                  desc="We sent a confirmation. We'll also reach out on WhatsApp if we need more info."
                />
              </div>
            </>
          )}

          <Link
            href="/"
            className="block text-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mt-6"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-50 grid place-items-center">
        <div className="text-slate-500">Loading...</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}

function InfoRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
      <div className="h-8 w-8 rounded-lg bg-white border border-slate-200/60 grid place-items-center text-slate-500 shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}
