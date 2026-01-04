// lib/domain/slots/read-model.ts
import { SLOT_STATUS } from '@/lib/shared/constants'  // ✅ المسار الجديد
import { DomainError } from '@/lib/core/errors/domain-errors'  // ✅ المسار الجديد

export type UISlotView = {
  id: string
  startTime: Date
  endTime: Date
  uiStatus: 'AVAILABLE' | 'LOCKED_ME' | 'LOCKED_OTHER' | 'BOOKED'
  originalStatus: string
  price: number
  deposit: number
  metadata?: {
    needsConfirmation?: boolean
    lockedUntil?: Date
    lockedByUserId?: string
  }
}

export class SlotReadModel {
  static toUISlot(dbSlot: any, currentUserId?: string | null): UISlotView {
    const now = new Date()
    const startTime = new Date(dbSlot.startTime)
    
    const dbStatus = this.normalizeDbStatus(dbSlot.status)
    
    let uiStatus: UISlotView['uiStatus']
    let needsConfirmation = false

    switch (dbStatus) {
      case SLOT_STATUS.BOOKED:
        uiStatus = 'BOOKED'
        break

      case SLOT_STATUS.TEMP_LOCKED:
        if (dbSlot.lockedByUserId === currentUserId) {
          uiStatus = 'LOCKED_ME'
        } else {
          uiStatus = 'LOCKED_OTHER'
        }
        break

      case SLOT_STATUS.AVAILABLE:
        uiStatus = 'AVAILABLE'
        const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        if (diffHours < 24) {
          needsConfirmation = true
        }
        break

      default:
        throw new DomainError(
          'SLOT_NOT_FOUND', 
          `حالة غير قابلة للعرض: ${dbSlot.status}`
        )
    }

    return {
      id: dbSlot.id,
      startTime,
      endTime: new Date(dbSlot.endTime),
      uiStatus,
      originalStatus: dbSlot.status,
      price: dbSlot.price,
      deposit: dbSlot.deposit,
      metadata: {
        needsConfirmation,
        lockedUntil: dbSlot.lockedUntil ? new Date(dbSlot.lockedUntil) : undefined,
        lockedByUserId: dbSlot.lockedByUserId
      }
    }
  }
  
  private static normalizeDbStatus(dbStatus: string): string {
    switch (dbStatus) {
      case SLOT_STATUS.AVAILABLE:
      case 'AVAILABLE_NEEDS_CONFIRM':
      case 'PENDING_CONFIRMATION':
        return SLOT_STATUS.AVAILABLE
      case SLOT_STATUS.TEMP_LOCKED:
        return SLOT_STATUS.TEMP_LOCKED
      case SLOT_STATUS.BOOKED:
        return SLOT_STATUS.BOOKED
      case SLOT_STATUS.UNAVAILABLE:
        return SLOT_STATUS.UNAVAILABLE
      default:
        return SLOT_STATUS.UNAVAILABLE
    }
  }

  static filterVisibleSlots(dbSlots: any[], currentUserId?: string | null): UISlotView[] {
    return dbSlots
      .map(slot => this.toUISlot(slot, currentUserId))
      .filter(slot => ['AVAILABLE', 'LOCKED_ME', 'LOCKED_OTHER', 'BOOKED'].includes(slot.uiStatus))
  }

  static async getAvailableSlots(fieldId: string, date: Date, userId?: string): Promise<UISlotView[]> {
    const { prisma } = await import('@/lib/infrastructure/database/prisma')  // ✅ استيراد ديناميكي
    
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const dbSlots = await prisma.slot.findMany({
      where: {
        fieldId,
        startTime: {
          gte: dayStart,
          lt: dayEnd
        }
      },
      include: {
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] }
          }
        }
      }
    })

    const availableSlots = dbSlots.filter(slot => {
      // استبعاد السلات المحجوزة
      const hasActiveBooking = slot.bookings.length > 0
      if (hasActiveBooking) return false
      
      // استبعاد السلات غير المتاحة
      if (slot.status === SLOT_STATUS.UNAVAILABLE) return false
      
      // السماح بالسلات المتاحة أو المقفولة بواسطة المستخدم
      if (slot.status === SLOT_STATUS.TEMP_LOCKED && slot.lockedByUserId !== userId) {
        return false
      }
      
      return true
    })

    return this.filterVisibleSlots(availableSlots, userId)
  }
}

export function getUISlots(slots: any[], userId?: string): UISlotView[] {
  return SlotReadModel.filterVisibleSlots(slots, userId)
}