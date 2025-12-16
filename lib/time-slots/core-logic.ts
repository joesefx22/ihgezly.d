import {
  addMinutes,
  startOfDay,
  addDays
} from 'date-fns'
import { prisma } from '@/lib/prisma'

// ================================
// CONSTANTS
// ================================

export const SLOT_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  AVAILABLE_NEEDS_CONFIRM: 'AVAILABLE_NEEDS_CONFIRM',
  TEMP_LOCKED: 'TEMP_LOCKED',
  BOOKED: 'BOOKED',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  UNAVAILABLE: 'UNAVAILABLE'
})

const CONFIRMATION_WINDOW_HOURS = 24
const LOCK_DURATION_MINUTES = 5

// ================================
// HELPERS
// ================================

// Normalize to minute to avoid ms bugs
function normalizeToMinute(date: Date): number {
  return Math.floor(date.getTime() / 60000) * 60000
}

// ================================
// STATUS RESOLVER
// ================================

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

  // Past slot
  if (diffHours < 0) return null

  // Field closed (but keep existing bookings visible)
  if (field.status !== 'OPEN' && !dbSlot) {
    return SLOT_STATUS.UNAVAILABLE
  }

  if (dbSlot) {
    if (
      dbSlot.status === SLOT_STATUS.TEMP_LOCKED &&
      dbSlot.lockedUntil &&
      new Date(dbSlot.lockedUntil) > now
    ) {
      return SLOT_STATUS.TEMP_LOCKED
    }

    if (dbSlot.status === SLOT_STATUS.BOOKED) {
      return SLOT_STATUS.BOOKED
    }

    if (dbSlot.status === SLOT_STATUS.PENDING_CONFIRMATION) {
      return SLOT_STATUS.PENDING_CONFIRMATION
    }
  }

  // Time-based rule
  if (diffHours < CONFIRMATION_WINDOW_HOURS) {
    return SLOT_STATUS.AVAILABLE_NEEDS_CONFIRM
  }

  return SLOT_STATUS.AVAILABLE
}

// ================================
// GENERATE SLOTS FOR SINGLE DAY
// ================================

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
    throw new Error('Field not found')
  }

  // Fetch all slots for that day in one query
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
  current.setUTCHours(openH, openM, 0, 0)

  const end = startOfDay(date)
  end.setUTCHours(closeH, closeM, 0, 0)

  const slots: any[] = []

  while (addMinutes(current, field.slotDuration) <= end) {
    const slotStart = new Date(current)
    const slotEnd = addMinutes(slotStart, field.slotDuration)

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

// ================================
// GENERATE SLOTS FOR DATE RANGE
// ================================

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

// ================================
// LOCK SLOT (RACE CONDITION SAFE)
// ================================

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

    if (
      !slot ||
      ![
        SLOT_STATUS.AVAILABLE,
        SLOT_STATUS.AVAILABLE_NEEDS_CONFIRM
      ].includes(slot.status)
    ) {
      throw new Error('Slot not available')
    }

    await tx.slot.update({
      where: { id: slotId },
      data: {
        status: SLOT_STATUS.TEMP_LOCKED,
        lockedUntil: addMinutes(now, LOCK_DURATION_MINUTES)
      }
    })

    return { success: true }
  })
}
