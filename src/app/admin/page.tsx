'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatSGD, formatPhone, timeRemaining } from '@/lib/utils'

type Instructor = {
  id: string
  name: string
  phone: string
  test_centre: string
  class_type: string
  transmission: string
  tested: number
  passed: number
  pass_rate: number
  hourly_rate: number
}

type Request = {
  id: string
  test_centre: string
  transmission: string
  class_type: string
  start_date: string
  budget: string
  language: string
  learner_name: string
  learner_phone: string
  learner_email: string
  notes: string | null
  status: string
  stripe_payment_intent_id: string | null
  amount_cents: number
  matched_instructor_ids: string | null
  admin_notes: string | null
  created_at: string
  deadline_at: string
  delivered_at: string | null
  voided_at: string | null
  captured_at: string | null
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('drivefinder_admin_pw')
    if (stored) {
      setPassword(stored)
      setAuthenticated(true)
    }
  }, [])

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-50 grid place-items-center px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sessionStorage.setItem('drivefinder_admin_pw', password)
            setAuthenticated(true)
          }}
          className="bg-white border border-slate-200 rounded-2xl p-8 card-shadow w-full max-w-sm space-y-4"
        >
          <h1 className="text-xl font-bold text-slate-900">Admin Login</h1>
          <input
            type="password"
            required
            className="input-field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-primary w-full">
            Enter
          </button>
        </form>
      </main>
    )
  }

  return <Dashboard password={password} onLogout={() => { sessionStorage.removeItem('drivefinder_admin_pw'); setAuthenticated(false) }} />
}

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [requests, setRequests] = useState<Request[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/list', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (res.status === 401) {
        onLogout()
        return
      }
      const data = await res.json()
      setRequests(data.requests || [])
      setInstructors(data.instructors || [])
    } catch (e) {
      toast.error('Failed to load')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [password, onLogout])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  const activeStatuses = ['submitted', 'confirmed', 'pending']
  const filtered = requests.filter((r) =>
    filter === 'active' ? activeStatuses.includes(r.status) : true
  )

  const submittedCount = requests.filter((r) => r.status === 'submitted').length
  const confirmedCount = requests.filter((r) => r.status === 'confirmed').length
  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const capturedCount = requests.filter((r) => ['captured', 'delivered'].includes(r.status)).length
  const totalEarned = requests
    .filter((r) => ['captured', 'delivered'].includes(r.status))
    .reduce((sum, r) => sum + r.amount_cents, 0)
  const activeCount = submittedCount + confirmedCount + pendingCount

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container-narrow flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-[#0a2540] grid place-items-center text-white font-bold text-xs">
              DF
            </div>
            <span className="font-semibold text-slate-900">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button onClick={load} className="text-slate-600 hover:text-slate-900">
              Refresh
            </button>
            <button onClick={onLogout} className="text-slate-600 hover:text-slate-900">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container-narrow pt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="New" value={String(submittedCount)} accent="#3b82f6" />
          <StatCard label="Active" value={String(activeCount)} accent="#f59e0b" />
          <StatCard label="Earned" value={formatSGD(totalEarned)} accent="#0a2540" />
          <StatCard label="Total" value={String(requests.length)} accent="#6366f1" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === 'active' ? 'bg-[#0a2540] text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === 'all' ? 'bg-[#0a2540] text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            All ({requests.length})
          </button>
        </div>

        {loading && requests.length === 0 ? (
          <div className="text-center py-20 text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
            <div className="text-4xl mb-3">📭</div>
            <div className="font-medium text-slate-900">No requests</div>
            <div className="text-sm text-slate-500 mt-1">
              {filter === 'active'
                ? 'Nothing active right now. Go distribute!'
                : 'No requests have come in yet.'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                instructors={instructors}
                password={password}
                onChange={load}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}

function RequestCard({
  request,
  instructors,
  password,
  onChange,
}: {
  request: Request
  instructors: Instructor[]
  password: string
  onChange: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [failReason, setFailReason] = useState('')
  const [showFail, setShowFail] = useState(false)
  const [busy, setBusy] = useState(false)

  const remaining = timeRemaining(request.deadline_at)

  // Suggest instructors that match the learner's criteria
  const suggested = instructors.filter((i) => {
    if (request.test_centre !== 'ANY' && i.test_centre !== request.test_centre) return false
    if (i.class_type !== request.class_type) return false
    if (request.budget !== 'any') {
      const budget = parseInt(request.budget, 10)
      if (!isNaN(budget) && i.hourly_rate > budget) return false
    }
    return true
  })

  const statusColor: Record<string, string> = {
    submitted: 'bg-blue-50 text-blue-800 border-blue-200',
    confirmed: 'bg-purple-50 text-purple-800 border-purple-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    delivered: 'bg-green-50 text-green-800 border-green-200',
    captured: 'bg-green-50 text-green-800 border-green-200',
    voided: 'bg-slate-100 text-slate-600 border-slate-200',
    failed: 'bg-red-50 text-red-800 border-red-200',
  }

  async function confirm() {
    if (selected.size === 0) {
      toast.error('Pick at least one instructor')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          instructorIds: Array.from(selected),
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Payment link sent to learner!')
      onChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  async function deliver() {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/deliver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          instructorIds: request.matched_instructor_ids ? JSON.parse(request.matched_instructor_ids) : Array.from(selected),
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(data.captureError ? 'Delivered (capture issue, check Stripe)' : 'Delivered + captured!')
      onChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  async function fail() {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/fail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          reason: failReason || 'No available match',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Request voided, no charge')
      onChange()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${statusColor[request.status] || statusColor.pending}`}>
              {request.status.toUpperCase()}
            </span>
            {request.status === 'pending' && (
              <span className={`text-xs font-medium ${remaining.expired ? 'text-red-600' : 'text-slate-600'}`}>
                {remaining.label}
              </span>
            )}
          </div>
          <div className="font-semibold text-slate-900">{request.learner_name}</div>
          <div className="text-sm text-slate-600">
            <a href={`https://wa.me/65${request.learner_phone.replace(/\D/g, '')}`} target="_blank" className="text-blue-600 hover:underline">
              {formatPhone(request.learner_phone)}
            </a>
            {' · '}
            <a href={`mailto:${request.learner_email}`} className="text-blue-600 hover:underline">
              {request.learner_email}
            </a>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          {new Date(request.created_at).toLocaleString('en-SG', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-sm">
        <Meta label="Test centre" value={request.test_centre} />
        <Meta label="Class" value={`${request.class_type} (${request.transmission})`} />
        <Meta label="Start" value={request.start_date} />
        <Meta label="Budget" value={request.budget === 'any' ? 'Flexible' : `$${request.budget}/hr`} />
        <Meta label="Language" value={request.language} />
        <Meta label="Amount" value={formatSGD(request.amount_cents)} />
      </div>

      {request.notes && (
        <div className="mb-5 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
          <span className="font-medium text-slate-500">Notes: </span>
          {request.notes}
        </div>
      )}

      {(request.status === 'submitted' || request.status === 'pending') && (
        <>
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {request.status === 'submitted' ? `Suggested matches (${suggested.length})` : 'Matched instructors'}
            </div>
            {suggested.length === 0 ? (
              <div className="text-sm text-slate-500 italic">
                No instructors match these criteria. Consider failing this request.
              </div>
            ) : (
              <div className="grid gap-2">
                {suggested.map((i) => (
                  <label
                    key={i.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      selected.has(i.id)
                        ? 'border-[#0a2540] bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i.id)}
                      onChange={(e) => {
                        const next = new Set(selected)
                        if (e.target.checked) next.add(i.id)
                        else next.delete(i.id)
                        setSelected(next)
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{i.name}</div>
                      <div className="text-xs text-slate-500">
                        {i.test_centre} · Class {i.class_type} · ${i.hourly_rate}/hr
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {Math.round(i.pass_rate * 100)}%
                      </div>
                      <div className="text-xs text-slate-500">pass rate</div>
                    </div>
                    <a
                      href={`https://wa.me/65${i.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      WA →
                    </a>
                  </label>
                ))}
              </div>
            )}
          </div>

          <textarea
            className="input-field mb-3 text-sm min-h-[60px]"
            placeholder="Internal notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {request.status === 'submitted' && (
              <button
                onClick={confirm}
                disabled={busy || selected.size === 0}
                className="btn-primary text-sm px-4 py-2"
                style={{ background: '#6366f1' }}
              >
                {busy ? 'Sending...' : `Confirm + send payment link (${selected.size} match${selected.size === 1 ? '' : 'es'})`}
              </button>
            )}
            {request.status === 'pending' && (
              <button
                onClick={deliver}
                disabled={busy}
                className="btn-primary btn-accent text-sm px-4 py-2"
              >
                {busy ? 'Working...' : 'Deliver matches + capture $19'}
              </button>
            )}
            <button
              onClick={() => setShowFail(!showFail)}
              disabled={busy}
              className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {request.status === 'submitted' ? 'Reject' : 'Void'}
            </button>
          </div>

          {showFail && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <textarea
                className="input-field text-sm min-h-[60px] mb-2"
                placeholder="Reason for voiding (optional, internal)"
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
              />
              <button
                onClick={fail}
                disabled={busy}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
              >
                Confirm: void hold, no charge
              </button>
            </div>
          )}
        </>
      )}

      {request.status === 'confirmed' && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="text-sm font-semibold text-purple-800 mb-1">Waiting for payment</div>
          <div className="text-xs text-purple-600">
            Payment link sent to {request.learner_email}. Once they pay, this moves to "Pending" and you can deliver.
          </div>
        </div>
      )}

      {!['submitted', 'confirmed', 'pending'].includes(request.status) && request.matched_instructor_ids && (
        <div className="text-sm text-slate-600">
          <span className="font-medium">Matched: </span>
          {(JSON.parse(request.matched_instructor_ids) as string[])
            .map((id) => instructors.find((i) => i.id === id)?.name || id)
            .join(', ')}
        </div>
      )}

      {request.admin_notes && (
        <div className="mt-3 text-xs text-slate-500 italic">{request.admin_notes}</div>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  )
}
