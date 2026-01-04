// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { prisma } from '@/lib/infrastructure/database/prisma'  
import { hashPassword } from '@/lib/infrastructure/security/password'  // ✅ المسار الجديد
import { z } from 'zod'
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

// Rate Limiter للتسجيل
const registerRateLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60 * 60,
  blockDuration: 60 * 60,
})

const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(72, 'كلمة المرور طويلة جداً'),
  phoneNumber: z.string().min(10, 'رقم الهاتف غير صالح'),
  age: z.number().min(13, 'العمر يجب أن يكون 13 سنة على الأقل'),
  skillLevel: z.enum(['WEAK', 'AVERAGE', 'GOOD', 'EXCELLENT', 'LEGENDARY'])
})

const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

const checkRegisterRateLimit = async (ip: string) => {
  try {
    await registerRateLimiter.consume(ip)
    return { allowed: true }
  } catch (rateLimiterRes: any) {
    const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 60
    throw new Error(`لقد تجاوزت الحد المسموح به من التسجيلات. حاول مرة أخرى بعد ${retryAfter} ثانية`)
  }
}

const getClientIp = (request: NextRequest): string => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  return realIp || 'unknown'
}

export async function POST(request: NextRequest) {
  const requestId = `register_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Registration attempt', { requestId })
    
    const clientIp = getClientIp(request)
    await checkRegisterRateLimit(clientIp)
    
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const normalizedEmail = normalizeEmail(validatedData.email)

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      logger.warn('Email already exists', { requestId, email: normalizedEmail })
      return NextResponse.json(
        { 
          success: false,
          error: 'البريد الإلكتروني مستخدم بالفعل',
          code: 'EMAIL_ALREADY_EXISTS'
        },
        { status: 409 }
      )
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: validatedData.phoneNumber }
    })

    if (existingPhone) {
      logger.warn('Phone already exists', { requestId, phone: validatedData.phoneNumber })
      return NextResponse.json(
        { 
          success: false,
          error: 'رقم الهاتف مستخدم بالفعل',
          code: 'PHONE_ALREADY_EXISTS'
        },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(validatedData.password)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        phoneNumber: validatedData.phoneNumber,
        age: validatedData.age,
        skillLevel: validatedData.skillLevel,
        role: 'PLAYER',
        roleUpdatedAt: new Date(),
        isActive: true,
        isVerified: false,
        emailVerifiedAt: null
      }
    })

    logger.info('Registration successful', { requestId, userId: user.id })
    
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        requiresVerification: true
      }
    }, { status: 201 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      const firstError = error.errors[0]
      logger.warn('Validation error in registration', { requestId, error: firstError.message })
      return NextResponse.json(
        { 
          success: false,
          error: firstError.message,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    if (error.message.includes('لقد تجاوزت الحد المسموح')) {
      logger.warn('Rate limit exceeded', { requestId, error: error.message })
      return NextResponse.json(
        { 
          success: false,
          error: error.message,
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      )
    }

    logger.error('Registration error', error, { requestId })
    return NextResponse.json(
      { 
        success: false,
        error: 'فشل في إنشاء الحساب',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    )
  }
}