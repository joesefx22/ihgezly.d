// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Redis } from '@upstash/redis'

// ✅ استخدام Redis في الإنتاج، و Memory في التطوير
const rateLimitStore = process.env.UPSTASH_REDIS_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    })
  : new Map<string, { count: number; timestamp: number }>()

// المسارات العامة
const PUBLIC_PATHS = ['/', '/login', '/register', '/about', '/contact', '/api/auth/register']

// المسارات اللي محتاجة مصادقة
const AUTH_PATHS = ['/dashboard', '/api/bookings', '/api/payments']

// إعدادات الـ Rate Limit
const RATE_LIMITS: Record<string, { windowMs: number; max: number; message: string }> = {
  '/api/auth/.*': { windowMs: 15 * 60 * 1000, max: 10, message: 'تم تجاوز محاولات تسجيل الدخول' },
  '/api/fields/.*/slots/.*/lock': { windowMs: 10 * 1000, max: 3, message: 'يمكنك محاولة قفل الموعد 3 مرات كل 10 ثواني' },
  '/api/bookings': { windowMs: 10 * 1000, max: 5, message: 'يمكنك إنشاء 5 حجوزات كل 10 ثواني' },
  '/api/payments/.*': { windowMs: 10 * 1000, max: 3, message: 'يمكنك محاولة الدفع 3 مرات كل 10 ثواني' },
  '/api/.*': { windowMs: 10 * 1000, max: 100, message: 'تم تجاوز الحد المسموح للطلبات' }
}

// ✅ دوال مساعدة
const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))

const requiresAuthentication = (pathname: string) => {
  const isApiPath = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')
  const isDashboardPath = pathname.startsWith('/dashboard')
  const isExplicitAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path))
  return isApiPath || isDashboardPath || isExplicitAuthPath
}

// ✅ Rate Limiting Response
function rateLimitedResponse(message: string, windowMs: number): NextResponse {
  const resetTime = Math.ceil((Date.now() + windowMs) / 1000)
  return new NextResponse(
    JSON.stringify({ error: 'RATE_LIMITED', message, retryAfter: resetTime }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': resetTime.toString()
      }
    }
  )
}

// ✅ Middleware الرئيسي
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // تجاهل الملفات الداخلية
  if (isPublicPath(pathname) || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // تحقق من الـ token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token && requiresAuthentication(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token?.isActive === false) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'account_inactive')
    return NextResponse.redirect(loginUrl)
  }

  // تحقق من الـ role
  const userRole = token?.role as string
  if (pathname.startsWith('/dashboard/admin') && userRole !== 'ADMIN') {
    const dashboardPath = `/dashboard/${userRole?.toLowerCase() || 'user'}`
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // ✅ Rate Limiting
  const config = Object.entries(RATE_LIMITS).find(([pattern]) =>
    new RegExp(`^${pattern}$`).test(pathname)
  )?.[1]

  if (config) {
    const identifier = `${request.ip || 'unknown'}:${pathname}`
    const key = `ratelimit:${identifier}`
    const now = Date.now()

    try {
      if (rateLimitStore instanceof Map) {
        const entry = rateLimitStore.get(key)
        if (entry && now - entry.timestamp < config.windowMs) {
          if (entry.count >= config.max) return rateLimitedResponse(config.message, config.windowMs)
          entry.count++
        } else {
          rateLimitStore.set(key, { count: 1, timestamp: now })
        }
      } else {
        const windowKey = `${key}:${Math.floor(now / config.windowMs)}`
        const count = await rateLimitStore.incr(windowKey)
        await rateLimitStore.expire(windowKey, Math.ceil(config.windowMs / 1000) * 2)
        if (count > config.max) return rateLimitedResponse(config.message, config.windowMs)
      }
    } catch (err) {
      console.error('Rate limiting error:', err)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)']
}
