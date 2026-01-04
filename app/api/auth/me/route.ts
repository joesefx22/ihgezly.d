// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/infrastructure/auth/auth-options'  // ✅ المسار الجديد
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { successResponse, errorResponse } from '@/lib/infrastructure/auth/responses'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

export const GET = async (request: NextRequest) => {
  const requestId = `auth_me_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Fetching user data', { requestId })
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      logger.warn('Unauthorized access to /api/auth/me', { requestId })
      return NextResponse.json(
        errorResponse('يجب تسجيل الدخول أولاً', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        age: true,
        description: true,
        skillLevel: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      logger.warn('User not found', { requestId, userId: session.user.id })
      return NextResponse.json(
        errorResponse('المستخدم غير موجود', 'USER_NOT_FOUND'),
        { status: 404 }
      )
    }

    if (!user.isActive) {
      logger.warn('Inactive account accessed', { requestId, userId: user.id })
      return NextResponse.json(
        errorResponse('الحساب غير نشط', 'ACCOUNT_INACTIVE'),
        { status: 403 }
      )
    }

    logger.info('User data fetched successfully', { requestId, userId: user.id })
    
    return NextResponse.json(
      successResponse('تم جلب بيانات المستخدم بنجاح', {
        user: {
          ...user,
          lastLogin: user.lastLogin?.toISOString(),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      }, '/api/auth/me')
    )

  } catch (error: any) {
    logger.error('Error in /api/auth/me', error, { requestId })
    return NextResponse.json(
      errorResponse('خطأ في جلب بيانات المستخدم', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}