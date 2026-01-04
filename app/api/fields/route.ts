// app/api/fields/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { FIELD_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { apiErrorHandler } from '@/lib/shared/api/api-error-handler'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

export async function GET(request: NextRequest) {
  const requestId = `get_fields_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Fetching fields', { requestId })
    
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const location = searchParams.get('location')

    const where: any = {
      status: FIELD_STATUS.OPEN
    }

    if (type) {
      where.type = type.toUpperCase()
    }

    if (location && location !== 'الكل') {
      where.location = location
    }

    const fields = await prisma.field.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    logger.info('Fields fetched successfully', { requestId, count: fields.length })
    
    return NextResponse.json({ 
      success: true,
      data: fields,
      count: fields.length 
    })
    
  } catch (error: any) {
    logger.error('Error fetching fields', error, { requestId })
    return apiErrorHandler(error)
  }
}