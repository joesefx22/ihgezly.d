// app/api/fields/[fieldId]/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { generateSlotsForDay } from '@/lib/domain/slots/time-slots/core-logic'  // ✅ المسار الجديد
import { getUISlots } from '@/lib/domain/slots/read-model'  // ✅ المسار الجديد
import { FIELD_STATUS, SLOT_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { apiErrorHandler } from '@/lib/shared/api/api-error-handler'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

export async function GET(
  request: NextRequest,
  { params }: { params: { fieldId: string } }
) {
  const requestId = `get_slots_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const fieldId = params.fieldId
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    logger.info('Fetching slots', { requestId, fieldId, dateParam })

    if (!fieldId) {
      throw new DomainError('VALIDATION_ERROR', 'معرف الملعب مطلوب')
    }

    if (!dateParam) {
      throw new DomainError('VALIDATION_ERROR', 'التاريخ مطلوب')
    }

    const date = new Date(dateParam)
    if (isNaN(date.getTime())) {
      throw new DomainError('VALIDATION_ERROR', 'تنسيق التاريخ غير صالح')
    }

    const field = await prisma.field.findUnique({
      where: { id: fieldId }
    })

    if (!field) {
      throw new DomainError('FIELD_NOT_FOUND', 'الملعب غير موجود')
    }

    if (field.status === FIELD_STATUS.CLOSED) {
      logger.info('Field is closed', { requestId, fieldId })
      return NextResponse.json({
        success: true,
        data: {
          slots: [],
          field: {
            id: field.id,
            name: field.name,
            status: field.status,
            message: 'الملعب مغلق حالياً'
          }
        }
      })
    }

    if (field.status === FIELD_STATUS.MAINTENANCE) {
      logger.info('Field is under maintenance', { requestId, fieldId })
      return NextResponse.json({
        success: true,
        data: {
          slots: [],
          field: {
            id: field.id,
            name: field.name,
            status: field.status,
            message: 'الملعب تحت الصيانة'
          }
        }
      })
    }

    await prisma.slot.updateMany({
      where: {
        fieldId,
        status: SLOT_STATUS.TEMP_LOCKED,
        lockedUntil: { lt: new Date() }
      },
      data: {
        status: SLOT_STATUS.AVAILABLE,
        lockedByUserId: null,
        lockedUntil: null
      }
    })

    const slots = await generateSlotsForDay({
      fieldId,
      date,
      now: new Date()
    })

    const uiSlots = getUISlots(slots)

    logger.info('Slots fetched successfully', { 
      requestId, 
      fieldId, 
      slotCount: uiSlots.length 
    })
    
    return NextResponse.json({
      success: true,
      data: {
        field: {
          id: field.id,
          name: field.name,
          description: field.description,
          status: field.status,
          pricePerHour: field.pricePerHour,
          depositPrice: field.depositPrice,
          openingTime: field.openingTime,
          closingTime: field.closingTime
        },
        slots: uiSlots,
        date: date.toISOString().split('T')[0]
      }
    })

  } catch (error: any) {
    logger.error('Get slots error', error, { requestId })
    return apiErrorHandler(error)
  }
}