// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import {
  securityHeaders,
  getClientIp,
  getUserAgent,
  checkRateLimit,
  isSuspiciousRequest,
  CSRFProtection
} from '@/lib/auth/security'
import { auditLog } from '@/lib/auth/logger'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/about',
  '/contact'
]

const ROLE_PATHS: Record<string, string[]> = {
  PLAYER: ['/dashboard/player'],
  EMPLOYEE: ['/dashboard/employee'],
  OWNER: ['/dashboard/owner'],
  ADMIN: ['/dashboard/admin']
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = getClientIp(req)
  const userAgent = getUserAgent(req)

  // 1️⃣ تجاهل static
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next()
  }

  // 2️⃣ Rate limit
const rateLimit = await checkRateLimit(ip, 'API')
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // 3️⃣ Suspicious
  if (isSuspiciousRequest(req)) {
    auditLog(
      'SYSTEM',
      'SUSPICIOUS_REQUEST',
      'SECURITY',
      pathname,
      'Blocked suspicious request',
      { ip, userAgent },
      ip,
      userAgent
    )
    return NextResponse.json({ error: 'Blocked' }, { status: 403 })
  }

  // 4️⃣ Public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    const res = NextResponse.next()
    Object.entries(securityHeaders()).forEach(([k, v]) =>
      res.headers.set(k, v)
    )
    return res
  }

  // 5️⃣ NextAuth token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = token.role as string

  // 6️⃣ Role check
  const allowedPaths = ROLE_PATHS[userRole] || []
  const hasAccess = allowedPaths.some(path => pathname.startsWith(path))

  if (!hasAccess) {
    return NextResponse.redirect(
      new URL(allowedPaths[0] || '/dashboard', req.url)
    )
  }

  // 7️⃣ CSRF (بس للـ POST/PUT/DELETE)
  if (
    req.method !== 'GET' &&
    !CSRFProtection.validateRequest(req)
  ) {
    return NextResponse.json({ error: 'CSRF failed' }, { status: 403 })
  }

  const res = NextResponse.next()
  Object.entries(securityHeaders()).forEach(([k, v]) =>
    res.headers.set(k, v)
  )

  return res
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)']
}
