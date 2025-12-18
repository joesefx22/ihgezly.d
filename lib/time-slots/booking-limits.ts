// lib/time-slots/booking-limits.ts
import { prisma } from '@/lib/prisma'
import { startOfDay, addDays } from 'date-fns'

export async function checkBookingLimits({
  userId,
  slotDate
}: {
  userId: string
  slotDate: Date
}) {
  const dayStart = startOfDay(slotDate)
  const dayEnd = addDays(dayStart, 1)
  
  const weekStart = addDays(dayStart, -dayStart.getDay())
  const weekEnd = addDays(weekStart, 7)

  // الحجوزات اليومية
  const dailyBookings = await prisma.booking.count({
    where: {
      userId,
      slot: {
        startTime: {
          gte: dayStart,
          lt: dayEnd
        }
      },
      status: {
        in: ['CONFIRMED', 'PENDING_CONFIRMATION']
      }
    }
  })

  if (dailyBookings >= 2) {
    throw new Error('وصلت للحد الأقصى للحجز اليومي (2 ساعة)')
  }

  // الحجوزات الأسبوعية
  const weeklyBookings = await prisma.booking.count({
    where: {
      userId,
      slot: {
        startTime: {
          gte: weekStart,
          lt: weekEnd
        }
      },
      status: {
        in: ['CONFIRMED', 'PENDING_CONFIRMATION']
      }
    }
  })

  if (weeklyBookings >= 4) {
    throw new Error('وصلت للحد الأقصى للحجز الأسبوعي (4 ساعة)')
  }

  return true
}
