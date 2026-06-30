import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }

  return NextResponse.json({ members })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { fullName, nim } = await request.json()

    if (!fullName || !nim) {
      return NextResponse.json({ error: 'Nama dan NIM harus diisi' }, { status: 400 })
    }

    // Check duplicate NIM
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('nim', nim.trim())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'NIM sudah terdaftar' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('members')
      .insert({ full_name: fullName.trim(), nim: nim.trim(), is_admin: false })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Gagal menambah anggota' }, { status: 500 })
    }

    return NextResponse.json({ member: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID harus diisi' }, { status: 400 })
  }

  // Don't delete admin
  const { data: member } = await supabase.from('members').select('is_admin').eq('id', id).single()
  if (member?.is_admin) {
    return NextResponse.json({ error: 'Tidak bisa menghapus admin' }, { status: 403 })
  }

  const { error } = await supabase.from('members').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Gagal menghapus anggota' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
