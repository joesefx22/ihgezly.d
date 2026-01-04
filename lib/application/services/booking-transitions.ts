// lib/application/services/booking-transitions.ts
import { 
  SLOT_STATUS, 
  BOOKING_STATUS, 
  PAYMENT_STATUS 
} from '@/lib/shared/constants'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد

export class StateTransitionValidator {
  // Slot transitions
  static canTransitionSlot(
    currentStatus: string,
    targetStatus: string,
    userId?: string,
    slotData?: any
  ): { allowed: boolean; reason?: string } {
    
    const allowedTransitions: Record<string, string[]> = {
      [SLOT_STATUS.AVAILABLE]: [
        SLOT_STATUS.TEMP_LOCKED,
        SLOT_STATUS.UNAVAILABLE
      ],
      [SLOT_STATUS.TEMP_LOCKED]: [
        SLOT_STATUS.AVAILABLE, // timeout or manual release
        SLOT_STATUS.BOOKED     // after payment success
      ],
      [SLOT_STATUS.BOOKED]: [
        SLOT_STATUS.AVAILABLE  // admin only
      ],
      [SLOT_STATUS.UNAVAILABLE]: [
        SLOT_STATUS.AVAILABLE  // admin only
      ]
    }

    if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `غير مسموح التحول من ${currentStatus} إلى ${targetStatus}`
      }
    }

    // Additional checks
    if (currentStatus === SLOT_STATUS.TEMP_LOCKED && targetStatus === SLOT_STATUS.AVAILABLE) {
      if (slotData?.lockedByUserId && slotData.lockedByUserId !== userId) {
        return {
          allowed: false,
          reason: 'لا يمكن إلغاء قفل موعد مقفول بواسطة مستخدم آخر'
        }
      }
    }

    if (currentStatus === SLOT_STATUS.BOOKED && targetStatus === SLOT_STATUS.AVAILABLE) {
      // Only admin can release booked slots
      if (userId && !this.isAdmin(userId)) {
        return {
          allowed: false,
          reason: 'فقط المدير يمكنه إلغاء حجز موعد'
        }
      }
    }

    return { allowed: true }
  }

  // Booking transitions
  static canTransitionBooking(
    currentStatus: string,
    targetStatus: string,
    userId?: string,
    bookingData?: any
  ): { allowed: boolean; reason?: string } {
    
    const allowedTransitions: Record<string, string[]> = {
      [BOOKING_STATUS.DRAFT]: [
        BOOKING_STATUS.PENDING_PAYMENT,
        BOOKING_STATUS.EXPIRED,
        BOOKING_STATUS.CANCELLED
      ],
      [BOOKING_STATUS.PENDING_PAYMENT]: [
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.FAILED,
        BOOKING_STATUS.CANCELLED
      ],
      [BOOKING_STATUS.CONFIRMED]: [
        BOOKING_STATUS.CANCELLED // with refund logic
      ],
      [BOOKING_STATUS.CANCELLED]: [],
      [BOOKING_STATUS.FAILED]: [],
      [BOOKING_STATUS.EXPIRED]: []
    }

    if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `غير مسموح تغيير حالة الحجز من ${currentStatus} إلى ${targetStatus}`
      }
    }

    // Ownership check
    if (bookingData?.userId && userId && bookingData.userId !== userId) {
      if (!this.isAdmin(userId)) {
        return {
          allowed: false,
          reason: 'لا يمكنك تعديل حجز مستخدم آخر'
        }
      }
    }

    return { allowed: true }
  }

  // Payment transitions
  static canTransitionPayment(
    currentStatus: string,
    targetStatus: string,
    paymentData?: any
  ): { allowed: boolean; reason?: string } {
    
    const allowedTransitions: Record<string, string[]> = {
      [PAYMENT_STATUS.PENDING]: [
        PAYMENT_STATUS.PROCESSING,
        PAYMENT_STATUS.FAILED
      ],
      [PAYMENT_STATUS.PROCESSING]: [
        PAYMENT_STATUS.PAID,
        PAYMENT_STATUS.FAILED
      ],
      [PAYMENT_STATUS.PAID]: [
        PAYMENT_STATUS.REFUNDED
      ],
      [PAYMENT_STATUS.FAILED]: [
        PAYMENT_STATUS.PROCESSING // retry
      ],
      [PAYMENT_STATUS.REFUNDED]: []
    }

    if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `غير مسموح تغيير حالة الدفع من ${currentStatus} إلى ${targetStatus}`
      }
    }

    return { allowed: true }
  }

  // Helper to validate complete flow
  static validateBookingFlow(
    slotStatus: string,
    bookingStatus: string,
    paymentStatus: string
  ): string[] {
    const errors: string[] = []

    // Valid state combinations
    const validCombinations = [
      // Draft booking on locked slot
      { slot: SLOT_STATUS.TEMP_LOCKED, booking: BOOKING_STATUS.DRAFT, payment: PAYMENT_STATUS.PENDING },
      
      // Payment in progress
      { slot: SLOT_STATUS.TEMP_LOCKED, booking: BOOKING_STATUS.PENDING_PAYMENT, payment: PAYMENT_STATUS.PROCESSING },
      
      // Confirmed
      { slot: SLOT_STATUS.BOOKED, booking: BOOKING_STATUS.CONFIRMED, payment: PAYMENT_STATUS.PAID },
      
      // Failed/Cancelled
      { slot: SLOT_STATUS.AVAILABLE, booking: BOOKING_STATUS.FAILED, payment: PAYMENT_STATUS.FAILED },
      { slot: SLOT_STATUS.AVAILABLE, booking: BOOKING_STATUS.CANCELLED, payment: PAYMENT_STATUS.REFUNDED },
      { slot: SLOT_STATUS.AVAILABLE, booking: BOOKING_STATUS.EXPIRED, payment: PAYMENT_STATUS.FAILED }
    ]

    const isValid = validCombinations.some(combo => 
      combo.slot === slotStatus && 
      combo.booking === bookingStatus && 
      combo.payment === paymentStatus
    )

    if (!isValid) {
      errors.push(`مجموعة الحالات غير صالحة: Slot=${slotStatus}, Booking=${bookingStatus}, Payment=${paymentStatus}`)
    }

    return errors
  }

  private static isAdmin(userId: string): boolean {
    // TODO: Implement admin check from database
    // For now, return false
    return false
  }
}