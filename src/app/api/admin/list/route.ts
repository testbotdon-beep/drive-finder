import { NextRequest, NextResponse } from 'next/server'
import { getDb, type MatchRequest } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const requests = db
    .prepare(`SELECT * FROM match_requests ORDER BY created_at DESC LIMIT 200`)
    .all() as MatchRequest[]

  const instructors = db
    .prepare(`SELECT * FROM instructors WHERE is_active = 1 ORDER BY pass_rate DESC`)
    .all()

  return NextResponse.json({ requests, instructors })
}
