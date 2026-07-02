import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  // Return only safe fields — exclude nim from general session endpoint
  return NextResponse.json({
    memberId: session.memberId,
    fullName: session.fullName,
    isAdmin: session.isAdmin,
  })
}
