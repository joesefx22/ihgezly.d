// lib/domain/slots/time-slots/booking-limits.ts
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { startOfDay, addDays } from 'date-fns'
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد
import { BOOKING_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد

export async function checkBookingLimits({
  userId,
  slotDate,
  slotDurationMin
}: {
  userId: string
  slotDate: Date
  slotDurationMin: number
}) {
  const dayStart = startOfDay(slotDate)
  const dayEnd = addDays(dayStart, 1)
  
  const dayOfWeek = dayStart.getDay()
  const weekStart = addDays(dayStart, -dayOfWeek)
  const weekEnd = addDays(weekStart, 7)

  const dailyBookings = await prisma.booking.findMany({
    where: {
      userId,
      status: { 
        in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING_PAYMENT] 
      },
      slot: {
        startTime: { gte: dayStart, lt: dayEnd }
      }
    },
    include: {
      slot: {
        select: {
          startTime: true,
          endTime: true,
          durationMinutes: true
        }
      }
    }
  })

  const dailyMinutes = dailyBookings.reduce((sum, booking) => {
    if (booking.slot.durationMinutes) {
      return sum + booking.slot.durationMinutes
    }
    
    const start = new Date(booking.slot.startTime)
    const end = new Date(booking.slot.endTime)
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    return sum + diffMinutes
  }, 0)

  if (dailyMinutes + slotDurationMin > 120) {
    throw new DomainError('BOOKING_LIMIT_EXCEEDED', 'وصلت للحد الأقصى اليومي (ساعتين)')
  }

  const weeklyBookings = await prisma.booking.findMany({
    where: {
      userId,
      status: { 
        in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING_PAYMENT] 
      },
      slot: {
        startTime: { gte: weekStart, lt: weekEnd }
      }
    },
    include: {
      slot: {
        select: {
          startTime: true,
          endTime: true,
          durationMinutes: true
        }
      }
    }
  })

  const weeklyMinutes = weeklyBookings.reduce((sum, booking) => {
    if (booking.slot.durationMinutes) {
      return sum + booking.slot.durationMinutes
    }
    
    const start = new Date(booking.slot.startTime)
    const end = new Date(booking.slot.endTime)
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    return sum + diffMinutes
  }, 0)

  if (weeklyMinutes + slotDurationMin > 240) {
    throw new DomainError('BOOKING_LIMIT_EXCEEDED', 'وصلت للحد الأقصى الأسبوعي (4 ساعات)')
  }

  return true
}