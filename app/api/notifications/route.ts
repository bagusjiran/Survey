import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: Fetch notifications for current user
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.memberId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 })
  }

  const unreadCount = (notifications || []).filter(n => !n.read).length

  return NextResponse.json({ notifications: notifications || [], unreadCount })
}

// PATCH: Mark notification as read
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, markAll } = await request.json()

    if (markAll) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.memberId)
        .eq('read', false)
    } else if (id) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', session.memberId)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}
