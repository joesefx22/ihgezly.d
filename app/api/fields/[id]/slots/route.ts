// app/api/fields/[id]/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDailySlots } from '@/lib/time-slots/core-logic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json(
        { error: 'التاريخ مطلوب' },
        { status: 400 }
      )
    }

    const date = new Date(dateParam)
    const fieldId = params.id

    // جلب معلومات الملعب
    const field = await prisma.field.findUnique({
      where: { id: fieldId }
    })

    if (!field) {
      return NextResponse.json(
        { error: 'الملعب غير موجود' },
        { status: 404 }
      )
    }

    // توليد الـ slots ليوم معين
    const slots = await generateDailySlots(fieldId, date)

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json(
      { error: 'فشل في جلب المواعيد' },
      { status: 500 }
    )
  }
}
