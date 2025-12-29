// app/api/fields/[id]/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlotsForDay } from '@/lib/time-slots/core-logic'
import { FIELD_STATUS } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fieldId = params.id
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    if (!fieldId) {
      return NextResponse.json({ slots: [] }, { status: 200 })
    }

    if (!dateParam) {
      return NextResponse.json(
        { slots: [], error: 'التاريخ مطلوب' },
        { status: 400 }
      )
    }

    const date = new Date(dateParam)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { slots: [], error: 'تنسيق التاريخ غير صالح' },
        { status: 400 }
      )
    }

    const field = await prisma.field.findUnique({
      where: { id: fieldId }
    })

    if (!field) {
      return NextResponse.json(
        { slots: [], error: 'الملعب غير موجود' },
        { status: 404 }
      )
    }

    // اللاعب لا يرى slots لو الملعب مقفول أو صيانة
    if (
      field.status === FIELD_STATUS.CLOSED ||
      field.status === FIELD_STATUS.MAINTENANCE
    ) {
      return NextResponse.json({ slots: [] }, { status: 200 })
    }

    const slots = await generateSlotsForDay({
      fieldId,
      date,
      now: new Date()
    })

    // ✅ فلترة الـ UNAVAILABLE
    const visibleSlots = Array.isArray(slots)
      ? slots.filter(slot => slot.status !== 'UNAVAILABLE')
      : []

    return NextResponse.json({ slots: visibleSlots })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { slots: [], error: 'فشل في جلب المواعيد' },
      { status: 500 }
    )
  }
}
