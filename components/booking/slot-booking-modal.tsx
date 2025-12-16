// components/booking/slot-booking-modal.tsx
'use client'

import { X, Clock, CreditCard, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface SlotBookingModalProps {
  slot: {
    id: string
    startTime: Date
    endTime: Date
    status: string
    needsConfirmation: boolean
    price: number
    deposit: number
  }
  fieldId: string
  fieldName: string
  onClose: () => void
}

export default function SlotBookingModal({ slot, fieldId, fieldName, onClose }: SlotBookingModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isBooking, setIsBooking] = useState(false)

  const handleBook = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setIsBooking(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          fieldId,
          startTime: slot.startTime,
          needsConfirmation: slot.needsConfirmation
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (slot.needsConfirmation) {
          alert('تم تقديم طلب الحجز بنجاح! سيتم تأكيده من قبل الموظف خلال 14 ساعة.')
          onClose()
          router.push('/bookings')
        } else {
          // توجيه للدفع
          router.push(`/payment?bookingId=${data.bookingId}`)
        }
      } else {
        alert(data.error || 'حدث خطأ أثناء الحجز')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('حدث خطأ أثناء الحجز')
    } finally {
      setIsBooking(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">تأكيد الحجز</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Field Info */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-2">{fieldName}</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatDate(slot.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  من {formatTime(slot.startTime)} إلى {formatTime(slot.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CreditCard className="w-4 h-4" />
                <span>السعر: {slot.price} جنيه</span>
              </div>
            </div>
          </div>

          {/* Notice if needs confirmation */}
          {slot.needsConfirmation && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h5 className="font-bold text-yellow-800 mb-1">تأكيد من الموظف مطلوب</h5>
                  <p className="text-yellow-700 text-sm">
                    بما أن الحجز قبل أقل من 24 ساعة، يحتاج هذا الحجز إلى تأكيد من الموظف.
                    سيتم الرد خلال 14 ساعة على الأكثر.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Booking Conditions */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>في حالة الإلغاء قبل 24 ساعة، يتم استرداد العربون</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>التأخير أكثر من 15 دقيقة يؤدي إلى إلغاء الحجز</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>حد أقصى 2 ساعة حجز يومياً للاعب</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleBook}
              disabled={isBooking}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-white ${
                slot.needsConfirmation
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
              } disabled:opacity-50`}
            >
              {isBooking ? 'جاري الحجز...' : slot.needsConfirmation ? 'تقديم طلب الحجز' : 'دفع والحجز'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
