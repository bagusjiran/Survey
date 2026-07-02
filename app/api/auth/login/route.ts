import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    let fullName: string | undefined, nim: string | undefined
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

    // Validate presence
    if (!fullName || !nim) {
      const msg = 'Nama dan NIM harus diisi'
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(msg)}`, request.url))
    }

    // Validate length
    if (fullName.length > 200 || nim.length > 50) {
      const msg = 'Data tidak valid'
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(msg)}`, request.url))
    }

    // Find member — use specific columns only
    const { data: member, error } = await supabase
      .from('members')
      .select('id, full_name, nim, is_admin')
      .ilike('full_name', fullName.trim())
      .eq('nim', nim.trim())
      .single()

    if (error || !member) {
      // Generic message — don't reveal whether name or NIM was wrong
      const msg = 'Nama atau NIM tidak cocok'
      if (contentType.includes('application/json')) {
        return NextResponse.json({ error: msg }, { status: 401 })
      }
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(msg)}`, request.url))
    }

    // Create session
    const sessionToken = await createSession({
      memberId: member.id,
      fullName: member.full_name,
      nim: member.nim,
      isAdmin: member.is_admin === true,
    })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24,
      path: '/',
    }

    if (contentType.includes('application/json')) {
      const response = NextResponse.json({
        success: true,
        isAdmin: member.is_admin === true,
      })
      response.cookies.set('session', sessionToken, cookieOptions)
      return response
    }

    const response = NextResponse.redirect(new URL('/survey', request.url))
    response.cookies.set('session', sessionToken, cookieOptions)
    return response
  } catch (err) {
    console.error('Login error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
