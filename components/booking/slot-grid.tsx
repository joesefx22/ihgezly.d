'use client'

import { useState } from 'react'
import SlotBookingModal from './slot-booking-modal'

interface Slot {
  id: string
  startTime: Date
  endTime: Date
  status: 'AVAILABLE' | 'AVAILABLE_NEEDS_CONFIRM' | 'BOOKED' | 'TEMP_LOCKED'
  price: number
  deposit: number
}

interface SlotGridProps {
  slots: Slot[]
  fieldId: string
  fieldName: string
}

export default function SlotGrid({ slots, fieldId, fieldName }: SlotGridProps) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const handleSelectSlot = (slot: Slot) => {
    if (slot.status === 'AVAILABLE' || slot.status === 'AVAILABLE_NEEDS_CONFIRM') {
      setSelectedSlot(slot)
    }
  }

  return (
    <div>
      {/* Grid of slots */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {slots.map((slot) => {
          const isAvailable = slot.status === 'AVAILABLE'
          const needsConfirmation = slot.status === 'AVAILABLE_NEEDS_CONFIRM'
          const isBooked = slot.status === 'BOOKED'
          const isTempLocked = slot.status === 'TEMP_LOCKED'

          let bgColor = 'bg-gray-100'
          if (isAvailable) bgColor = 'bg-green-100'
          if (needsConfirmation) bgColor = 'bg-yellow-100'
          if (isBooked) bgColor = 'bg-gray-300'
          if (isTempLocked) bgColor = 'bg-blue-100'

          return (
            <button
              key={slot.id}
              onClick={() => handleSelectSlot(slot)}
              disabled={isBooked || isTempLocked}
              className={`p-4 rounded-xl ${bgColor} border hover:shadow-md disabled:opacity-50`}
            >
              <p className="text-sm font-medium">
                {slot.startTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {slot.endTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </button>
          )
        })}
      </div>

      {/* Modal */}
      {selectedSlot && (
        <SlotBookingModal
          slot={selectedSlot}
          fieldId={fieldId}
          fieldName={fieldName}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  )
}
