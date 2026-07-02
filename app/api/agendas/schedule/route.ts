import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// PATCH: Set schedule for agenda (auto activate/deactivate)
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, schedule_start, schedule_end, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID agenda harus diisi' }, { status: 400 })
    }

    const updateData: any = {}

    if (schedule_start !== undefined) updateData.schedule_start = schedule_start || null
    if (schedule_end !== undefined) updateData.schedule_end = schedule_end || null
    if (is_active !== undefined) updateData.is_active = is_active

    const { error } = await supabase
      .from('agendas')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Gagal mengupdate jadwal' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}

// POST: Check and apply scheduled agendas (called by cron or manual)
export async function POST() {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Activate agendas where schedule_start <= now and is_active = false
  const { data: toActivate } = await supabase
    .from('agendas')
    .update({ is_active: true })
    .lte('schedule_start', now)
    .eq('is_active', false)
    .not('schedule_start', 'is', null)
    .select('id, title')

  // Deactivate agendas where schedule_end <= now and is_active = true
  const { data: toDeactivate } = await supabase
    .from('agendas')
    .update({ is_active: false })
    .lte('schedule_end', now)
    .eq('is_active', true)
    .not('schedule_end', 'is', null)
    .select('id, title')

  return NextResponse.json({
    activated: toActivate || [],
    deactivated: toDeactivate || [],
    checked_at: now,
  })
}
