'use client'

import Link from 'next/link'
import { LogoFull } from '@/components/Logo'
import { UniqAttribution } from '@/components/UniqAttribution'
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
                desc="We'll send you the verified instructor's details (name, number, pass rate) so you can contact them directly."
              />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                Request submitted
              </h1>
              <p className="text-center text-slate-500 mb-6">
                We have your details. Skip the queue and we'll prioritise you for free.
              </p>

              <a
                href={`https://wa.me/6581190308?text=${encodeURIComponent(`Hi, I just submitted a request on Drive Finder SG${requestId ? ` (ref ${requestId.slice(0, 8)})` : ''}. Please prioritise my match!`)}`}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2.5 w-full px-5 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base transition-colors shadow-lg shadow-emerald-500/25 mb-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Message us to get prioritised for free
              </a>
              <p className="text-center text-xs text-slate-400 mb-8">
                Most prioritised requests are matched within 48 hours.
              </p>

              <div className="space-y-3 mb-2">
                <InfoRow
                  title="Otherwise we'll reach out within 7 days"
                  desc="On WhatsApp or email. Watch both, sometimes WhatsApp delivery is delayed."
                />
                <InfoRow
                  title="No payment taken"
                  desc="You haven't been charged. We'll only send a payment link if we confirm we can match you."
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

        <div className="mt-6 flex justify-center">
          <UniqAttribution variant="card" />
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
