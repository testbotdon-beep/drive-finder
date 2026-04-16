import { Redis } from '@upstash/redis'
import { readFileSync } from 'fs'
import path from 'path'

let _redis: Redis | null = null

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set')
    }
    _redis = new Redis({ url, token })
  }
  return _redis
}

// Instructors are static, loaded from the SPF JSON file at build/runtime
let _instructors: Instructor[] | null = null

export function getInstructors(): Instructor[] {
  if (!_instructors) {
    const jsonPath = path.join(process.cwd(), 'data', 'spf-instructors.json')
    const raw = JSON.parse(readFileSync(jsonPath, 'utf-8')) as RawInstructor[]
    _instructors = raw.map((inst) => ({
      ...inst,
      id: slugify(inst.test_centre, inst.class_type, inst.name),
      hourly_rate: inst.test_centre === 'CDC' && inst.pass_rate > 0.65 ? 60 : 55,
      is_active: 1,
      notes: null,
    }))
  }
  return _instructors
}

function slugify(centre: string, classType: string, name: string): string {
  const slug = name.toLowerCase().replace(/\//g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${centre.toLowerCase()}-${classType.toLowerCase()}-${slug}`
}

interface RawInstructor {
  name: string
  phone: string
  test_centre: string
  class_type: string
  transmission: string
  tested: number
  passed: number
  pass_rate: number
}

export type RequestStatus =
  | 'submitted'
  | 'confirmed'
  | 'pending'
  | 'delivered'
  | 'failed'
  | 'voided'
  | 'captured'

export interface MatchRequest {
  id: string
  test_centre: string
  transmission: string
  class_type: string
  learner_name: string
  learner_phone: string
  learner_email: string
  notes: string | null
  status: RequestStatus
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

export interface Instructor {
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
  notes: string | null
  is_active: number
}

const REQUEST_PREFIX = 'drivefinder:req:'
const REQUEST_LIST_KEY = 'drivefinder:requests'

export async function createRequest(req: MatchRequest): Promise<void> {
  const redis = getRedis()
  await redis.hset(`${REQUEST_PREFIX}${req.id}`, req as unknown as Record<string, unknown>)
  await redis.lpush(REQUEST_LIST_KEY, req.id)
}

export async function getRequest(id: string): Promise<MatchRequest | null> {
  const redis = getRedis()
  const data = await redis.hgetall(`${REQUEST_PREFIX}${id}`)
  if (!data || Object.keys(data).length === 0) return null
  return data as unknown as MatchRequest
}

export async function updateRequest(id: string, fields: Partial<MatchRequest>): Promise<void> {
  const redis = getRedis()
  await redis.hset(`${REQUEST_PREFIX}${id}`, fields as unknown as Record<string, unknown>)
}

export async function listRequests(limit = 200): Promise<MatchRequest[]> {
  const redis = getRedis()
  const ids = await redis.lrange(REQUEST_LIST_KEY, 0, limit - 1)
  if (!ids || ids.length === 0) return []

  const pipeline = redis.pipeline()
  for (const id of ids) {
    pipeline.hgetall(`${REQUEST_PREFIX}${id}`)
  }
  const results = await pipeline.exec()
  return (results as unknown[])
    .filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object' && Object.keys(r as object).length > 0)
    .map((r) => r as unknown as MatchRequest)
}

export async function listRequestsByStatus(status: string): Promise<MatchRequest[]> {
  const all = await listRequests()
  return all.filter((r) => r.status === status)
}
