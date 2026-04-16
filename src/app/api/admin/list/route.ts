import { NextRequest, NextResponse } from 'next/server'
import { listRequests, getInstructors } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || auth !== `Bearer ${pw}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requests = await listRequests()
  const instructors = getInstructors().filter((i) => i.is_active)

  return NextResponse.json({ requests, instructors })
}
