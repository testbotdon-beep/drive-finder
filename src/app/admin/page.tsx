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
  learner_name: string
  learner_phone: string | number
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
      <main className="min-h-screen bg-[#0a1628] grid place-items-center px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sessionStorage.setItem('drivefinder_admin_pw', password)
            setAuthenticated(true)
          }}
          className="bg-[#111d32] border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20 w-full max-w-sm space-y-4"
        >
          <h1 className="text-xl font-bold text-white">Admin Login</h1>
          <input
            type="password"
            required
            className="w-full px-4 py-3 bg-[#0a1628] border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-cta w-full">Enter</button>
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
  const [tab, setTab] = useState<'requests' | 'instructors'>('requests')
  const [filter, setFilter] = useState<'active' | 'due' | 'completed' | 'all'>('active')
  const [centreFilter, setCentreFilter] = useState<string>('ALL')
  const [contactStatus, setContactStatus] = useState<Record<string, string>>({})
  const [metaMap, setMetaMap] = useState<Record<string, Record<string, string>>>({})

  const loadContactStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contact-status', {
        headers: { Authorization: `Bearer ${password}` },
      })
      const data = await res.json()
      setContactStatus(data.statuses || {})
    } catch {}
  }, [password])

  async function updateContactStatus(instructorId: string, status: string) {
    const next = { ...contactStatus }
    if (status === '') delete next[instructorId]; else next[instructorId] = status
    setContactStatus(next)
    fetch('/api/admin/contact-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ instructorId, status }),
    }).catch(() => {})
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/list', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (res.status === 401) { onLogout(); return }
      const data = await res.json()
      setRequests(data.requests || [])
      setInstructors(data.instructors || [])
      setMetaMap(data.meta || {})
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [password, onLogout])

  useEffect(() => {
    load()
    loadContactStatus()
    const interval = setInterval(() => { load(); loadContactStatus() }, 30000)
    return () => clearInterval(interval)
  }, [load, loadContactStatus])

  const activeStatuses = ['submitted', 'confirmed', 'pending']
  const completedStatuses = ['captured', 'delivered']

  const todaySG = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  const isDue = (r: Request) => {
    if (!activeStatuses.includes(r.status)) return false
    const manual = metaMap[r.id]?.follow_up_at
    return Boolean(manual) && manual <= todaySG
  }

  const dueSortKey = (r: Request) => metaMap[r.id]?.follow_up_at || ''

  const filtered = (filter === 'active' ? requests.filter((r) => activeStatuses.includes(r.status)) :
    filter === 'completed' ? requests.filter((r) => completedStatuses.includes(r.status)) :
    filter === 'due' ? requests.filter(isDue).sort((a, b) => dueSortKey(a).localeCompare(dueSortKey(b))) :
    requests)

  const submittedCount = requests.filter((r) => r.status === 'submitted').length
  const completedCount = requests.filter((r) => completedStatuses.includes(r.status)).length
  const activeCount = requests.filter((r) => activeStatuses.includes(r.status)).length
  const dueCount = requests.filter(isDue).length

  const totalEarned = requests.reduce((sum, r) => {
    const delivered = completedStatuses.includes(r.status)
    const base = delivered ? (typeof r.amount_cents === 'number' ? r.amount_cents : parseInt(String(r.amount_cents), 10) || 0) : 0
    const meta = metaMap[r.id]
    const round2Paid = meta && String(meta.round) === '2' && meta.stage === 'paid' ? 1000 : 0
    return sum + base + round2Paid
  }, 0)

  const filteredInstructors = instructors.filter((i) =>
    centreFilter === 'ALL' ? true : i.test_centre === centreFilter
  )

  return (
    <main className="min-h-screen bg-[#0a1628] pb-12">
      {/* Header */}
      <header className="bg-[#111d32] border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-emerald-600 grid place-items-center text-white font-bold text-xs">DF</div>
            <span className="font-semibold text-white text-lg">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button onClick={load} className="text-slate-400 hover:text-white transition">Refresh</button>
            <button onClick={onLogout} className="text-slate-400 hover:text-white transition">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat label="NEW REQUESTS" value={String(submittedCount)} color="#3b82f6" />
          <Stat
            label="FOLLOW UP TODAY"
            value={String(dueCount)}
            color={dueCount > 0 ? '#ef4444' : '#64748b'}
            onClick={() => { setTab('requests'); setFilter('due') }}
          />
          <Stat label="ACTIVE" value={String(activeCount)} color="#f59e0b" />
          <Stat label="EARNED" value={formatSGD(totalEarned)} color="#10b981" />
          <Stat label="TOTAL" value={String(requests.length)} color="#8b5cf6" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[#111d32] rounded-xl p-1 w-fit">
          <TabBtn active={tab === 'requests'} onClick={() => setTab('requests')}>
            Requests {submittedCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-blue-500 text-white text-[10px] font-bold">{submittedCount}</span>}
          </TabBtn>
          <TabBtn active={tab === 'instructors'} onClick={() => setTab('instructors')}>
            Instructors ({instructors.length})
          </TabBtn>
        </div>

        {/* Requests Tab */}
        {tab === 'requests' && (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <FilterBtn active={filter === 'active'} onClick={() => setFilter('active')}>Active ({activeCount})</FilterBtn>
              <FilterBtn active={filter === 'due'} onClick={() => setFilter('due')}>
                Follow up today {dueCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">{dueCount}</span>}
              </FilterBtn>
              <FilterBtn active={filter === 'completed'} onClick={() => setFilter('completed')}>Completed ({completedCount})</FilterBtn>
              <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>All ({requests.length})</FilterBtn>
            </div>

            {loading && requests.length === 0 ? (
              <Empty text="Loading..." />
            ) : filtered.length === 0 ? (
              <Empty text={
                filter === 'active' ? 'No active requests. Time to distribute.' :
                filter === 'due' ? 'Nothing to follow up on today. Clear inbox.' :
                'No requests yet.'
              } />
            ) : (
              <div className="space-y-4">
                {filtered.map((r) => (
                  <RequestCard key={r.id} request={r} instructors={instructors} password={password} onChange={load} contactStatus={contactStatus} onContactUpdate={updateContactStatus} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Instructors Tab */}
        {tab === 'instructors' && (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {['ALL', 'BBDC', 'CDC', 'SSDC'].map((c) => (
                <FilterBtn key={c} active={centreFilter === c} onClick={() => setCentreFilter(c)}>
                  {c} {c !== 'ALL' && `(${instructors.filter((i) => i.test_centre === c).length})`}
                </FilterBtn>
              ))}
            </div>

            <div className="bg-[#111d32] border border-white/5 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_80px_70px_140px_50px] gap-2 px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-white/5">
                <div>Instructor</div>
                <div>Centre</div>
                <div>Class</div>
                <div>Pass Rate</div>
                <div>Status</div>
                <div></div>
              </div>
              {filteredInstructors
                .sort((a, b) => b.pass_rate - a.pass_rate)
                .map((i) => (
                <div key={i.id} className="grid grid-cols-[1fr_80px_80px_70px_140px_50px] gap-2 px-5 py-3 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition">
                  <div>
                    <div className="text-white font-medium text-[15px]">{i.name}</div>
                    <div className="text-slate-500 text-xs">{formatPhone(i.phone)}</div>
                  </div>
                  <div className="text-slate-400 text-sm">{i.test_centre}</div>
                  <div className="text-slate-400 text-sm">{i.class_type} ({i.transmission})</div>
                  <div>
                    <span className={`text-sm font-bold ${i.pass_rate >= 0.5 ? 'text-emerald-400' : i.pass_rate >= 0.3 ? 'text-amber-400' : 'text-red-400'}`}>
                      {Math.round(i.pass_rate * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ContactPill current={contactStatus[i.id]} status="contacted" label="Sent" onClick={() => updateContactStatus(i.id, contactStatus[i.id] === 'contacted' ? '' : 'contacted')} />
                    <ContactPill current={contactStatus[i.id]} status="yes" label="Yes" onClick={() => updateContactStatus(i.id, contactStatus[i.id] === 'yes' ? '' : 'yes')} />
                    <ContactPill current={contactStatus[i.id]} status="no" label="No" onClick={() => updateContactStatus(i.id, contactStatus[i.id] === 'no' ? '' : 'no')} />
                  </div>
                  <div>
                    <a
                      href={`https://wa.me/65${String(i.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I have a student looking for ${i.class_type === '3' ? 'manual' : 'auto'} lessons at ${i.test_centre}. Are you taking students? Please do let me know, thanks!`)}`}
                      target="_blank"
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
                    >
                      WA
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-3 text-center">
              {filteredInstructors.length} instructors. Click WA to message with a pre-filled template.
            </p>
          </>
        )}
      </div>
    </main>
  )
}

function Stat({ label, value, color, onClick }: { label: string; value: string; color: string; onClick?: () => void }) {
  const Cmp = onClick ? 'button' : 'div'
  return (
    <Cmp
      onClick={onClick}
      className={`bg-[#111d32] border border-white/5 rounded-xl p-4 text-left ${onClick ? 'hover:border-white/20 transition cursor-pointer' : ''}`}
    >
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
    </Cmp>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
        active ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        active ? 'bg-emerald-600 text-white' : 'bg-[#111d32] border border-white/10 text-slate-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-center py-20 bg-[#111d32] border border-white/5 rounded-2xl">
      <div className="text-slate-500 text-lg">{text}</div>
    </div>
  )
}

function RequestCard({
  request, instructors, password, onChange, contactStatus, onContactUpdate,
}: {
  request: Request; instructors: Instructor[]; password: string; onChange: () => void; contactStatus: Record<string, string>; onContactUpdate: (id: string, status: string) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [showFail, setShowFail] = useState(false)
  const [failReason, setFailReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [round, setRound] = useState(1)
  const [stage, setStage] = useState('')
  const [stageNotes, setStageNotes] = useState('')
  const [followUpAt, setFollowUpAt] = useState('')
  const [metaLoaded, setMetaLoaded] = useState(false)

  useEffect(() => {
    if (!metaLoaded) {
      fetch(`/api/admin/update-notes?requestId=${request.id}`, {
        headers: { Authorization: `Bearer ${password}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.meta) {
            setRound(parseInt(String(d.meta.round)) || 1)
            setStage(String(d.meta.stage || ''))
            setStageNotes(String(d.meta.notes || ''))
            setFollowUpAt(String(d.meta.follow_up_at || ''))
          }
          setMetaLoaded(true)
        })
        .catch(() => setMetaLoaded(true))
    }
  }, [request.id, password, metaLoaded])

  function saveMeta(updates: { round?: number; stage?: string; notes?: string; follow_up_at?: string }) {
    if (updates.round !== undefined) setRound(updates.round)
    if (updates.stage !== undefined) setStage(updates.stage)
    if (updates.notes !== undefined) setStageNotes(updates.notes)
    if (updates.follow_up_at !== undefined) setFollowUpAt(updates.follow_up_at)
    fetch('/api/admin/update-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ requestId: request.id, ...updates }),
    })
      .then(() => onChange())
      .catch(() => {})
  }

  function shiftDate(days: number): string {
    const base = new Date()
    base.setDate(base.getDate() + days)
    return base.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  }

  const remaining = timeRemaining(request.deadline_at)

  const suggested = instructors.filter((i) => {
    if (request.test_centre !== 'ANY' && i.test_centre !== request.test_centre) return false
    if (String(i.class_type) !== String(request.class_type)) return false
    return true
  }).sort((a, b) => b.pass_rate - a.pass_rate)

  const statusStyles: Record<string, string> = {
    submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    confirmed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    captured: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    voided: 'bg-slate-500/20 text-slate-500 border-slate-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  async function confirm() {
    if (selected.size === 0) { toast.error('Pick at least one instructor'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ requestId: request.id, instructorIds: Array.from(selected), notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Match confirmed! Send PayNow request to buyer.')
      onChange()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(false) }
  }

  async function markPaid() {
    setBusy(true)
    try {
      const res = await fetch('/api/payment-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Marked as paid! Now deliver the instructor details.')
      onChange()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(false) }
  }

  async function deliver() {
    const classLabel = request.class_type === '3' ? 'Class 3 MANUAL' : 'Class 3A AUTO'
    const ok = window.confirm(
      `Verify before delivering:\n\n` +
      `Buyer wants: ${classLabel} at ${request.test_centre}\n\n` +
      `Did you confirm availability with the instructor(s) for THIS class and transmission?`
    )
    if (!ok) return
    setBusy(true)
    try {
      const ids = request.matched_instructor_ids
        ? (Array.isArray(request.matched_instructor_ids) ? request.matched_instructor_ids : JSON.parse(request.matched_instructor_ids))
        : Array.from(selected)
      const res = await fetch('/api/admin/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ requestId: request.id, instructorIds: ids, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Delivered + captured!')
      onChange()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(false) }
  }

  async function fail() {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/fail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ requestId: request.id, reason: failReason || 'No available match' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Request voided, no charge')
      onChange()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(false) }
  }

  async function reopen() {
    if (!window.confirm(`Move ${request.learner_name} back to active?`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/reopen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ requestId: request.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Moved back to active')
      onChange()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(false) }
  }

  const phone = String(request.learner_phone)

  return (
    <div className="bg-[#111d32] border border-white/5 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${statusStyles[request.status] || statusStyles.submitted}`}>
              {request.status.toUpperCase()}
            </span>
            {request.status === 'submitted' && (
              <span className={`text-xs font-medium ${remaining.expired ? 'text-red-400' : 'text-slate-500'}`}>
                {remaining.label}
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-lg">{request.learner_name}</div>
          <div className="flex items-center gap-3 text-sm mt-1">
            <a href={`https://wa.me/65${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${request.learner_name.split(' ')[0]}, thanks for using Drive Finder SG. We will be looking for a PDI willing to undertake new learners and will let you know if any are available within the next 7 days!`)}`} target="_blank" className="text-emerald-400 hover:text-emerald-300 transition">
              {formatPhone(phone)}
            </a>
            <span className="text-slate-600">|</span>
            <a href={`mailto:${request.learner_email}`} className="text-slate-400 hover:text-white transition">
              {request.learner_email}
            </a>
          </div>
        </div>
        <div className="text-right text-xs space-y-1">
          <div className="text-slate-600">
            {new Date(request.created_at).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          {(['submitted', 'confirmed', 'pending'].includes(request.status)) && followUpAt && (() => {
            const todaySG = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
            const diffMs = new Date(followUpAt).getTime() - new Date(todaySG).getTime()
            const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24))
            if (daysLeft < 0) return <div className="text-red-400 font-semibold">Follow up now ({Math.abs(daysLeft)}d late)</div>
            if (daysLeft === 0) return <div className="text-red-400 font-semibold">Follow up today</div>
            if (daysLeft === 1) return <div className="text-amber-400 font-semibold">Follow up tomorrow</div>
            return <div className="text-slate-500">Follow up in {daysLeft}d</div>
          })()}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <Tag>{request.test_centre}</Tag>
        <Tag>Class {request.class_type} ({request.transmission})</Tag>
        <Tag>{formatSGD(typeof request.amount_cents === 'number' ? request.amount_cents : parseInt(String(request.amount_cents), 10) || 0)}</Tag>
      </div>

      {/* Round & Stage Tracker */}
      {(['submitted', 'confirmed', 'pending'].includes(request.status)) && metaLoaded && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => saveMeta({ round: 1 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${round === 1 ? 'bg-blue-500/30 text-blue-400 border border-blue-500/40' : 'bg-white/5 text-slate-600 border border-white/5'}`}
            >
              Round 1
            </button>
            <button
              onClick={() => saveMeta({ round: 2 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${round === 2 ? 'bg-amber-500/30 text-amber-400 border border-amber-500/40' : 'bg-white/5 text-slate-600 border border-white/5'}`}
            >
              Round 2
            </button>
          </div>
          <select
            value={stage}
            onChange={(e) => saveMeta({ stage: e.target.value })}
            className="bg-[#0a1628] border border-white/10 rounded-lg text-xs text-slate-400 px-2 py-1 outline-none"
          >
            <option value="">Stage...</option>
            <option value="contacting">Contacting PDIs</option>
            <option value="waiting">Waiting for PDI reply</option>
            <option value="found">Match found</option>
            <option value="no-match">No match, offering round 2</option>
            <option value="awaiting-payment">Awaiting payment</option>
            <option value="paid">Paid</option>
          </select>
          {stage && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              stage === 'found' || stage === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
              stage === 'no-match' ? 'bg-red-500/20 text-red-400' :
              stage === 'awaiting-payment' ? 'bg-purple-500/20 text-purple-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {stage === 'contacting' ? 'Contacting PDIs' :
               stage === 'waiting' ? 'Waiting for reply' :
               stage === 'found' ? 'Match found' :
               stage === 'no-match' ? 'No match' :
               stage === 'awaiting-payment' ? 'Awaiting payment' :
               stage === 'paid' ? 'Paid' : stage}
            </span>
          )}
        </div>
      )}

      {/* Follow-up scheduler */}
      {(['submitted', 'confirmed', 'pending'].includes(request.status)) && metaLoaded && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Follow up</span>
          <input
            type="date"
            value={followUpAt}
            onChange={(e) => saveMeta({ follow_up_at: e.target.value })}
            className="px-2 py-1 bg-[#0a1628] border border-white/10 rounded-lg text-xs text-white outline-none focus:border-emerald-500/50"
          />
          <button
            onClick={() => saveMeta({ follow_up_at: shiftDate(0) })}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/5 text-slate-400 hover:text-white border border-white/5 transition"
          >
            Today
          </button>
          <button
            onClick={() => saveMeta({ follow_up_at: shiftDate(1) })}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/5 text-slate-400 hover:text-white border border-white/5 transition"
          >
            Tomorrow
          </button>
          <button
            onClick={() => saveMeta({ follow_up_at: shiftDate(3) })}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/5 text-slate-400 hover:text-white border border-white/5 transition"
          >
            +3d
          </button>
          <button
            onClick={() => saveMeta({ follow_up_at: shiftDate(7) })}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/5 text-slate-400 hover:text-white border border-white/5 transition"
          >
            +7d
          </button>
          {followUpAt && (
            <button
              onClick={() => saveMeta({ follow_up_at: '' })}
              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/20 transition"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Internal notes */}
      {(['submitted', 'confirmed', 'pending'].includes(request.status)) && metaLoaded && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={stageNotes}
            onChange={(e) => setStageNotes(e.target.value)}
            onBlur={() => saveMeta({ notes: stageNotes })}
            onKeyDown={(e) => { if (e.key === 'Enter') saveMeta({ notes: stageNotes }) }}
            placeholder="Quick notes (e.g. Tan Seng Leong confirmed, waiting for payment)"
            className="flex-1 px-3 py-2 bg-[#0a1628] border border-white/10 rounded-lg text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
          />
        </div>
      )}

      {request.notes && (
        <div className="mb-4 p-3 bg-white/[0.03] rounded-xl text-sm text-slate-400 border border-white/5">
          <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Notes: </span>
          {request.notes}
        </div>
      )}

      {/* Confirmed waiting for payment */}
      {request.status === 'confirmed' && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-purple-400 mb-1">Waiting for PayNow</div>
              <div className="text-xs text-purple-400/70">
                Once {request.learner_name.split(' ')[0]} pays, click Mark as Paid then Deliver.
              </div>
            </div>
            <button
              onClick={markPaid}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition disabled:opacity-40"
            >
              {busy ? 'Updating...' : 'Mark as Paid'}
            </button>
          </div>
        </div>
      )}

      {/* Actionable: submitted, confirmed, or pending */}
      {(['submitted', 'confirmed', 'pending'].includes(request.status)) && (
        <>
          <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-2">
            <span>VERIFY WITH PDI:</span>
            <span className="text-white">{request.class_type === '3' ? 'Class 3 MANUAL' : 'Class 3A AUTO'} at {request.test_centre}</span>
          </div>
          <div className="mb-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              {request.status === 'submitted' ? `Matching instructors (${suggested.length})` : 'Ready to deliver'}
            </div>
            {suggested.length === 0 ? (
              <div className="text-sm text-slate-500 italic">No instructors match. Consider rejecting.</div>
            ) : (
              <div className="grid gap-1.5 max-h-[300px] overflow-y-auto">
                {suggested.slice(0, 15).map((i) => (
                  <label
                    key={i.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      selected.has(i.id)
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i.id)}
                      onChange={(e) => {
                        const next = new Set(selected)
                        if (e.target.checked) next.add(i.id); else next.delete(i.id)
                        setSelected(next)
                      }}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-[15px]">{i.name}</div>
                      <div className="text-xs text-slate-500">{i.test_centre} / Class {i.class_type} / ${i.hourly_rate}/hr</div>
                    </div>
                    <span className={`text-sm font-bold ${i.pass_rate >= 0.5 ? 'text-emerald-400' : i.pass_rate >= 0.3 ? 'text-amber-400' : 'text-red-400'}`}>
                      {Math.round(i.pass_rate * 100)}%
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <ContactPill current={contactStatus[i.id]} status="contacted" label="Sent" onClick={() => onContactUpdate(i.id, contactStatus[i.id] === 'contacted' ? '' : 'contacted')} />
                      <ContactPill current={contactStatus[i.id]} status="yes" label="Yes" onClick={() => onContactUpdate(i.id, contactStatus[i.id] === 'yes' ? '' : 'yes')} />
                      <ContactPill current={contactStatus[i.id]} status="no" label="No" onClick={() => onContactUpdate(i.id, contactStatus[i.id] === 'no' ? '' : 'no')} />
                      <a
                        href={`https://wa.me/65${String(i.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I have a student looking for ${i.class_type === '3' ? 'manual' : 'auto'} lessons at ${i.test_centre}. Are you taking students? Please do let me know, thanks!`)}`}
                        target="_blank"
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition px-1"
                      >
                        WA
                      </a>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <textarea
            className="w-full px-4 py-3 bg-[#0a1628] border border-white/10 rounded-xl text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 text-sm mb-3 min-h-[50px] resize-none"
            placeholder="Internal notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <button onClick={deliver} disabled={busy || selected.size === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed">
              {busy ? 'Working...' : `Mark as Delivered (${selected.size})`}
            </button>
            <button onClick={() => setShowFail(!showFail)} disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition">
              {request.status === 'submitted' ? 'Reject' : 'Void'}
            </button>
          </div>

          {showFail && (
            <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
              <textarea
                className="w-full px-3 py-2 bg-[#0a1628] border border-white/10 rounded-lg text-white placeholder-slate-600 outline-none text-sm resize-none"
                placeholder="Reason (optional, internal)"
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
              />
              <button onClick={fail} disabled={busy}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition">
                Confirm: void, no charge
              </button>
            </div>
          )}
        </>
      )}

      {/* Completed states */}
      {!['submitted', 'confirmed', 'pending'].includes(request.status) && (
        <div className="flex items-start justify-between gap-4">
          {request.matched_instructor_ids ? (
            <div className="text-sm text-slate-500 flex-1">
              <span className="font-medium text-slate-400">Matched: </span>
              {(() => {
                try {
                  const parsed = Array.isArray(request.matched_instructor_ids) ? request.matched_instructor_ids : JSON.parse(request.matched_instructor_ids)
                  return (parsed as string[])
                    .map((id) => instructors.find((i) => i.id === id)?.name || id)
                    .join(', ')
                } catch { return request.matched_instructor_ids }
              })()}
            </div>
          ) : <div className="flex-1" />}
          <button
            onClick={reopen}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-semibold border border-blue-500/30 transition disabled:opacity-40 whitespace-nowrap"
          >
            {busy ? 'Working...' : 'Reopen'}
          </button>
        </div>
      )}

      {request.admin_notes && (
        <div className="mt-3 text-xs text-slate-600 italic">{request.admin_notes}</div>
      )}
    </div>
  )
}

function ContactPill({ current, status, label, onClick }: { current?: string; status: string; label: string; onClick: () => void }) {
  const active = current === status
  const colors: Record<string, string> = {
    contacted: active ? 'bg-amber-500/30 text-amber-400 border-amber-500/40' : 'bg-white/5 text-slate-600 border-white/5',
    yes: active ? 'bg-emerald-500/30 text-emerald-400 border-emerald-500/40' : 'bg-white/5 text-slate-600 border-white/5',
    no: active ? 'bg-red-500/30 text-red-400 border-red-500/40' : 'bg-white/5 text-slate-600 border-white/5',
  }
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${colors[status]}`}
    >
      {label}
    </button>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300 text-xs font-medium">
      {children}
    </span>
  )
}
