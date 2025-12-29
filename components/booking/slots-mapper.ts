// components/booking/slots-mapper.ts
export interface ApiSlot {
  id: string
  startTime: string
  endTime: string
  status: string
  price: number
  deposit: number
}

export interface UISlot {
  id: string
  startTime: Date
  endTime: Date
  status: 'AVAILABLE' | 'AVAILABLE_NEEDS_CONFIRM' | 'BOOKED' | 'TEMP_LOCKED'
  needsConfirmation: boolean
  price: number
  deposit: number
}

export function mapApiSlotsToUI(slots: ApiSlot[]): UISlot[] {
  return slots.map(slot => {
    const needsConfirmation =
      slot.status === 'AVAILABLE_NEEDS_CONFIRM'

    return {
      id: slot.id,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
      status:
        slot.status === 'AVAILABLE_NEEDS_CONFIRM'
          ? 'AVAILABLE_NEEDS_CONFIRM'
          : (slot.status as UISlot['status']),
      needsConfirmation,
      price: slot.price,
      deposit: slot.deposit
    }
  })
}
