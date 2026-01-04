// lib/application/services/booking-orchestrator.ts
import { prisma } from '@/lib/infrastructure/database/prisma'
import { addMinutes } from 'date-fns'
import { 
  SLOT_STATUS, 
  BOOKING_STATUS, 
  PAYMENT_STATUS 
} from '@/lib/shared/constants'
import { DomainError } from '@/lib/core/errors/domain-errors'
import { IdempotencyGuard } from '@/lib/application/idempotency/idempotency-guard'
import { checkBookingLimits } from '@/lib/domain/slots/time-slots/booking-limits'
import { notificationService } from '@/lib/infrastructure/notifications/notification-service'
import { paymobService } from '@/lib/infrastructure/payments/providers'
import { bookingLogger } from '@/lib/shared/logger'
import type { 
  BookingCreateInput, 
  BookingCreateResult,
  PaymentInitInput,
  PaymentInitResult
} from '@/lib/domain/booking/types'

export class BookingOrchestrator {
  /**
   * 🎫 1. إنشاء حجز جديد
   */
  static async createBooking(input: BookingCreateInput): Promise<BookingCreateResult> {
    const startTime = Date.now()
    const requestId = `booking_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    bookingLogger.info('Creating booking', {
      requestId,
      userId: input.userId,
      slotId: input.slotId,
      fieldId: input.fieldId,
      idempotencyKey: input.idempotencyKey
    })

    try {
      // 🔐 Idempotency check
      if (input.idempotencyKey) {
        const check = await IdempotencyGuard.check(
          input.idempotencyKey,
          input.userId,
          'booking:create',
          { slotId: input.slotId, fieldId: input.fieldId }
        )

        if (!check.shouldProceed) {
          if (check.response) {
            bookingLogger.info('Idempotent response returned', { requestId })
            return check.response
          }
          throw new DomainError('BOOKING_IN_PROGRESS', 'جاري معالجة الطلب')
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. 🔐 تأكد أن Slot مقفولة للمستخدم
        const slot = await tx.slot.findUnique({
          where: {
            id: input.slotId,
            fieldId: input.fieldId,
            status: SLOT_STATUS.TEMP_LOCKED,
            lockedByUserId: input.userId,
            lockedUntil: { gt: new Date() }
          },
          include: { field: true }
        })

        if (!slot) {
          throw new DomainError('SLOT_NOT_FOUND', 'الموعد لم يعد متاحاً أو انتهى قفله')
        }

        // 2. 📏 تحقق من حدود الحجز
        await checkBookingLimits({
          userId: input.userId,
          slotDate: new Date(slot.startTime),
          slotDurationMin: slot.durationMinutes || 60
        })

        // 3. 🎫 إنشاء Booking
        const booking = await tx.booking.create({
          data: {
            userId: input.userId,
            fieldId: input.fieldId,
            slotId: input.slotId,
            status: BOOKING_STATUS.DRAFT,
            paymentStatus: PAYMENT_STATUS.PENDING,
            totalAmount: slot.price,
            expiresAt: addMinutes(new Date(), 10),
            idempotencyKey: input.idempotencyKey
          }
        })

        const result: BookingCreateResult = {
          bookingId: booking.id,
          needsConfirmation: !this.canBookDirectly(new Date(slot.startTime))
        }

        // 💾 حفظ للـ Idempotency
        if (input.idempotencyKey) {
          await IdempotencyGuard.saveResponse(
            input.idempotencyKey,
            input.userId,
            'booking:create',
            result,
            { slotId: input.slotId, fieldId: input.fieldId },
            60
          )
        }

        bookingLogger.info('Booking created successfully', {
          requestId,
          bookingId: booking.id,
          durationMs: Date.now() - startTime
        })

        return result
      })

      return result

    } catch (error: any) {
      bookingLogger.error('Booking creation failed', {
        requestId,
        error: error.message,
        userId: input.userId,
        durationMs: Date.now() - startTime
      })
      
      if (error instanceof DomainError) {
        throw error
      }
      throw new DomainError('INTERNAL_ERROR', 'فشل في إنشاء الحجز')
    }
  }

  /**
   * 💳 2. بدء عملية الدفع
   */
  static async initiatePayment(input: PaymentInitInput & { userId: string }): Promise<PaymentInitResult> {
    const startTime = Date.now()
    const requestId = `payment_init_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    bookingLogger.info('Initiating payment', {
      requestId,
      bookingId: input.bookingId,
      userId: input.userId,
      amount: input.amount
    })

    try {
      // 1. 🔍 البحث عن Booking
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: { 
          slot: true,
          field: true,
          user: true
        }
      })

      if (!booking) {
        throw new DomainError('BOOKING_NOT_FOUND')
      }

      // 2. 🔐 التحقق من الملكية
      if (booking.userId !== input.userId) {
        throw new DomainError('BOOKING_NOT_OWNED')
      }

      // 3. 🔐 التحقق من حالة الحجز
      if (booking.status !== BOOKING_STATUS.DRAFT) {
        throw new DomainError(
          'BOOKING_INVALID_STATE',
          `لا يمكن الدفع لحجز بحالة ${booking.status}`
        )
      }

      // 4. ⏰ التحقق من انتهاء الصلاحية
      if (booking.expiresAt && booking.expiresAt < new Date()) {
        throw new DomainError('BOOKING_EXPIRED')
      }

      // 5. 🔐 التحقق من أن Slot لا تزال مقفولة
      if (booking.slot.status !== SLOT_STATUS.TEMP_LOCKED) {
        throw new DomainError('SLOT_LOCK_EXPIRED')
      }

      // 6. 💳 التحقق من وجود دفع سابق ناجح
      const lastPayment = await prisma.payment.findFirst({
        where: { bookingId: input.bookingId },
        orderBy: { createdAt: 'desc' }
      })

      if (lastPayment?.status === PAYMENT_STATUS.PAID) {
        throw new DomainError('PAYMENT_ALREADY_PROCESSED')
      }

      // 7. 🔐 Idempotency للدفع
      const idempotencyKey = input.idempotencyKey || IdempotencyGuard.generateKey('payment')
      
      const check = await IdempotencyGuard.check(
        idempotencyKey,
        input.userId,
        'payment:initiate',
        { bookingId: input.bookingId, amount: input.amount }
      )

      if (!check.shouldProceed) {
        if (check.response) {
          bookingLogger.info('Idempotent payment response', { requestId })
          return check.response
        }
        throw new DomainError('BOOKING_IN_PROGRESS')
      }

      const result = await prisma.$transaction(async (tx) => {
        // 8. 📦 إنشاء Order في Paymob
        let orderId: string
        let paymentToken: string

        if (paymobService.isMockMode()) {
          const mockOrder = await paymobService.createMockOrder({
            amount: input.amount,
            currency: input.currency || 'EGP',
            bookingId: input.bookingId
          })
          orderId = mockOrder.id.toString()
          paymentToken = await paymobService.getMockPaymentKey({ orderId: mockOrder.id })
        } else {
          const order = await paymobService.createOrder({
            amount: input.amount,
            currency: input.currency || 'EGP',
            bookingId: input.bookingId,
            userId: input.userId
          })
          orderId = order.id.toString()
          
          // الحصول على بيانات الفواتير
          const billingData = {
            apartment: "NA",
            email: booking.user.email,
            floor: "NA",
            first_name: booking.user.name?.split(' ')[0] || "عميل",
            street: "NA",
            building: "NA",
            phone_number: booking.user.phone || "01000000000",
            shipping_method: "NA",
            postal_code: "NA",
            city: "NA",
            country: "NA",
            last_name: booking.user.name?.split(' ').slice(1).join(' ') || "مستخدم",
            state: "NA"
          }

          paymentToken = await paymobService.getPaymentKey({
            orderId: order.id,
            amount: input.amount,
            billingData,
            bookingId: input.bookingId
          })
        }

        // 9. 💳 إنشاء Payment
        const payment = await tx.payment.create({
          data: {
            bookingId: input.bookingId,
            amount: input.amount,
            currency: input.currency || 'EGP',
            paymentId: `pay_${orderId}`,
            orderId: orderId,
            status: PAYMENT_STATUS.PROCESSING
          }
        })

        // 10. 🔄 تحديث Booking
        await tx.booking.update({
          where: { id: input.bookingId },
          data: {
            status: BOOKING_STATUS.PENDING_PAYMENT,
            paymentStatus: PAYMENT_STATUS.PROCESSING,
            paymentId: payment.id,
            orderId: orderId
          }
        })

        const result: PaymentInitResult = {
          paymentUrl: paymobService.isMockMode() 
            ? `/payment/mock/${orderId}` 
            : `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`,
          orderId,
          idempotencyKey
        }

        // 💾 حفظ للـ Idempotency
        await IdempotencyGuard.saveResponse(
          idempotencyKey,
          input.userId,
          'payment:initiate',
          result,
          { bookingId: input.bookingId, amount: input.amount },
          30
        )

        bookingLogger.info('Payment initiated successfully', {
          requestId,
          orderId,
          paymentId: payment.id,
          durationMs: Date.now() - startTime
        })

        return result
      })

      return result

    } catch (error: any) {
      bookingLogger.error('Payment initiation failed', {
        requestId,
        error: error.message,
        bookingId: input.bookingId,
        durationMs: Date.now() - startTime
      })
      
      if (error instanceof DomainError) {
        throw error
      }
      throw new DomainError('INTERNAL_ERROR', 'فشل في بدء عملية الدفع')
    }
  }

  /**
   * ✅ 3. إكمال الحجز بعد الدفع
   */
  static async completeBooking(params: {
    bookingId: string
    success: boolean
    paymentDetails: {
      transactionId: string
      orderId: string
      amount: number
      currency: string
    }
  }) {
    const startTime = Date.now()
    const requestId = `complete_booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    bookingLogger.info('Completing booking', {
      requestId,
      bookingId: params.bookingId,
      success: params.success,
      orderId: params.paymentDetails.orderId
    })

    let booking: any

    try {
      // Transaction للعمليات الحرجة
      await prisma.$transaction(async (tx) => {
        booking = await tx.booking.findUnique({
          where: { id: params.bookingId },
          include: { 
            slot: true, 
            field: true, 
            user: true 
          }
        })

        if (!booking) {
          throw new DomainError('BOOKING_NOT_FOUND')
        }

        // التحقق من أن orderId لم يستخدم من قبل لنفس الحجز
        const existingPayment = await tx.payment.findUnique({
          where: { orderId: params.paymentDetails.orderId }
        })

        if (existingPayment) {
          if (existingPayment.status === PAYMENT_STATUS.PAID) {
            throw new DomainError('PAYMENT_ALREADY_PROCESSED')
          }
          
          if (existingPayment.bookingId !== params.bookingId) {
            throw new DomainError('DUPLICATE_PAYMENT', 'تم استخدام orderId في حجز آخر')
          }
        }

        if (params.success) {
          // ✅ نجاح الدفع
          await tx.booking.update({
            where: { id: params.bookingId },
            data: {
              status: BOOKING_STATUS.CONFIRMED,
              paymentStatus: PAYMENT_STATUS.PAID
            }
          })

          await tx.slot.update({
            where: { id: booking.slotId },
            data: {
              status: SLOT_STATUS.BOOKED,
              lockedByUserId: null,
              lockedUntil: null
            }
          })

          await tx.payment.updateMany({
            where: { bookingId: params.bookingId },
            data: {
              status: PAYMENT_STATUS.PAID,
              paymentId: params.paymentDetails.transactionId,
              metadata: params.paymentDetails
            }
          })

          bookingLogger.info('Payment succeeded', {
            requestId,
            bookingId: params.bookingId,
            transactionId: params.paymentDetails.transactionId
          })

        } else {
          // ❌ فشل الدفع
          await tx.booking.update({
            where: { id: params.bookingId },
            data: {
              status: BOOKING_STATUS.FAILED,
              paymentStatus: PAYMENT_STATUS.FAILED
            }
          })

          await tx.slot.update({
            where: { id: booking.slotId },
            data: { 
              status: SLOT_STATUS.AVAILABLE,
              lockedByUserId: null,
              lockedUntil: null
            }
          })

          await tx.payment.updateMany({
            where: { bookingId: params.bookingId },
            data: {
              status: PAYMENT_STATUS.FAILED,
              metadata: params.paymentDetails
            }
          })

          bookingLogger.warn('Payment failed', {
            requestId,
            bookingId: params.bookingId
          })
        }
      })

      // ✅ إرسال Notifications خارج Transaction
      await this.sendPostTransactionNotifications(booking, params.success, params.paymentDetails)

      bookingLogger.info('Booking completed successfully', {
        requestId,
        bookingId: params.bookingId,
        durationMs: Date.now() - startTime
      })

      return { success: true }

    } catch (error: any) {
      bookingLogger.error('Booking completion failed', {
        requestId,
        error: error.message,
        bookingId: params.bookingId,
        durationMs: Date.now() - startTime
      })
      
      if (error instanceof DomainError) {
        throw error
      }
      throw new DomainError('INTERNAL_ERROR', 'فشل في إكمال الحجز')
    }
  }

  /**
   * 🧹 4. تنظيف الحجوزات المنتهية
   */
  static async cleanupExpiredBookings() {
    const startTime = Date.now()
    const jobId = `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    bookingLogger.info('Starting expired bookings cleanup', { jobId })

    try {
      const now = new Date()
      
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: BOOKING_STATUS.DRAFT,
          expiresAt: { lt: now }
        },
        include: { slot: true }
      })

      bookingLogger.info(`Found ${expiredBookings.length} expired bookings`, { jobId })

      let cleaned = 0

      for (const booking of expiredBookings) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.booking.update({
              where: { id: booking.id },
              data: {
                status: BOOKING_STATUS.EXPIRED,
                paymentStatus: PAYMENT_STATUS.FAILED
              }
            })

            await tx.slot.update({
              where: { id: booking.slotId },
              data: { 
                status: SLOT_STATUS.AVAILABLE,
                lockedByUserId: null,
                lockedUntil: null
              }
            })

            cleaned++
          })

          // إشعار المستخدم
          await notificationService.send({
            userId: booking.userId,
            type: 'BOOKING_EXPIRED',
            title: 'انتهت صلاحية الحجز',
            message: 'انتهت صلاحية حجزك، يرجى المحاولة مرة أخرى',
            relatedId: booking.id
          })

        } catch (error: any) {
          bookingLogger.error(`Failed to clean up booking ${booking.id}`, {
            jobId,
            error: error.message
          })
        }
      }

      bookingLogger.info('Cleanup completed', {
        jobId,
        cleaned,
        durationMs: Date.now() - startTime
      })

      return { success: true, cleaned }

    } catch (error: any) {
      bookingLogger.error('Cleanup job failed', {
        jobId,
        error: error.message,
        durationMs: Date.now() - startTime
      })
      
      return { success: false, error: error.message }
    }
  }

  /**
   * 🔓 5. تنظيف السلات المقفولة المنتهية
   */
  static async cleanupExpiredLocks() {
    const startTime = Date.now()
    const jobId = `unlock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    bookingLogger.info('Starting expired locks cleanup', { jobId })

    try {
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

      bookingLogger.info('Locks cleanup completed', {
        jobId,
        unlockedSlots: result.count,
        durationMs: Date.now() - startTime
      })

      return { success: true, unlockedSlots: result.count }

    } catch (error: any) {
      bookingLogger.error('Locks cleanup failed', {
        jobId,
        error: error.message,
        durationMs: Date.now() - startTime
      })
      
      return { success: false, error: error.message }
    }
  }

  /**
   * 🔒 Private helpers
   */

  private static async sendPostTransactionNotifications(
    booking: any,
    success: boolean,
    paymentDetails: any
  ): Promise<void> {
    try {
      if (success) {
        await notificationService.send({
          userId: booking.userId,
          type: 'PAYMENT_SUCCESS',
          title: 'تم الدفع بنجاح',
          message: `تم تأكيد حجزك في ${booking.field.name} بتاريخ ${new Date(booking.slot.startTime).toLocaleDateString('ar-EG')}`,
          relatedId: booking.id,
          data: {
            amount: paymentDetails.amount,
            fieldName: booking.field.name,
            date: booking.slot.startTime
          }
        })
      } else {
        await notificationService.send({
          userId: booking.userId,
          type: 'PAYMENT_FAILED',
          title: 'فشل الدفع',
          message: 'فشلت عملية الدفع، يرجى المحاولة مرة أخرى',
          relatedId: booking.id
        })
      }
    } catch (error: any) {
      bookingLogger.error('Failed to send notifications', {
        error: error.message,
        bookingId: booking.id
      })
      // لا ترمي error - notifications فشلت لكن العملية نجحت
    }
  }

  private static canBookDirectly(start: Date): boolean {
    const diffMs = start.getTime() - Date.now()
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffHours >= 24
  }
}

export const bookingOrchestrator = new BookingOrchestrator()