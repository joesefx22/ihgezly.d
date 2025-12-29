// app/api/fields/[id]/slots/[date]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseISO, isValid, startOfDay } from 'date-fns'
import { generateSlotsForDay } from '@/lib/time-slots/core-logic'
import { prisma } from '@/lib/prisma' // ✅ تأكد إن عندك import للـ prisma client

export async function GET(
  req: NextRequest,
  {
    params
  }: {
    params: { id: string; date: string }
  }
) {
  try {
    const { id: fieldId, date } = params

    if (!fieldId || !date) {
      return NextResponse.json(
        { error: 'Missing field id or date' },
        { status: 400 }
      )
    }

    // Expected format: YYYY-MM-DD
    const parsedDate = parseISO(date)

    if (!isValid(parsedDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const now = new Date()

    // ✅ تنظيف الـ locks المنتهية قبل أي عرض
    await prisma.slot.updateMany({
      where: {
        fieldId,
        status: 'TEMP_LOCKED',
        lockedUntil: { lt: now }
      },
      data: {
        status: 'AVAILABLE',
        lockedUntil: null,
        lockedByUserId: null
      }
    })

    // ✅ الاستدعاء متوافق مع الـ type الأصلي
    const slots = await generateSlotsForDay({
      fieldId,
      date: startOfDay(parsedDate),
      now
    })

    // ✅ نحول الـ Date objects لـ ISO strings قبل الإرسال
    const normalizedSlots = slots.map(slot => ({
      ...slot,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString()
    }))

    return NextResponse.json({
      fieldId,
      date: parsedDate.toISOString().split('T')[0],
      slots: normalizedSlots
    })
  } catch (error) {
    console.error('[FIELDS_SLOTS_API_ERROR]', error)

    return NextResponse.json(
      { error: 'Failed to load field slots' },
      { status: 500 }
    )
  }
}
