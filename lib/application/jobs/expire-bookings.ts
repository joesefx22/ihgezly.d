// lib/application/jobs/expire-bookings.ts
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { 
  BOOKING_STATUS, 
  PAYMENT_STATUS,
  SLOT_STATUS 
} from '@/lib/shared/constants'  // ✅ المسار الجديد
import { bookingLogger } from '@/lib/shared/logger'  // ✅ استبدال console.log
export async function expireBookingsJob() {
  console.log('🚀 Starting expire bookings job...')
  
  const now = new Date()
  let expiredCount = 0
  let unlockedSlots = 0

  try {
    // 1. Find expired DRAFT bookings
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: BOOKING_STATUS.DRAFT,
        expiresAt: { lt: now }
      },
      include: {
        slot: true
      }
    })

    console.log(`📊 Found ${expiredBookings.length} expired bookings`)

    // 2. Process each booking
    for (const booking of expiredBookings) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update booking
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BOOKING_STATUS.EXPIRED,
              paymentStatus: PAYMENT_STATUS.FAILED
            }
          })

          // Unlock slot
          await tx.slot.update({
            where: { id: booking.slotId },
            data: {
              status: 'AVAILABLE',
              lockedByUserId: null,
              lockedUntil: null
            }
          })

          // Create notification
          await tx.notification.create({
            data: {
              userId: booking.userId,
              type: 'BOOKING_EXPIRED',
              title: 'انتهت صلاحية الحجز',
              message: 'انتهت صلاحية حجزك، يرجى المحاولة مرة أخرى',
              relatedId: booking.id
            }
          })

          expiredCount++
          unlockedSlots++
        })
      } catch (error) {
        console.error(`❌ Error processing booking ${booking.id}:`, error)
      }
    }

    // 3. Cleanup old expired bookings (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const deleted = await prisma.booking.deleteMany({
      where: {
        status: BOOKING_STATUS.EXPIRED,
        updatedAt: { lt: sevenDaysAgo }
      }
    })

    console.log(`🗑️ Deleted ${deleted.count} old expired bookings`)

    return {
      success: true,
      stats: {
        expiredBookings: expiredCount,
        unlockedSlots,
        deletedOld: deleted.count,
        timestamp: now.toISOString()
      }
    }

  } catch (error) {
    console.error('❌ Error in expire bookings job:', error)
    throw error
  }
}

// For cron/API usage
export async function runExpireBookingsJob() {
  try {
    const result = await expireBookingsJob()
    console.log('✅ Expire bookings job completed:', result)
    return result
  } catch (error) {
    console.error('❌ Expire bookings job failed:', error)
    return { success: false, error: error.message }
  }
}
// في السطر الذي يحدث فيه الـ slot status:
await tx.slot.update({
  where: { id: booking.slotId },
  data: {
    status: SLOT_STATUS.AVAILABLE, // ✅ استخدام الثابت
    lockedByUserId: null,
    lockedUntil: null
  }
})
// في lib/jobs/expire-bookings.ts
// ❌ الخطأ
await tx.slot.update({
  where: { id: booking.slotId },
  data: { status: 'AVAILABLE' } // ❌ خطأ
})

// ✅ الصحيح
await tx.slot.update({
  where: { id: booking.slotId },
  data: { status: SLOT_STATUS.AVAILABLE } // ✅
})