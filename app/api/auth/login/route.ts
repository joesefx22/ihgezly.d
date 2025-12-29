import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, checkRateLimit, getClientIp, withAudit } from "@/lib/auth/security"
import { loginSchema } from '@/lib/auth/validators'
import { handleError, AuthenticationError } from '@/lib/auth/errors'
import { successResponse, errorResponse } from '@/lib/auth/responses'
import { auditLog } from '@/lib/auth/logger'

export const POST = withAudit(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Rate limiting
    const rateLimitResult = await checkRateLimit(validatedData.email, 'LOGIN')
    if (!rateLimitResult.allowed) {
      throw new AuthenticationError('لقد تجاوزت الحد المسموح به من المحاولات. حاول مرة أخرى لاحقاً.')
    }

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      throw new AuthenticationError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    }

    if (!user.isActive) {
      throw new AuthenticationError('الحساب غير نشط')
    }

    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.passwordHash
    )

    if (!isPasswordValid) {
      throw new AuthenticationError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), updatedAt: new Date() }
    })

    const response = NextResponse.json(
      successResponse('تم تسجيل الدخول بنجاح', {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          age: user.age,
          description: user.description,
          skillLevel: user.skillLevel,
          role: user.role,
          lastLogin: user.lastLogin
        }
      })
    )

    response.cookies.set('userId', String(user.id), {
      httpOnly: true,
      sameSite: 'strict',
      path: '/'
    })

    response.cookies.set('userRole', user.role, {
      httpOnly: false,
      sameSite: 'strict',
      path: '/'
    })

    auditLog(
      user.id,
      'LOGIN',
      'USER',
      user.id,
      null,
      { method: 'email_password' },
      getClientIp(request),
      request.headers.get('user-agent') || undefined
    )

    return response

  } catch (error: any) {
    const appError = handleError(error)

    auditLog(
      null,
      'LOGIN_FAILED',
      'USER',
      undefined,
      null,
      { error: appError.message },
      getClientIp(request),
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json(
      errorResponse(
        appError.message,
        appError.errorCode,
        appError.details,
        request.nextUrl.pathname
      ),
      { status: appError.statusCode }
    )
  }
}, 'LOGIN', 'USER')