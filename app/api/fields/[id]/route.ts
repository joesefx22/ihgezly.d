// app/api/fields/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FIELD_STATUS } from '@/lib/constants'

interface Params {
  params: {
    id: string
  }
}

export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const fieldId = params.id

    if (!fieldId) {
      return NextResponse.json(
        { error: 'معرّف الملعب غير صالح' },
        { status: 400 }
      )
    }

    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        address: true,
        type: true,
        imageUrl: true,
        pricePerHour: true,
        depositPrice: true,
        openingTime: true,
        closingTime: true,
        slotDurationMin: true,
        status: true,
        facilities: true
      }
    })

    if (!field) {
      return NextResponse.json(
        { error: 'الملعب غير موجود' },
        { status: 404 }
      )
    }

    // اللاعب لا يرى الملاعب المقفولة أو تحت الصيانة
    if (
      field.status === FIELD_STATUS.CLOSED ||
      field.status === FIELD_STATUS.MAINTENANCE
    ) {
      return NextResponse.json(
        { error: 'الملعب غير متاح حاليًا' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      field: {
        id: field.id,
        name: field.name,
        description: field.description,
        location: field.location,
        address: field.address,
        type: field.type,
        imageUrl: field.imageUrl,
        pricePerHour: field.pricePerHour,
        depositPrice: field.depositPrice,
        openingTime: field.openingTime,
        closingTime: field.closingTime,
        slotDurationMin: field.slotDurationMin,
        facilities: field.facilities,
        status: field.status
      }
    })
  } catch (error) {
    console.error('Error fetching field:', error)

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل بيانات الملعب' },
      { status: 500 }
    )
  }
}
