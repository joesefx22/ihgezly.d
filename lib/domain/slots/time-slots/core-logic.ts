// lib/domain/slots/time-slots/core-logic.ts
import { addMinutes, startOfDay, addDays } from 'date-fns'
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { SLOT_STATUS, FIELD_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد

const CONFIRMATION_WINDOW_HOURS = 24
const LOCK_DURATION_MINUTES = 5

export interface Day {
  date: Date
  label: string
  weekday: string
  dayNumber: string
  monthName: string
  isToday: boolean
  isTomorrow: boolean
}

function normalizeToMinute(date: Date): number {
  return Math.floor(date.getTime() / 60000) * 60000
}

export function canBookDirectly(start: Date): boolean {
  const diffMs = start.getTime() - Date.now()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours >= CONFIRMATION_WINDOW_HOURS
}

function normalizeDbStatus(status: string | null | undefined): string {
  if (!status) return SLOT_STATUS.AVAILABLE
  switch (status) {
    case SLOT_STATUS.AVAILABLE:
    case SLOT_STATUS.TEMP_LOCKED:
    case SLOT_STATUS.BOOKED:
    case SLOT_STATUS.UNAVAILABLE:
      return status
    case 'AVAILABLE_NEEDS_CONFIRM':
    case 'PENDING_CONFIRMATION':
      return SLOT_STATUS.AVAILABLE
    default:
      return SLOT_STATUS.UNAVAILABLE
  }
}

function resolveSlotStatus({
  field,
  slotStart,
  dbSlot,
  now
}: {
  field: any
  slotStart: Date
  dbSlot?: any
  now: Date
}): string | null {
  const diffMs = slotStart.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 0) return null

  if (field.status !== FIELD_STATUS.OPEN && !dbSlot) {
    return SLOT_STATUS.UNAVAILABLE
  }

  if (dbSlot) {
    const dbStatus = normalizeDbStatus(dbSlot.status)

    if (
      dbStatus === SLOT_STATUS.TEMP_LOCKED &&
      dbSlot.lockedUntil &&
      new Date(dbSlot.lockedUntil) > now
    ) {
      return SLOT_STATUS.TEMP_LOCKED
    }

    if (dbStatus === SLOT_STATUS.BOOKED) {
      return SLOT_STATUS.BOOKED
    }

    if (dbStatus === SLOT_STATUS.UNAVAILABLE) {
      return SLOT_STATUS.UNAVAILABLE
    }
  }

  return SLOT_STATUS.AVAILABLE
}

export async function generateSlotsForDay({
  fieldId,
  date,
  now
}: {
  fieldId: string
  date: Date
  now: Date
}) {
  const field = await prisma.field.findUnique({
    where: { id: fieldId }
  })

  if (!field) {
    throw new DomainError('FIELD_NOT_FOUND')
  }

  const dayStart = startOfDay(date)
  const dayEnd = addDays(dayStart, 1)

  const existingSlots = await prisma.slot.findMany({
    where: {
      fieldId,
      startTime: {
        gte: dayStart,
        lt: dayEnd
      }
    }
  })

  const slotsMap = new Map<number, any>(
    existingSlots.map(slot => [
      normalizeToMinute(new Date(slot.startTime)),
      slot
    ])
  )

  const [openH, openM] = field.openingTime.split(':').map(Number)
  const [closeH, closeM] = field.closingTime.split(':').map(Number)

  let current = startOfDay(date)
  current.setHours(openH, openM, 0, 0)

  const end = startOfDay(date)
  end.setHours(closeH, closeM, 0, 0)

  const slots: any[] = []

  while (addMinutes(current, field.slotDurationMin) <= end) {
    const slotStart = new Date(current)
    const slotEnd = addMinutes(slotStart, field.slotDurationMin)

    const key = normalizeToMinute(slotStart)
    const dbSlot = slotsMap.get(key)

    const status = resolveSlotStatus({
      field,
      slotStart,
      dbSlot,
      now
    })

    if (status) {
      slots.push({
        id: dbSlot?.id ?? `${fieldId}-${slotStart.toISOString()}`,
        fieldId,
        startTime: slotStart,
        endTime: slotEnd,
        status,
        price: field.pricePerHour,
        deposit: field.depositPrice
      })
    }

    current = slotEnd
  }

  return slots
}

export async function generateSlotsForRange({
  fieldId,
  startDate,
  endDate,
  now
}: {
  fieldId: string
  startDate: Date
  endDate: Date
  now: Date
}) {
  const allSlots: any[] = []
  let currentDate = startOfDay(startDate)

  while (currentDate <= endDate) {
    const daySlots = await generateSlotsForDay({
      fieldId,
      date: currentDate,
      now
    })

    allSlots.push(...daySlots)
    currentDate = addDays(currentDate, 1)
  }

  return allSlots
}

export async function lockSlot({
  slotId,
  userId
}: {
  slotId: string
  userId: string
}) {
  const now = new Date()

  return prisma.$transaction(async tx => {
    const slot = await tx.slot.findUnique({
      where: { id: slotId }
    })

    if (!slot) {
      throw new DomainError('SLOT_NOT_FOUND')
    }

    const status = normalizeDbStatus(slot.status)
    const canLock = status === SLOT_STATUS.AVAILABLE

    if (!canLock) {
      throw new DomainError('SLOT_UNAVAILABLE')
    }

    await tx.slot.update({
      where: { id: slotId },
      data: {
        status: SLOT_STATUS.TEMP_LOCKED,
        lockedUntil: addMinutes(now, LOCK_DURATION_MINUTES),
        lockedByUserId: userId
      }
    })

    return { success: true }
  })
}

export function generateNextDays(count: number = 10): Day[] {
  const days: Day[] = []
  const today = startOfDay(new Date())

  for (let i = 0; i < count; i++) {
    const date = addDays(today, i)

    const weekday = date.toLocaleDateString('ar-EG', { weekday: 'long' })
    const dayNumber = date.toLocaleDateString('ar-EG', { day: 'numeric' })
    const monthName = date.toLocaleDateString('ar-EG', { month: 'long' })

    days.push({
      date,
      label: `${weekday}، ${dayNumber} ${monthName}`,
      weekday,
      dayNumber,
      monthName,
      isToday: i === 0,
      isTomorrow: i === 1
    })
  }

  return days
}

export function generateNextTenDays(): Day[] {
  return generateNextDays(10)
}