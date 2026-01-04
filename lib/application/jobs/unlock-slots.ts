// lib/application/jobs/unlock-slots.ts
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { SLOT_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { bookingLogger } from '@/lib/shared/logger'  // ✅ استبدال console.log
export async function unlockSlotsJob() {
  console.log('🔓 Starting unlock slots job...')
  
  const now = new Date()
  let unlockedCount = 0

  try {
    // 1. Find expired TEMP_LOCKED slots
    const expiredSlots = await prisma.slot.findMany({
      where: {
        status: SLOT_STATUS.TEMP_LOCKED,
        lockedUntil: { lt: now }
      },
      include: {
        lockedByUser: {
          select: { id: true, email: true }
        }
      }
    })

    console.log(`📊 Found ${expiredSlots.length} expired locked slots`)

    // 2. Unlock them
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

    unlockedCount = result.count

    // 3. Log details
    if (expiredSlots.length > 0) {
      console.log('📝 Expired slots details:')
      expiredSlots.forEach(slot => {
        console.log(`   Slot ${slot.id} - User: ${slot.lockedByUser?.email || 'unknown'}`)
      })
    }

    // 4. Also check for orphaned locks (no booking)
    const orphanedSlots = await prisma.slot.findMany({
      where: {
        status: SLOT_STATUS.TEMP_LOCKED,
        bookings: {
          none: {
            status: { in: ['DRAFT', 'PENDING_PAYMENT'] }
          }
        }
      }
    })

    if (orphanedSlots.length > 0) {
      console.log(`⚠️ Found ${orphanedSlots.length} orphaned locked slots`)
      
      await prisma.slot.updateMany({
        where: {
          id: { in: orphanedSlots.map(s => s.id) }
        },
        data: {
          status: SLOT_STATUS.AVAILABLE,
          lockedByUserId: null,
          lockedUntil: null
        }
      })

      unlockedCount += orphanedSlots.length
    }

    return {
      success: true,
      stats: {
        unlockedSlots: unlockedCount,
        orphanedSlots: orphanedSlots.length,
        timestamp: now.toISOString()
      }
    }

  } catch (error) {
    console.error('❌ Error in unlock slots job:', error)
    throw error
  }
}

// For cron/API usage
export async function runUnlockSlotsJob() {
  try {
    const result = await unlockSlotsJob()
    console.log('✅ Unlock slots job completed:', result)
    return result
  } catch (error) {
    console.error('❌ Unlock slots job failed:', error)
    return { success: false, error: error.message }
  }
}
// في السطر الذي يحدث فيه الـ slot status:
const result = await prisma.slot.updateMany({
  where: {
    status: SLOT_STATUS.TEMP_LOCKED, // ✅ استخدام الثابت
    lockedUntil: { lt: now }
  },
  data: {
    status: SLOT_STATUS.AVAILABLE, // ✅ استخدام الثابت
    lockedByUserId: null,
    lockedUntil: null
  }
})