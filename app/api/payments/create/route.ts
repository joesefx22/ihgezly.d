// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/infrastructure/auth/auth-options'  // ✅ المسار الجديد
import { bookingOrchestrator } from '@/lib/application/services/booking-orchestrator'  // ✅ المسار الجديد
import { apiErrorHandler } from '@/lib/shared/api/api-error-handler'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

export async function POST(request: NextRequest) {
  const requestId = `create_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Creating payment', { requestId })

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      logger.warn('Unauthorized payment attempt', { requestId })
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const { bookingId, amount, currency = 'EGP', idempotencyKey } = await request.json()

    if (!bookingId || !amount) {
      logger.warn('Incomplete payment data', { requestId, bookingId, amount })
      return NextResponse.json(
        { error: 'بيانات الدفع غير مكتملة' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      logger.warn('Invalid payment amount', { requestId, amount })
      return NextResponse.json(
        { error: 'قيمة الدفع غير صالحة' },
        { status: 400 }
      )
    }

    const result = await bookingOrchestrator.initiatePayment({
      bookingId,
      amount,
      currency,
      idempotencyKey,
      userId,
    })

    logger.info('Payment initiated successfully', {
      requestId,
      bookingId,
      orderId: result.orderId,
      userId
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'تم بدء عملية الدفع بنجاح'
    })

  } catch (error: any) {
    logger.error('Payment creation error', error, { requestId })
    return apiErrorHandler(error)
  }
}