// app/api/fields/[fieldId]/slots/[slotId]/lock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { authOptions } from '@/lib/infrastructure/auth/auth-options'  // ✅ المسار الجديد
import { addMinutes } from 'date-fns'
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { apiErrorHandler } from '@/lib/shared/api/api-error-handler'  // ✅ المسار الجديد
import { SLOT_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد
import { assertSlotCanLock } from '@/lib/domain/guards/slot-guards'  // ✅ المسار الجديد

const LOCK_DURATION_MINUTES = 5

export async function POST(
  request: NextRequest,
  { params }: { params: { fieldId: string; slotId: string } }
) {
  const requestId = `lock_slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Locking slot', { requestId, ...params })

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      logger.warn('Unauthorized lock attempt', { requestId })
      throw new DomainError('UNAUTHORIZED')
    }

    const { slotId, fieldId } = params
    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.slot.updateMany({
        where: {
          id: slotId,
          fieldId: fieldId,
          OR: [
            {
              status: SLOT_STATUS.AVAILABLE
            },
            {
              status: SLOT_STATUS.TEMP_LOCKED,
              OR: [
                { lockedUntil: null },
                { lockedUntil: { lt: now } }
              ]
            }
          ]
        },
        data: {
          status: SLOT_STATUS.TEMP_LOCKED,
          lockedUntil: addMinutes(now, LOCK_DURATION_MINUTES),
          lockedByUserId: userId
        }
      })

      if (updateResult.count === 0) {
        const slot = await tx.slot.findUnique({
          where: { id: slotId }
        })

        if (!slot) {
          throw new DomainError('SLOT_NOT_FOUND')
        }

        if (slot.status === SLOT_STATUS.BOOKED) {
          throw new DomainError('SLOT_ALREADY_BOOKED')
        }

        if (slot.status === SLOT_STATUS.TEMP_LOCKED && slot.lockedUntil && slot.lockedUntil > now) {
          if (slot.lockedByUserId === userId) {
            await tx.slot.update({
              where: { id: slotId },
              data: {
                lockedUntil: addMinutes(now, LOCK_DURATION_MINUTES)
              }
            })
            
            logger.info('Slot lock extended', { requestId, slotId, userId })
            return { success: true, extended: true }
          } else {
            throw new DomainError('SLOT_LOCKED_BY_OTHER')
          }
        }

        throw new DomainError('SLOT_CANNOT_BE_LOCKED')
      }

      logger.info('Slot locked successfully', { requestId, slotId, userId })
      return { success: true, locked: true }
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: result.extended ? 'تم تمديد القفل' : 'تم قفل الموعد بنجاح'
    })

  } catch (error: any) {
    logger.error('Lock error', error, { requestId })
    return apiErrorHandler(error)
  }
}