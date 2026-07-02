import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET)

if (!process.env.SESSION_SECRET) {
  console.error('[SECURITY] SESSION_SECRET is not set! Set it in .env.local')
}

export interface SessionData {
  memberId: string
  fullName: string
  nim: string
  isAdmin: boolean
}

export async function createSession(data: SessionData): Promise<string> {
  return new SignJWT({ ...data } as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(secretKey)
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return payload as unknown as SessionData
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  return verifySession(token)
}
