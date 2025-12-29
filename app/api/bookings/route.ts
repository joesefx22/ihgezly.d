// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'
import { canBookDirectly } from '@/lib/time-slots/core-logic'
import { checkBookingLimits } from '@/lib/time-slots/booking-limits'
import { SLOT_STATUS, BOOKING_STATUS, PAYMENT_STATUS } from '@/lib/constants'

// دالة لتطبيع الحالات القديمة عشان تمنع أخطاء المقارنة
function normalizeSlotStatus(status: string) {
  if (status === 'AVAILABLE_NEEDS_CONFIRM' || status === 'PENDING_CONFIRMATION') {
    return SLOT_STATUS.AVAILABLE_NEEDS_CONFIRM
  }
  return status
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // نعمل type cast عشان نتجنب خطأ "unknown"
    const userId = (session as any)?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        slot: {
          startTime: { gte: new Date() }
        }
      },
      include: { field: true, slot: true },
      orderBy: { slot: { startTime: 'asc' } }
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'فشل في جلب الحجوزات' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const userId = (session as any)?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const { slotId, fieldId, startTime } = await request.json()

    if (!slotId || !fieldId || !startTime) {
      return NextResponse.json({ error: 'بيانات الحجز غير مكتملة' }, { status: 400 })
    }

    await checkBookingLimits({
      userId,
      slotDate: new Date(startTime)
    })

    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { field: true }
    })

    if (!slot || slot.fieldId !== fieldId) {
      return NextResponse.json({ error: 'الموعد غير صالح' }, { status: 404 })
    }

    const normalizedStatus = normalizeSlotStatus(slot.status)

    if (
      normalizedStatus !== SLOT_STATUS.AVAILABLE &&
      normalizedStatus !== SLOT_STATUS.AVAILABLE_NEEDS_CONFIRM
    ) {
      return NextResponse.json({ error: 'الموعد غير متاح للحجز' }, { status: 400 })
    }

    const needsConfirmation = !canBookDirectly(new Date(startTime))

    const bookingStatus = needsConfirmation
      ? BOOKING_STATUS.PENDING_CONFIRMATION
      : BOOKING_STATUS.CONFIRMED

    const newSlotStatus = needsConfirmation
      ? SLOT_STATUS.AVAILABLE_NEEDS_CONFIRM
      : SLOT_STATUS.BOOKED

    const booking = await prisma.$transaction(async (tx) => {
      await tx.slot.update({
        where: { id: slotId },
        data: { status: newSlotStatus as any }
      })

      return tx.booking.create({
        data: {
          userId,
          fieldId,
          slotId,
          status: bookingStatus as any,
          paymentStatus: PAYMENT_STATUS.PENDING,
          totalAmount: slot.field.pricePerHour,
          depositPaid: 0,
          refundableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        include: { field: true, slot: true }
      })
    })

    return NextResponse.json({
      booking,
      needsPayment: !needsConfirmation,
      message: needsConfirmation
        ? 'تم إرسال طلب الحجز وسيتم تأكيده من قبل الموظف'
        : 'تم حجز الموعد بنجاح، يرجى إتمام الدفع'
    })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: error.message || 'فشل في إنشاء الحجز' },
      { status: 500 }
    )
  }
}
