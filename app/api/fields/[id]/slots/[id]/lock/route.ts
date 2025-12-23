import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { SLOT_STATUS } from '@/lib/constants'
import { addMinutes } from 'date-fns'

const LOCK_DURATION_MINUTES = 5

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const slotId = params.id
    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId }
      })

      if (!slot) {
        throw new Error('Slot not found')
      }

      // slot already booked
      if (
        slot.status === SLOT_STATUS.BOOKED ||
        slot.status === SLOT_STATUS.PENDING_CONFIRMATION
      ) {
        throw new Error('Slot already booked')
      }

      // slot locked but not expired
      if (
        slot.status === SLOT_STATUS.TEMP_LOCKED &&
        slot.lockedUntil &&
        slot.lockedUntil > now
      ) {
        throw new Error('Slot temporarily locked')
      }

      // lock it
      await tx.slot.update({
        where: { id: slotId },
        data: {
          status: SLOT_STATUS.TEMP_LOCKED,
          lockedUntil: addMinutes(now, LOCK_DURATION_MINUTES)
        }
      })

      return { success: true }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في قفل الموعد' },
      { status: 400 }
    )
  }
}
