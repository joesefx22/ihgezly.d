// app/api/fields/[id]/slots/[date]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseISO, isValid, startOfDay } from 'date-fns'
import { generateSlotsForDay } from '@/lib/domain/slots/time-slots/core-logic'  // ✅ المسار الجديد
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { SLOT_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { apiErrorHandler } from '@/lib/shared/api/api-error-handler'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; date: string } }
) {
  const requestId = `get_slots_by_date_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { id: fieldId, date } = params

    logger.info('Fetching slots by date', { requestId, fieldId, date })

    if (!fieldId || !date) {
      throw new DomainError('VALIDATION_ERROR', 'معرف الملعب والتاريخ مطلوبان')
    }

    const parsedDate = parseISO(date)

    if (!isValid(parsedDate)) {
      throw new DomainError('VALIDATION_ERROR', 'تنسيق التاريخ غير صالح. يجب أن يكون YYYY-MM-DD')
    }

    const now = new Date()

    await prisma.slot.updateMany({
      where: {
        fieldId,
        status: SLOT_STATUS.TEMP_LOCKED,
        lockedUntil: { lt: now }
      },
      data: {
        status: SLOT_STATUS.AVAILABLE,
        lockedUntil: null,
        lockedByUserId: null
      }
    })

    const slots = await generateSlotsForDay({
      fieldId,
      date: startOfDay(parsedDate),
      now
    })

    const normalizedSlots = slots.map(slot => ({
      ...slot,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString()
    }))

    logger.info('Slots by date fetched successfully', { 
      requestId, 
      fieldId, 
      date,
      slotCount: normalizedSlots.length 
    })
    
    return NextResponse.json({
      success: true,
      data: {
        fieldId,
        date: parsedDate.toISOString().split('T')[0],
        slots: normalizedSlots
      }
    })
    
  } catch (error: any) {
    logger.error('Get slots by date error', error, { requestId })
    return apiErrorHandler(error)
  }
}