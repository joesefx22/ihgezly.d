// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { authOptions } from '@/lib/infrastructure/auth/auth-options'  // ✅ المسار الجديد
import { bookingOrchestrator } from '@/lib/application/services/booking-orchestrator'  // ✅ المسار الجديد
import { IdempotencyGuard } from '@/lib/application/idempotency/idempotency-guard'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { apiErrorHandler } from '@/lib/shared/api/api-error-handler'  // ✅ المسار الجديد
import { 
  BOOKING_STATUS 
} from '@/lib/shared/constants'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

export async function GET(request: NextRequest) {
  const requestId = `get_bookings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Fetching bookings', { requestId })
    
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      logger.warn('Unauthorized access to bookings', { requestId })
      throw new DomainError('UNAUTHORIZED')
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: any = { userId }
    
    if (status) {
      where.status = status
    } else {
      where.status = {
        in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING_PAYMENT]
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          field: {
            select: {
              id: true,
              name: true,
              pricePerHour: true
            }
          },
          slot: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              durationMinutes: true
            }
          },
          payments: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ])

    logger.info('Bookings fetched successfully', { 
      requestId, 
      userId, 
      count: bookings.length,
      total 
    })
    
    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })

  } catch (error: any) {
    logger.error('Get bookings error', error, { requestId })
    return apiErrorHandler(error)
  }
}

export async function POST(request: NextRequest) {
  const requestId = `create_booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Creating booking', { requestId })
    
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      logger.warn('Unauthorized booking creation attempt', { requestId })
      throw new DomainError('UNAUTHORIZED')
    }

    const { slotId, fieldId, idempotencyKey } = await request.json()

    if (!slotId || !fieldId) {
      logger.warn('Incomplete booking data', { requestId, slotId, fieldId })
      throw new DomainError('VALIDATION_ERROR', 'بيانات الحجز غير مكتملة')
    }

    const finalKey = idempotencyKey || IdempotencyGuard.generateKey('booking')

    const result = await bookingOrchestrator.createBooking({
      userId,
      slotId,
      fieldId,
      idempotencyKey: finalKey
    })

    logger.info('Booking created successfully', { 
      requestId, 
      bookingId: result.bookingId,
      userId 
    })
    
    return NextResponse.json({
      success: true,
      ...result,
      idempotencyKey: finalKey
    })

  } catch (error: any) {
    logger.error('Create booking error', error, { requestId })
    return apiErrorHandler(error)
  }
}