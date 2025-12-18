// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { paymob } from '@/lib/paymob'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'رقم الحجز مطلوب' },
        { status: 400 }
      )
    }

    // جلب تفاصيل الحجز
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        userId: session.user.id 
      },
      include: {
        field: true,
        slot: true,
        user: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'الحجز غير موجود' },
        { status: 404 }
      )
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'تم دفع هذا الحجز مسبقاً' },
        { status: 400 }
      )
    }

    // إنشاء Order في Paymob
    const order = await paymob.createOrder({
      amount: booking.totalAmount,
      bookingId,
      userId: session.user.id
    })

    // بيانات الفاتورة
    const billingData = {
      apartment: "NA",
      email: session.user.email,
      floor: "NA",
      first_name: session.user.name.split(' ')[0] || 'عميل',
      street: "NA",
      building: "NA",
      phone_number: booking.user.phone || "01000000000",
      shipping_method: "NA",
      postal_code: "NA",
      city: "NA",
      country: "EG",
      last_name: session.user.name.split(' ').slice(1).join(' ') || 'كريم',
      state: "NA"
    }

    // الحصول على Payment Token
    const paymentToken = await paymob.getPaymentKey({
      orderId: order.id,
      amount: booking.totalAmount,
      billingData,
      bookingId
    })

    return NextResponse.json({
      paymentToken,
      amount: booking.totalAmount,
      deposit: booking.field.depositPrice,
      total: booking.totalAmount,
      fieldName: booking.field.name,
      date: booking.slot.startTime,
      time: new Date(booking.slot.startTime).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      })
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'فشل في تهيئة الدفع' },
      { status: 500 }
    )
  }
}
