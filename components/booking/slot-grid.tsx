// components/booking/slot-grid.tsx
'use client'

import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import SlotBookingModal from './slot-booking-modal'

interface Slot {
  id: string
  startTime: Date
  endTime: Date
  status: 'AVAILABLE' | 'NEED_CONFIRMATION' | 'BOOKED' | 'TEMP_LOCKED'
  needsConfirmation: boolean
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

  const getSlotStatusConfig = (slot: Slot) => {
    switch (slot.status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-700',
          icon: CheckCircle,
          label: 'متاح للحجز'
        }
      case 'NEED_CONFIRMATION':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-700',
          icon: AlertCircle,
          label: 'يحتاج تأكيد'
        }
      case 'BOOKED':
        return {
          bg: 'bg-gray-100 border-gray-300',
          text: 'text-gray-500',
          icon: XCircle,
          label: 'محجوز'
        }
      case 'TEMP_LOCKED':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-700',
          icon: Clock,
          label: 'مؤقت'
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-500',
          icon: Clock,
          label: 'غير متاح'
        }
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {slots.map((slot) => {
          const config = getSlotStatusConfig(slot)
          const Icon = config.icon
          const isClickable = slot.status === 'AVAILABLE' || slot.status === 'NEED_CONFIRMATION'

          return (
            <button
              key={slot.id}
              onClick={() => isClickable && setSelectedSlot(slot)}
              disabled={!isClickable}
              className={`${config.bg} border rounded-xl p-4 text-center transition-all ${
                isClickable 
                  ? 'hover:scale-105 hover:shadow-lg cursor-pointer' 
                  : 'cursor-not-allowed opacity-80'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className={`w-5 h-5 ${config.text}`} />
                <div className="text-lg font-bold">{formatTime(slot.startTime)}</div>
                <div className="text-sm text-gray-600">إلى {formatTime(slot.endTime)}</div>
                <div className={`text-xs font-medium ${config.text}`}>
                  {config.label}
                </div>
                {slot.status === 'AVAILABLE' && (
                  <div className="mt-2 text-sm font-bold text-gray-900">
                    {slot.price} ج.م
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedSlot && (
        <SlotBookingModal
          slot={selectedSlot}
          fieldId={fieldId}
          fieldName={fieldName}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </>
  )
}
