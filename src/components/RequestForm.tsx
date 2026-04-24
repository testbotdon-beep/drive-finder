'use client'

import { useState } from 'react'
import { toast } from 'sonner'

type FormState = {
  test_centre: string
  transmission: string
  class_type: string
  learner_name: string
  learner_phone: string
  learner_email: string
  notes: string
}

const INITIAL: FormState = {
  test_centre: '',
  transmission: '',
  class_type: '3A',
  learner_name: '',
  learner_phone: '',
  learner_email: '',
  notes: '',
}

export function RequestForm() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!agreed) {
      toast.error('Please agree to the Terms of Service and Privacy Policy first.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      window.location.href = `/success?id=${data.requestId}`
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl mx-auto bg-white border border-slate-200/80 rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 20px 60px -12px rgba(10,22,40,0.08)' }}
    >
      <div className="p-6 md:p-8 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Test centre" required>
            <select
              required
              className="input-field"
              value={form.test_centre}
              onChange={(e) => update('test_centre', e.target.value)}
            >
              <option value="">Choose a centre</option>
              <option value="BBDC">BBDC (Bukit Batok)</option>
              <option value="CDC">CDC / Ubi (ComfortDelGro)</option>
              <option value="SSDC">SSDC (Woodlands)</option>
              <option value="ANY">No preference</option>
            </select>
          </Field>

          <Field label="Transmission" required>
            <select
              required
              className="input-field"
              value={form.transmission}
              onChange={(e) => {
                update('transmission', e.target.value)
                update('class_type', e.target.value === 'manual' ? '3' : '3A')
              }}
            >
              <option value="">Choose</option>
              <option value="auto">Automatic (Class 3A)</option>
              <option value="manual">Manual (Class 3)</option>
            </select>
          </Field>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Your name" required>
            <input
              required
              type="text"
              className="input-field"
              placeholder="Jane Tan"
              value={form.learner_name}
              onChange={(e) => update('learner_name', e.target.value)}
            />
          </Field>

          <Field label="WhatsApp number" required>
            <input
              required
              type="tel"
              className="input-field"
              placeholder="9123 4567"
              value={form.learner_phone}
              onChange={(e) => update('learner_phone', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Email" required>
          <input
            required
            type="email"
            className="input-field"
            placeholder="you@email.com"
            value={form.learner_email}
            onChange={(e) => update('learner_email', e.target.value)}
          />
        </Field>

        <Field label="Anything else? (optional)">
          <textarea
            className="input-field min-h-[80px] resize-none"
            placeholder="When you want to start, preferred language, schedule constraints, past test attempts, etc."
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            We'll do our best to accommodate your preferences but can't guarantee every request. Our matching is based on test centre, transmission, and instructor availability.
          </p>
        </Field>
      </div>

      <div className="bg-slate-50/80 border-t border-slate-100 px-6 md:px-8 py-5 space-y-4">
        <label className="flex items-start gap-2.5 text-[13px] text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
          />
          <span>
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-emerald-700 font-medium hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" className="text-emerald-700 font-medium hover:underline">Privacy Policy</a>.
            I understand instructor availability is verified within 14 days of my match being delivered and can change without notice.
          </span>
        </label>
        <button
          type="submit"
          disabled={loading || !agreed}
          className="btn-primary btn-cta w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Submitting...
            </span>
          ) : (
            'Submit Request (free)'
          )}
        </button>

        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
          <span>No payment required</span>
          <span>We respond within a week</span>
          <span>PDPA compliant</span>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-emerald-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
