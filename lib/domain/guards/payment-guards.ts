// lib/domain/guards/payment-guards.ts
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { 
  PAYMENT_STATUS, 
  BOOKING_STATUS 
} from '@/lib/shared/constants'  // ✅ المسار الجديد
import { StateTransitionValidator } from '@/lib/application/services/booking-transitions'  // ✅ المسار الجديد

export class PaymentStateGuard {
  static async assertCanProcessPayment(params: {
    bookingId: string
    userId: string
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        slot: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!booking) {
      throw new DomainError('BOOKING_NOT_FOUND')
    }

    if (booking.userId !== params.userId) {
      throw new DomainError('BOOKING_NOT_OWNED')
    }

    if (booking.status !== BOOKING_STATUS.DRAFT) {
      throw new DomainError(
        'BOOKING_INVALID_STATE',
        `لا يمكن الدفع لحجز بحالة ${booking.status}`
      )
    }

    if (booking.expiresAt && booking.expiresAt < new Date()) {
      throw new DomainError('BOOKING_EXPIRED')
    }

    if (booking.slot.status !== 'TEMP_LOCKED') {
      throw new DomainError('SLOT_LOCK_EXPIRED')
    }

    const lastPayment = booking.payments[0]
    if (lastPayment?.status === PAYMENT_STATUS.PAID) {
      throw new DomainError('PAYMENT_ALREADY_PROCESSED')
    }

    return { booking, lastPayment }
  }

  static async assertCanUpdatePayment(params: {
    paymentId: string
    targetStatus: string
    orderId?: string
  }) {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { booking: true }
    })

    if (!payment) {
      throw new DomainError('PAYMENT_NOT_FOUND')
    }

    if (params.orderId) {
      const existing = await prisma.payment.findUnique({
        where: { orderId: params.orderId }
      })
      
      if (existing && existing.id !== payment.id) {
        throw new DomainError('DUPLICATE_PAYMENT')
      }
    }

    const validation = StateTransitionValidator.canTransitionPayment(
      payment.status,
      params.targetStatus,
      payment
    )

    if (!validation.allowed) {
      throw new DomainError(
        'PAYMENT_FAILED',
        validation.reason
      )
    }

    return payment
  }

  static async assertWebhookValid(params: {
    orderId: string
    transactionId: string
    amount: number
  }) {
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: params.orderId }
    })

    if (existingPayment) {
      if (existingPayment.status === PAYMENT_STATUS.PAID) {
        throw new DomainError('PAYMENT_ALREADY_PROCESSED')
      }
      
      if (existingPayment.paymentId === params.transactionId) {
        throw new DomainError('DUPLICATE_PAYMENT')
      }
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId: params.orderId },
      include: { booking: true }
    })

    if (!payment) {
      throw new DomainError('PAYMENT_NOT_FOUND')
    }

    if (payment.amount !== params.amount) {
      throw new DomainError(
        'PAYMENT_FAILED',
        `المبلغ غير متطابق: ${payment.amount} != ${params.amount}`
      )
    }

    return payment
  }
}

export const assertPaymentCanProcess = PaymentStateGuard.assertCanProcessPayment.bind(PaymentStateGuard)
export const assertPaymentUpdate = PaymentStateGuard.assertCanUpdatePayment.bind(PaymentStateGuard)
export const assertWebhookValid = PaymentStateGuard.assertWebhookValid.bind(PaymentStateGuard)