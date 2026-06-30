import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'fallback-secret-change-in-production'
)

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  // Public: login page
  if (pathname === '/') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secretKey)
        const data = payload as any
        return NextResponse.redirect(
          new URL(data.isAdmin ? '/admin' : '/survey', request.url)
        )
      } catch {
        // Invalid token, clear it
        const res = NextResponse.next()
        res.cookies.delete('session')
        return res
      }
    }
    return NextResponse.next()
  }

  // Protected routes - require session
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secretKey)
    const data = payload as any

    // Admin routes require admin session
    if (pathname.startsWith('/admin') && !data.isAdmin) {
      return NextResponse.redirect(new URL('/survey', request.url))
    }

    return NextResponse.next()
  } catch {
    // Invalid token
    const res = NextResponse.redirect(new URL('/', request.url))
    res.cookies.delete('session')
    return res
  }
}

export const config = {
  matcher: ['/', '/admin/:path*', '/survey/:path*'],
}
