import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: List all members with roles
export async function GET() {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: members, error } = await supabase
    .from('members')
    .select('id, full_name, nim, is_admin, role')
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }

  return NextResponse.json({ members: members || [] })
}

// PATCH: Update member role (super_admin only)
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only super_admin can change roles
  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Hanya super admin yang bisa mengubah role' }, { status: 403 })
  }

  try {
    const { memberId, role } = await request.json()

    if (!memberId || !role) {
      return NextResponse.json({ error: 'memberId dan role harus diisi' }, { status: 400 })
    }

    const validRoles = ['super_admin', 'moderator', 'viewer', 'member']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    // Can't change own role
    if (memberId === session.memberId) {
      return NextResponse.json({ error: 'Tidak bisa mengubah role sendiri' }, { status: 400 })
    }

    const updateData: any = { role }
    if (role === 'super_admin' || role === 'moderator') {
      updateData.is_admin = true
    } else if (role === 'viewer' || role === 'member') {
      updateData.is_admin = false
    }

    const { error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', memberId)

    if (error) {
      return NextResponse.json({ error: 'Gagal mengupdate role' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
}
