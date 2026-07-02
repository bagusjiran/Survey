import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET)

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  return response
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  // Public: login page
  if (pathname === '/') {
    if (token) {
      try {
        await jwtVerify(token, secretKey)
        return addSecurityHeaders(NextResponse.redirect(new URL('/survey', request.url)))
      } catch {
        const res = NextResponse.next()
        res.cookies.delete('session')
        return addSecurityHeaders(res)
      }
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // Protected routes - require session
  if (!token) {
    return addSecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
  }

  try {
    const { payload } = await jwtVerify(token, secretKey)
    const data = payload as any

    // Admin routes require admin session
    if (pathname.startsWith('/admin') && !data.isAdmin) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/survey', request.url)))
    }

    return addSecurityHeaders(NextResponse.next())
  } catch {
    const res = NextResponse.redirect(new URL('/', request.url))
    res.cookies.delete('session')
    return addSecurityHeaders(res)
  }
}

export const config = {
  matcher: ['/', '/admin/:path*', '/survey/:path*'],
}
