import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePassword } from '@/lib/auth/security' // ✅ عدلنا هنا
import { registerSchema } from '@/lib/auth/validators'
import { rateLimiter } from '@/lib/auth/rate-limit'
import { handleError, ValidationError, ConflictError } from '@/lib/auth/errors'
import { successResponse, errorResponse } from '@/lib/auth/responses'
import { getClientIp, withAudit } from '@/lib/auth/security'
import { auditLog } from '@/lib/auth/logger'

export const POST = withAudit(async (request: NextRequest) => {
  try {
    const ip = getClientIp(request)
    await rateLimiter.checkForRegister(request, ip)

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // ✅ Password strength
    const passwordCheck = validatePassword(validatedData.password)
    if (!passwordCheck.isValid) {
      throw new ValidationError('كلمة المرور لا تلبي المتطلبات', passwordCheck.errors)
    }

    // ✅ Email exists?
    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    if (existingEmail) {
      throw new ConflictError('البريد الإلكتروني مستخدم بالفعل')
    }

    // ✅ Phone exists?
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: validatedData.phoneNumber }
    })
    if (existingPhone) {
      throw new ConflictError('رقم الهاتف مستخدم بالفعل')
    }

    // ✅ Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // ✅ Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: hashedPassword, // ✅ استخدم العمود الصحيح
        phoneNumber: validatedData.phoneNumber,
        age: validatedData.age,
        description: validatedData.description || '',
        skillLevel: validatedData.skillLevel,
        role: 'PLAYER'
      }
    })

    auditLog(
      user.id,
      'REGISTER',
      'USER',
      user.id,
      null,
      {
        email: user.email,
        phoneNumber: user.phoneNumber,
        skillLevel: user.skillLevel,
        age: user.age
      },
      getClientIp(request),
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json(
      successResponse('تم التسجيل بنجاح! يمكنك تسجيل الدخول الآن.', {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          age: user.age,
          skillLevel: user.skillLevel,
          role: user.role
        }
      }),
      { status: 201 }
    )

  } catch (error: any) {
    const appError = handleError(error)

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
}, 'REGISTER', 'USER')
