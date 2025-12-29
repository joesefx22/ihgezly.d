// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { successResponse } from '@/lib/auth/responses'
import { withAudit, getClientIp } from '@/lib/auth/security' // ✅ عدلنا المسار

export const POST = withAudit(async (request: NextRequest) => {
  // ✅ ممكن تستخدم الـ IP لو محتاجه في الـ audit
  const ip = getClientIp(request)

  // ✅ Response
  const response = NextResponse.json(
    successResponse('تم تسجيل الخروج بنجاح')
  )

  // ✅ Clear cookies (حتى لو مش مستخدمين tokens)
  response.cookies.set('accessToken', '', { 
    expires: new Date(0),
    path: '/'
  })

  response.cookies.set('refreshToken', '', { 
    expires: new Date(0),
    path: '/'
  })

  return response
}, 'LOGOUT', 'USER')
