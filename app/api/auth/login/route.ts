import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { fullName, nim, adminCode } = await request.json()

    if (!fullName || !nim) {
      return NextResponse.json({ error: 'Nama dan NIM harus diisi' }, { status: 400 })
    }

    // Find member
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .ilike('full_name', fullName.trim())
      .eq('nim', nim.trim())
      .single()

    if (error || !member) {
      return NextResponse.json({ error: 'Nama atau NIM tidak ditemukan' }, { status: 401 })
    }

    // If admin login requested
    if (adminCode !== undefined) {
      if (!member.is_admin) {
        return NextResponse.json({ error: 'Akun ini bukan admin' }, { status: 403 })
      }

      const expectedCode = process.env.ADMIN_SECRET_CODE || '134605712'
      if (adminCode !== expectedCode) {
        return NextResponse.json({ error: 'Kode admin salah' }, { status: 403 })
      }
    }

    // Create session
    const sessionToken = await createSession({
      memberId: member.id,
      fullName: member.full_name,
      nim: member.nim,
      isAdmin: member.is_admin && adminCode !== undefined,
    })

    const response = NextResponse.json({
      success: true,
      isAdmin: member.is_admin && adminCode !== undefined,
    })

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
