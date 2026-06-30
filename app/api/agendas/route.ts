import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  const activeOnly = request.nextUrl.searchParams.get('active')

  if (id) {
    const { data: agenda, error } = await supabase
      .from('agendas')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !agenda) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ agenda })
  }

  let query = supabase.from('agendas').select('*').order('created_at', { ascending: false })

  if (activeOnly === 'true') {
    query = query.eq('is_active', true)
  }

  const { data: agendas, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }

  return NextResponse.json({ agendas })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, description, event_date } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Judul harus diisi' }, { status: 400 })
    }

    const baseData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      is_active: true,
    }

    // Try with event_date first
    let insertData = { ...baseData }
    if (event_date) {
      insertData.event_date = event_date
    }

    let { data, error } = await supabase
      .from('agendas')
      .insert(insertData)
      .select()
      .single()

    // Fallback: if event_date column doesn't exist, retry without it
    if (error && error.message?.includes('event_date')) {
      console.warn('event_date column not found, retrying without it...')
      const fallback = await supabase
        .from('agendas')
        .insert(baseData)
        .select()
        .single()

      if (fallback.error) {
        return NextResponse.json({ error: 'Gagal membuat agenda' }, { status: 500 })
      }
      data = fallback.data
      error = null
    }

    if (error) {
      return NextResponse.json({ error: 'Gagal membuat agenda' }, { status: 500 })
    }

    return NextResponse.json({ agenda: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID harus diisi' }, { status: 400 })
    }

    const { error } = await supabase
      .from('agendas')
      .update({ is_active })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Gagal mengubah status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}
