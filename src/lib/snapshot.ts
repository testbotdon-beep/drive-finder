/**
 * Admin dashboard snapshot cache.
 *
 * The dashboard used to read every request hash and every meta hash on each
 * poll: 1 LRANGE + N HGETALL + N HGETALL + 1 GET, so ~926 Redis commands at 462
 * requests, every 2 minutes. That is what exhausted the 500k/month plan
 * allowance. The per-request hashes are still the source of truth; this module
 * keeps a single gzipped JSON copy of the whole admin payload alongside them so
 * a dashboard poll costs exactly one GET.
 *
 * Writes patch the snapshot in place (GET + SET) instead of rebuilding it, so
 * the cost of a write does not grow with the request count either. If the
 * snapshot is ever missing or unreadable it is rebuilt from the hashes, which
 * means a lost patch is self-healing rather than data loss.
 */
import { gzipSync, gunzipSync } from 'zlib'
import { getRedis } from './redis'
// Type-only, so this stays a compile-time reference and db.ts can import from here.
import type { MatchRequest } from './db'

const SNAPSHOT_KEY = 'drivefinder:snapshot'
const ADJUSTMENT_KEY = 'drivefinder:earnings-adjustment'
const STATUS_KEY = 'drivefinder:instructor-status'
const STATUS_DATE_KEY = 'drivefinder:instructor-status-date'

const NOTES_KEY = 'drivefinder:instructor-notes'

export interface Snapshot {
  requests: MatchRequest[]
  meta: Record<string, Record<string, string>>
  statuses: Record<string, string>
  dates: Record<string, string>
  instructorNotes: Record<string, string>
  adjustment_cents: number
  built_at: string
}

/**
 * Per-instance memory copy. A single dashboard load calls three endpoints that
 * all want the snapshot, so this collapses them into one Redis read. It also
 * doubles as the fallback when Redis refuses a read: serving a slightly stale
 * dashboard beats a 500, and the hashes remain the source of truth either way.
 */
let memo: { snap: Snapshot; at: number } | null = null
const MEMO_TTL_MS = 15_000

function encode(snap: Snapshot): string {
  return gzipSync(Buffer.from(JSON.stringify(snap), 'utf-8')).toString('base64')
}

function decode(raw: string): Snapshot {
  return JSON.parse(gunzipSync(Buffer.from(raw, 'base64')).toString('utf-8')) as Snapshot
}

/**
 * Read the snapshot. Retries a few times because while the plan allowance is
 * exhausted Upstash rejects a share of requests rather than all of them, so a
 * single-command read usually succeeds on a retry.
 */
export async function readSnapshot(attempts = 6, skipMemo = false): Promise<Snapshot | null> {
  if (!skipMemo && memo && Date.now() - memo.at < MEMO_TTL_MS) return memo.snap

  const redis = getRedis()
  for (let i = 0; i < attempts; i++) {
    try {
      const raw = await redis.get<string>(SNAPSHOT_KEY)
      if (!raw) return null
      const snap = decode(raw)
      memo = { snap, at: Date.now() }
      return snap
    } catch {
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 250 * (i + 1)))
    }
  }
  // Every attempt was refused. A stale copy is still far better than an error.
  return memo?.snap ?? null
}

export async function writeSnapshot(snap: Snapshot, attempts = 4): Promise<boolean> {
  const redis = getRedis()
  snap.built_at = new Date().toISOString()
  memo = { snap, at: Date.now() }
  const payload = encode(snap)
  for (let i = 0; i < attempts; i++) {
    try {
      await redis.set(SNAPSHOT_KEY, payload)
      return true
    } catch {
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 250 * (i + 1)))
    }
  }
  return false
}

/**
 * Rebuild from the source hashes. Expensive (~2N commands), so this only runs
 * when the snapshot is missing, never on a normal poll.
 */
export async function rebuildSnapshot(): Promise<Snapshot> {
  const redis = getRedis()

  // Inlined rather than calling db.listRequests() so this module never imports
  // db.ts at runtime, which would make the two files circular.
  const ids = (await redis.lrange('drivefinder:requests', 0, 999)) || []
  let requests: MatchRequest[] = []
  if (ids.length > 0) {
    const rp = redis.pipeline()
    for (const id of ids) rp.hgetall(`drivefinder:req:${id}`)
    const rows = (await rp.exec()) as unknown[]
    requests = rows
      .filter((r): r is Record<string, unknown> =>
        r !== null && typeof r === 'object' && Object.keys(r as object).length > 0
      )
      .map((r) => r as unknown as MatchRequest)
  }

  const p = redis.pipeline()
  for (const r of requests) p.hgetall(`drivefinder:req-meta:${r.id}`)
  p.get(ADJUSTMENT_KEY)
  p.hgetall(STATUS_KEY)
  p.hgetall(STATUS_DATE_KEY)
  p.hgetall(NOTES_KEY)
  const results = await p.exec()

  const meta: Record<string, Record<string, string>> = {}
  requests.forEach((r, i) => {
    const m = results[i] as Record<string, string> | null
    if (m && Object.keys(m).length > 0) meta[r.id] = m
  })

  const snap: Snapshot = {
    requests,
    meta,
    adjustment_cents: Number(results[requests.length]) || 0,
    statuses: (results[requests.length + 1] as Record<string, string>) || {},
    dates: (results[requests.length + 2] as Record<string, string>) || {},
    instructorNotes: (results[requests.length + 3] as Record<string, string>) || {},
    built_at: new Date().toISOString(),
  }
  await writeSnapshot(snap)
  return snap
}

/** Read, falling back to a rebuild when the cache is cold. */
export async function getSnapshot(): Promise<Snapshot> {
  const cached = await readSnapshot()
  if (cached) return cached
  return rebuildSnapshot()
}

/**
 * Apply a change to the cached copy. Failures are swallowed: the hashes are
 * already updated by the caller, so the worst case is a stale dashboard until
 * the next rebuild, not lost data.
 */
async function patch(fn: (snap: Snapshot) => void): Promise<void> {
  try {
    // Deliberately bypasses the memory copy. Reusing a copy up to MEMO_TTL_MS
    // old would write back a snapshot missing anything another instance saved in
    // the meantime, and the likeliest victim is a lead that came in seconds ago.
    // Writes are rare, so the extra read costs nothing that matters.
    const snap = await readSnapshot(3, true)
    if (!snap) return // cold cache, next read rebuilds it from the hashes
    fn(snap)
    await writeSnapshot(snap, 3)
  } catch {
    // non-fatal, see above
  }
}

export async function patchRequestInSnapshot(id: string, fields: Partial<MatchRequest>): Promise<void> {
  await patch((snap) => {
    const idx = snap.requests.findIndex((r) => r.id === id)
    if (idx >= 0) snap.requests[idx] = { ...snap.requests[idx], ...fields }
  })
}

export async function addRequestToSnapshot(request: MatchRequest): Promise<void> {
  await patch((snap) => {
    if (!snap.requests.some((r) => r.id === request.id)) {
      // listRequests() reads the list newest first, so mirror that ordering here.
      snap.requests.unshift(request)
    }
  })
}

export async function patchMetaInSnapshot(
  id: string,
  fields: Record<string, string>,
  deletes: string[] = []
): Promise<void> {
  if (Object.keys(fields).length === 0 && deletes.length === 0) return
  await patch((snap) => {
    const row = { ...(snap.meta[id] || {}), ...fields }
    for (const k of deletes) delete row[k]
    snap.meta[id] = row
  })
}

export async function patchStatusInSnapshot(
  instructorId: string,
  status: string | null,
  date: string | null
): Promise<void> {
  await patch((snap) => {
    if (status === null) {
      delete snap.statuses[instructorId]
      delete snap.dates[instructorId]
    } else {
      snap.statuses[instructorId] = status
      if (date) snap.dates[instructorId] = date
    }
  })
}

export async function patchInstructorNoteInSnapshot(instructorId: string, note: string): Promise<void> {
  await patch((snap) => {
    if (!snap.instructorNotes) snap.instructorNotes = {}
    if (note === '') delete snap.instructorNotes[instructorId]
    else snap.instructorNotes[instructorId] = note
  })
}

export async function setAdjustmentInSnapshot(cents: number): Promise<void> {
  await patch((snap) => {
    snap.adjustment_cents = cents
  })
}
