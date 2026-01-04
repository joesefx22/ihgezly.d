// components/booking/slot-grid.tsx
'use client'

import { useState } from 'react'
import { Clock, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import SlotBookingModal from './slot-booking-modal'
import { UISlot } from '@/components/booking/slots-mapper'

interface SlotGridProps {
  slots: UISlot[]
  fieldId: string
  fieldName: string
  onSlotSelect?: (slot: UISlot) => void
}

export default function SlotGrid({ slots, fieldId, fieldName, onSlotSelect }: SlotGridProps) {
  const [selectedSlot, setSelectedSlot] = useState<UISlot | null>(null)

  const handleSlotClick = (slot: UISlot) => {
    if (slot.uiStatus === 'AVAILABLE') {
      setSelectedSlot(slot)
      if (onSlotSelect) {
        onSlotSelect(slot)
      }
    }
  }

  const getSlotVariant = (slot: UISlot) => {
    switch (slot.uiStatus) {
      case 'AVAILABLE':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-green-100',
          border: 'border-green-200',
          text: 'text-green-800',
          hover: 'hover:from-green-100 hover:to-green-200 hover:border-green-300 hover:shadow-md',
          icon: <Clock className="w-4 h-4" />,
          label: 'متاح'
        }
      case 'LOCKED_ME':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-800',
          hover: 'hover:from-blue-100 hover:to-blue-200 hover:border-blue-300',
          icon: <Lock className="w-4 h-4" />,
          label: 'مقفول لك'
        }
      case 'LOCKED_OTHER':
        return {
          bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
          border: 'border-gray-300',
          text: 'text-gray-600',
          hover: '',
          icon: <Lock className="w-4 h-4" />,
          label: 'محجوز'
        }
      case 'BOOKED':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-red-100',
          border: 'border-red-200',
          text: 'text-red-600',
          hover: '',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'محجوز'
        }
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-500',
          hover: '',
          icon: null,
          label: 'غير متاح'
        }
    }
  }

  // تصفية الساعات حسب حالة اليوم
  const morningSlots = slots.filter(slot => 
    new Date(slot.startTime).getHours() < 12
  )
  const afternoonSlots = slots.filter(slot => 
    new Date(slot.startTime).getHours() >= 12 && 
    new Date(slot.startTime).getHours() < 17
  )
  const eveningSlots = slots.filter(slot => 
    new Date(slot.startTime).getHours() >= 17
  )

  const renderTimeSlot = (slot: UISlot) => {
    const variant = getSlotVariant(slot)
    const isAvailable = slot.uiStatus === 'AVAILABLE'
    const timeString = new Date(slot.startTime).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    return (
      <button
        key={slot.id}
        onClick={() => handleSlotClick(slot)}
        disabled={!isAvailable}
        className={`
          relative flex flex-col items-center justify-center p-4 rounded-xl
          ${variant.bg} ${variant.border} border ${variant.text}
          transition-all duration-200 ${variant.hover}
          disabled:opacity-50 disabled:cursor-not-allowed
          group
        `}
      >
        <div className="flex items-center gap-2 mb-2">
          {variant.icon}
          <span className="font-bold">{timeString}</span>
        </div>
        
        <div className="text-sm font-medium mb-1">{variant.label}</div>
        
        {slot.metadata?.needsConfirmation && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>تأكيد</span>
            </div>
          </div>
        )}
        
        {isAvailable && (
          <div className="mt-2">
            <div className="text-lg font-bold">{slot.price} ج.م</div>
            <div className="text-xs opacity-75">عربون {slot.deposit} ج.م</div>
          </div>
        )}
        
        {/* Hover Effect */}
        {isAvailable && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-8">
      {/* Morning Slots */}
      {morningSlots.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            فترة الصباح
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {morningSlots.map(renderTimeSlot)}
          </div>
        </div>
      )}

      {/* Afternoon Slots */}
      {afternoonSlots.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            فترة الظهيرة
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {afternoonSlots.map(renderTimeSlot)}
          </div>
        </div>
      )}

      {/* Evening Slots */}
      {eveningSlots.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            فترة المساء
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {eveningSlots.map(renderTimeSlot)}
          </div>
        </div>
      )}

      {/* No Slots Message */}
      {slots.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد مواعيد متاحة</h3>
          <p className="text-gray-500">جميع المواعيد محجوزة لهذا اليوم</p>
        </div>
      )}

      {/* Booking Modal */}
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