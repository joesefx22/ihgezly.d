// lib/domain/guards/slot-guards.ts
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { SLOT_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { StateTransitionValidator } from '@/lib/application/services/booking-transitions'  // ✅ المسار الجديد

export class SlotStateGuard {
  static async assertCanBeLocked(params: {
    slotId: string
    userId: string
    fieldId: string
  }) {
    const slot = await prisma.slot.findUnique({
      where: { id: params.slotId },
      include: { field: true }
    })

    if (!slot) {
      throw new DomainError('SLOT_NOT_FOUND')
    }

    if (slot.fieldId !== params.fieldId) {
      throw new DomainError('SLOT_NOT_FOUND', 'الموعد لا ينتمي لهذا الملعب')
    }

    const now = new Date()

    if (slot.status === SLOT_STATUS.BOOKED) {
      throw new DomainError('SLOT_ALREADY_BOOKED')
    }

    if (slot.status === SLOT_STATUS.UNAVAILABLE) {
      throw new DomainError('SLOT_UNAVAILABLE')
    }

    if (new Date(slot.startTime) <= now) {
      throw new DomainError('TIME_IN_PAST')
    }

    if (slot.status === SLOT_STATUS.TEMP_LOCKED && slot.lockedUntil && slot.lockedUntil > now) {
      if (slot.lockedByUserId === params.userId) {
        return { slot, canExtend: true }
      } else {
        throw new DomainError('SLOT_LOCKED_BY_OTHER')
      }
    }

    return { slot, canExtend: false }
  }

  static async assertIsLockedToUser(params: {
    slotId: string
    userId: string
  }) {
    const slot = await prisma.slot.findUnique({
      where: { id: params.slotId }
    })

    if (!slot) {
      throw new DomainError('SLOT_NOT_FOUND')
    }

    const now = new Date()

    if (slot.status !== SLOT_STATUS.TEMP_LOCKED) {
      throw new DomainError('SLOT_CANNOT_BE_LOCKED', 'الموعد غير مقفول')
    }

    if (!slot.lockedUntil || slot.lockedUntil <= now) {
      throw new DomainError('SLOT_LOCK_EXPIRED')
    }

    if (slot.lockedByUserId !== params.userId) {
      throw new DomainError('SLOT_LOCKED_BY_OTHER')
    }

    return slot
  }

  static async assertCanTransition(params: {
    slotId: string
    targetStatus: string
    userId?: string
  }) {
    const slot = await prisma.slot.findUnique({
      where: { id: params.slotId }
    })

    if (!slot) {
      throw new DomainError('SLOT_NOT_FOUND')
    }

    const validation = StateTransitionValidator.canTransitionSlot(
      slot.status,
      params.targetStatus,
      params.userId,
      slot
    )

    if (!validation.allowed) {
      throw new DomainError(
        'SLOT_CANNOT_BE_LOCKED',
        validation.reason
      )
    }

    return slot
  }

  static async cleanupExpiredLocks() {
    const now = new Date()
    
    const result = await prisma.slot.updateMany({
      where: {
        status: SLOT_STATUS.TEMP_LOCKED,
        lockedUntil: { lt: now }
      },
      data: {
        status: SLOT_STATUS.AVAILABLE,
        lockedByUserId: null,
        lockedUntil: null
      }
    })

    return result.count
  }
}

export const assertSlotCanLock = SlotStateGuard.assertCanBeLocked.bind(SlotStateGuard)
export const assertSlotLocked = SlotStateGuard.assertIsLockedToUser.bind(SlotStateGuard)
export const assertSlotTransition = SlotStateGuard.assertCanTransition.bind(SlotStateGuard)