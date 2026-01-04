// app/api/fields/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { FIELD_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { apiErrorHandler } from '@/lib/shared/api/api-error-handler'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

interface Params {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  const requestId = `get_field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const fieldId = params.id

    logger.info('Fetching field details', { requestId, fieldId })

    if (!fieldId) {
      throw new DomainError('VALIDATION_ERROR', 'معرّف الملعب غير صالح')
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
        facilities: true,
        gallery: true,
        rating: true,
        reviewCount: true
      }
    })

    if (!field) {
      logger.warn('Field not found', { requestId, fieldId })
      throw new DomainError('FIELD_NOT_FOUND', 'الملعب غير موجود')
    }

    if (field.status === FIELD_STATUS.CLOSED || field.status === FIELD_STATUS.MAINTENANCE) {
      logger.warn('Field not available', { requestId, fieldId, status: field.status })
      return NextResponse.json({
        success: false,
        error: 'الملعب غير متاح حاليًا',
        code: 'FIELD_UNAVAILABLE',
        field: {
          id: field.id,
          name: field.name,
          status: field.status
        }
      }, { status: 403 })
    }

    logger.info('Field details fetched successfully', { requestId, fieldId })
    
    return NextResponse.json({
      success: true,
      data: {
        field: {
          ...field,
          gallery: field.gallery || []
        }
      }
    })
    
  } catch (error: any) {
    logger.error('Error fetching field', error, { requestId })
    return apiErrorHandler(error)
  }
}