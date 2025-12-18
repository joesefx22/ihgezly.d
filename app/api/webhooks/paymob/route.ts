// app/api/webhooks/paymob/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { paymob } from '@/lib/paymob'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const hmac = request.headers.get('hmac')

    // التحقق من صحة الـ Webhook
    if (!hmac || !paymob.verifyHMAC(body.obj, hmac)) {
      console.error('Invalid HMAC signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const { 
      id: transactionId,
      amount_cents,
      success,
      order: { id: orderId, merchant_order_id: bookingId },
      created_at,
      currency,
      source_data: { pan, sub_type, type }
    } = body.obj

    // البحث عن الحجز المرتبط
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { field: true }
    })

    if (!booking) {
      console.error('Booking not found:', bookingId)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // تحديث حالة الدفع
    if (success) {
      await prisma.$transaction(async (tx) => {
        // تحديث حالة الحجز
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paymentId: transactionId.toString()
          }
        })

        // تحديث حالة الـ Slot
        await tx.slot.update({
          where: { id: booking.slotId },
          data: { status: 'BOOKED' }
        })

        // إنشاء سجل الدفع
        await tx.payment.create({
          data: {
            bookingId,
            amount: amount_cents / 100,
            currency,
            paymentId: transactionId.toString(),
            orderId: orderId.toString(),
            status: 'PAID',
            metadata: {
              pan,
              sub_type,
              type,
              created_at: new Date(created_at * 1000)
            }
          }
        })

        // إرسال إشعار للمستخدم
        await tx.notification.create({
          data: {
            userId: booking.userId,
            type: 'PAYMENT_SUCCESS',
            title: 'تم الدفع بنجاح',
            message: `تم دفع ${amount_cents / 100} ج.م لحجزك في ${booking.field.name}`,
            relatedId: bookingId,
            data: {
              amount: amount_cents / 100,
              fieldName: booking.field.name,
              date: booking.slot.startTime
            }
          }
        })
      })

      console.log(`Payment successful for booking ${bookingId}`)
    } else {
      // فشل الدفع
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'FAILED',
            paymentStatus: 'FAILED'
          }
        })

        // إعادة الـ Slot لمتاح
        await tx.slot.update({
          where: { id: booking.slotId },
          data: { status: 'AVAILABLE' }
        })

        // إشعار بالفشل
        await tx.notification.create({
          data: {
            userId: booking.userId,
            type: 'PAYMENT_FAILED',
            title: 'فشل الدفع',
            message: 'فشل عملية الدفع، يرجى المحاولة مرة أخرى',
            relatedId: bookingId
          }
        })
      })

      console.log(`Payment failed for booking ${bookingId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
