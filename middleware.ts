// middleware.ts (لحماية صفحات الدفع)
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // حماية صفحات الدفع
    if (req.nextUrl.pathname.startsWith('/payment')) {
      if (!req.nextauth.token) {
        return NextResponse.redirect(
          new URL(`/login?redirect=${req.nextUrl.pathname}`, req.url)
        )
      }
    }

    // حماية لوحة تحكم الموظف
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (req.nextauth.token?.role !== 'EMPLOYEE' && req.nextauth.token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/payment/:path*', '/dashboard/:path*', '/bookings/:path*']
}
