// app/api/fields/[fieldId]/slots/[slotId]/lock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth/auth'
import { SLOT_STATUS } from '@/lib/constants'
import { addMinutes } from 'date-fns'

const LOCK_DURATION_MINUTES = 5

export async function POST(
  _req: NextRequest,
  {
    params
  }: {
    params: { fieldId: string; slotId: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)

    const userId = (session as any)?.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const { slotId, fieldId } = params
    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId }
      })

      if (!slot || slot.fieldId !== fieldId) {
        throw new Error('Slot غير موجود')
      }

      // 🚫 محجوز نهائي
      if (
        slot.status === SLOT_STATUS.BOOKED ||
        slot.status === SLOT_STATUS.NEED_CONFIRMATION // ✅ تعديل هنا
      ) {
        throw new Error('الساعة محجوزة بالفعل')
      }

      // 🔒 مقفولة ولسه صالحة
      if (
        slot.status === SLOT_STATUS.TEMP_LOCKED &&
        slot.lockedUntil &&
        slot.lockedUntil > now
      ) {
        // نفس المستخدم → نمدّ الـ lock
        if (slot.lockedByUserId === userId) {
          await tx.slot.update({
            where: { id: slotId },
            data: {
              lockedUntil: addMinutes(now, LOCK_DURATION_MINUTES)
            }
          })

          return { success: true, extended: true }
        }

        // مستخدم تاني
        throw new Error('الساعة مقفولة مؤقتًا')
      }

      // ⏱️ lock منتهي أو AVAILABLE
      await tx.slot.update({
        where: { id: slotId },
        data: {
          status: SLOT_STATUS.TEMP_LOCKED,
          lockedUntil: addMinutes(now, LOCK_DURATION_MINUTES),
          lockedByUserId: userId
        }
      })

      return { success: true, locked: true }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في قفل الساعة' },
      { status: 400 }
    )
  }
}
