import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Support both JSON and form-urlencoded
    let fullName, nim
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      fullName = body.fullName
      nim = body.nim
    } else {
      const formData = await request.formData()
      fullName = formData.get('fullName') as string
      nim = formData.get('nim') as string
    }

    if (!fullName || !nim) {
      // If JSON request, return JSON error
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Nama dan NIM harus diisi' }, { status: 400 })
      }
      // If form request, redirect back with error
      return NextResponse.redirect(new URL('/?error=Nama+dan+NIM+harus+diisi', request.url))
    }

    // Find member
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .ilike('full_name', fullName.trim())
      .eq('nim', nim.trim())
      .single()

    if (error || !member) {
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: 'Nama atau NIM tidak ditemukan' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/?error=Nama+atau+NIM+tidak+ditemukan', request.url))
    }

    // Create session
    const sessionToken = await createSession({
      memberId: member.id,
      fullName: member.full_name,
      nim: member.nim,
      isAdmin: member.is_admin === true,
    })

    // If JSON request, return JSON (for modern browsers)
    if (contentType.includes('application/json')) {
      const response = NextResponse.json({
        success: true,
        isAdmin: member.is_admin === true,
      })
      response.cookies.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
      return response
    }

    // If form request, redirect with cookie (for old browsers)
    const response = NextResponse.redirect(new URL('/survey', request.url))
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
