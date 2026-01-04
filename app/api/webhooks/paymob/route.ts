// app/api/webhooks/paymob/route.ts
import { NextRequest } from 'next/server'
import { bookingOrchestrator } from '@/lib/application/services/booking-orchestrator'  // ✅ المسار الجديد
import { paymobService } from '@/lib/infrastructure/payments/providers'  // ✅ المسار الجديد
import { assertWebhookValid } from '@/lib/domain/guards/payment-guards'  // ✅ المسار الجديد
import { apiErrorHandler } from '@/lib/shared/api/api-error-handler'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

export async function POST(request: NextRequest) {
  const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Processing Paymob webhook', { webhookId })

    const body = await request.json()
    const hmac = request.headers.get('hmac')
    
    if (!hmac) {
      logger.error('HMAC header missing', { webhookId })
      return apiErrorHandler(new Error('HMAC header missing'))
    }

    // 1️⃣ التحقق من HMAC
    if (!paymobService.verifyHMAC(body.obj, hmac)) {
      logger.error('Invalid HMAC signature', { webhookId })
      return apiErrorHandler(new Error('Invalid HMAC signature'))
    }

    // 2️⃣ استخراج البيانات
    const {
      success,
      amount_cents,
      id: transactionId,
      order: { id: orderId, merchant_order_id: bookingId },
      created_at,
      currency = 'EGP'
    } = body.obj

    logger.info('Webhook data extracted', {
      webhookId,
      bookingId,
      orderId,
      transactionId,
      success,
      amount: amount_cents / 100
    })

    // 3️⃣ التحقق من صحة الـ webhook
    const payment = await assertWebhookValid({
      orderId: orderId.toString(),
      transactionId: transactionId.toString(),
      amount: amount_cents / 100,
    })

    logger.info('Webhook validated', {
      webhookId,
      paymentId: payment.id,
      bookingId: payment.bookingId
    })

    // 4️⃣ معالجة الحجز
    await bookingOrchestrator.completeBooking({
      bookingId: payment.bookingId,
      success: Boolean(success),
      paymentDetails: {
        transactionId: transactionId.toString(),
        orderId: orderId.toString(),
        amount: amount_cents / 100,
        currency,
        webhookData: body.obj
      },
    })

    logger.info('Booking processing completed', {
      webhookId,
      bookingId: payment.bookingId,
      success
    })

    // 5️⃣ إرجاع استجابة ناجحة لـ Paymob
    return new Response('OK', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    })

  } catch (error: any) {
    logger.error('Webhook processing error', error, { webhookId })
    
    // إرجاع استجابة لـ Paymob حتى في حالة الخطأ
    // (Paymob سيعيد المحاولة لاحقاً)
    return new Response('ERROR', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
}