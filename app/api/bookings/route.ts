// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { canBookDirectly } from '@/lib/time-slots/core-logic'
import { checkBookingLimits } from '@/lib/time-slots/booking-limits'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        slot: {
          startTime: {
            gte: new Date() // الحجوزات المستقبلية فقط
          }
        }
      },
      include: {
        field: true,
        slot: true
      },
      orderBy: {
        slot: {
          startTime: 'asc'
        }
      }
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الحجوزات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { slotId, fieldId, startTime } = body

    // التحقق من حدود الحجز
    await checkBookingLimits({
      userId: session.user.id,
      slotDate: new Date(startTime)
    })

    // البحث عن الـ slot
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { field: true }
    })

    if (!slot) {
      return NextResponse.json(
        { error: 'الموعد غير موجود' },
        { status: 404 }
      )
    }

    if (slot.status !== 'AVAILABLE' && slot.status !== 'NEED_CONFIRMATION') {
      return NextResponse.json(
        { error: 'الموعد غير متاح للحجز' },
        { status: 400 }
      )
    }

    // تحديد حالة الحجز بناءً على الوقت
    const needsConfirmation = !canBookDirectly(new Date(startTime))
    
    let bookingStatus = 'CONFIRMED'
    let slotStatus = 'BOOKED'
    
    if (needsConfirmation) {
      bookingStatus = 'PENDING_CONFIRMATION'
      slotStatus = 'NEED_CONFIRMATION'
    }

    // إنشاء الحجز
    const booking = await prisma.$transaction(async (tx) => {
      // تحديث حالة الـ slot
      await tx.slot.update({
        where: { id: slotId },
        data: { status: slotStatus }
      })

      // إنشاء الحجز
      return await tx.booking.create({
        data: {
          userId: session.user.id,
          fieldId,
          slotId,
          status: bookingStatus,
          paymentStatus: needsConfirmation ? 'PENDING' : 'PENDING',
          totalAmount: slot.field.pricePerHour,
          depositPaid: 0,
          refundableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ساعة
        },
        include: {
          field: true,
          slot: true
        }
      })
    })

    return NextResponse.json({
      booking,
      needsPayment: !needsConfirmation,
      message: needsConfirmation 
        ? 'تم تقديم طلب الحجز بنجاح، سيتم تأكيده من قبل الموظف'
        : 'تم حجز الموعد بنجاح، يرجى إكمال عملية الدفع'
    })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    
    if (error.message.includes('booking limit')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'فشل في إنشاء الحجز' },
      { status: 500 }
    )
  }
}
