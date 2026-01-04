// lib/domain/guards/booking-guards.ts
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { 
  SLOT_STATUS, 
  BOOKING_STATUS 
} from '@/lib/shared/constants'  // ✅ المسار الجديد
import { StateTransitionValidator } from '@/lib/application/services/booking-transitions'  // ✅ المسار الجديد

export class BookingGuard {
  static async assertBookingState(params: {
    bookingId: string
    expectedStatuses: string[]
    userId?: string
    customCheck?: (booking: any) => Promise<void>
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: { slot: true, field: true }
    })

    if (!booking) {
      throw new DomainError('BOOKING_NOT_FOUND')
    }

    if (params.userId && booking.userId !== params.userId) {
      throw new DomainError('BOOKING_NOT_OWNED')
    }

    if (!params.expectedStatuses.includes(booking.status)) {
      throw new DomainError(
        'BOOKING_INVALID_STATE',
        `الحالة الحالية (${booking.status}) لا تسمح بهذه العملية. ` +
        `الحالات المسموحة: ${params.expectedStatuses.join(', ')}`
      )
    }

    const transitionErrors = StateTransitionValidator.validateBookingFlow(
      booking.slot.status,
      booking.status,
      booking.paymentStatus
    )

    if (transitionErrors.length > 0) {
      throw new DomainError('BOOKING_INVALID_STATE', transitionErrors.join(' | '))
    }

    if (params.customCheck) {
      await params.customCheck(booking)
    }

    return booking
  }

  static async assertSlotLockedToUser(params: {
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
      throw new DomainError('SLOT_CANNOT_BE_LOCKED')
    }

    if (!slot.lockedUntil || slot.lockedUntil <= now) {
      throw new DomainError('SLOT_LOCK_EXPIRED')
    }

    if (slot.lockedByUserId !== params.userId) {
      throw new DomainError('SLOT_LOCKED_BY_OTHER')
    }

    return slot
  }

  static async assertSlotCanBeLocked(params: {
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

    if (slot.status === SLOT_STATUS.BOOKED) {
      throw new DomainError('SLOT_ALREADY_BOOKED')
    }

    if (slot.status === SLOT_STATUS.UNAVAILABLE) {
      throw new DomainError('SLOT_UNAVAILABLE')
    }

    if (new Date(slot.startTime) <= now) {
      throw new DomainError('TIME_IN_PAST')
    }

    if (
      slot.status === SLOT_STATUS.TEMP_LOCKED &&
      slot.lockedUntil &&
      slot.lockedUntil > now
    ) {
      if (slot.lockedByUserId === params.userId) {
        return { slot, canExtend: true }
      } else {
        throw new DomainError('SLOT_LOCKED_BY_OTHER')
      }
    }

    return { slot, canExtend: false }
  }
}

export const assertBooking = BookingGuard.assertBookingState.bind(BookingGuard)
export const assertSlotLocked = BookingGuard.assertSlotLockedToUser.bind(BookingGuard)
export const assertSlotCanLock = BookingGuard.assertSlotCanBeLocked.bind(BookingGuard)