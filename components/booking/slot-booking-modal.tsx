// components/booking/slot-booking-modal.tsx
'use client'

import { X, Clock, MapPin, CreditCard, Shield, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { UISlot } from '@/components/booking/slots-mapper'
import { IdempotencyGuard } from '@/lib/idempotency/idempotency-guard'

interface SlotBookingModalProps {
  slot: UISlot
  fieldId: string
  fieldName: string
  onClose: () => void
}

export default function SlotBookingModal({ slot, fieldId, fieldName, onClose }: SlotBookingModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isBooking, setIsBooking] = useState(false)
  const [step, setStep] = useState(1) // 1: Confirm, 2: Processing, 3: Success/Error

  const handleBook = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setIsBooking(true)
    setStep(2)

    try {
      // توليد مفتاح idempotency آمن
      const idempotencyKey = IdempotencyGuard.generateKey('booking')

      // 1. قفل الـ Slot
      const lockResponse = await fetch(`/api/fields/${fieldId}/slots/${slot.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!lockResponse.ok) {
        const err = await lockResponse.json()
        throw new Error(err.error || 'فشل في قفل الموعد')
      }

      // 2. إنشاء الحجز
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          fieldId,
          startTime: slot.startTime,
          idempotencyKey
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء الحجز')
      }

      setStep(3)
      
      setTimeout(() => {
        if (slot.metadata?.needsConfirmation) {
          router.push('/bookings?status=pending')
        } else {
          router.push(`/payment?bookingId=${data.bookingId}`)
        }
        onClose()
      }, 1500)

    } catch (error: any) {
      console.error('Booking error:', error)
      alert(error.message || 'حدث خطأ أثناء الحجز')
      setStep(1)
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

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">تأكيد الحجز</h3>
                <p className="text-gray-600 text-sm mt-1">الرجاء مراجعة تفاصيل الحجز</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-bold text-lg text-gray-900 mb-2">{fieldName}</h4>
                <p className="text-gray-600">ملعب كرة قدم احترافي</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="font-medium text-gray-900">{formatDate(slot.startTime)}</div>
                    <div className="text-gray-600 text-sm">
                      من {formatTime(slot.startTime)} إلى {formatTime(slot.endTime)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="font-medium text-gray-900">الموقع</div>
                    <div className="text-gray-600 text-sm">مدينة نصر، القاهرة</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <CreditCard className="w-5 h-5 text-primary-500" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">السعر</div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">{slot.price}</span>
                        <span className="text-gray-600 mr-2">ج.م</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        عربون: {slot.deposit} ج.م
                      </div>
                    </div>
                  </div>
                </div>

                {slot.metadata?.needsConfirmation && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-amber-800">يحتاج تأكيد</div>
                        <p className="text-amber-700 text-sm mt-1">
                          هذا الموعد يحتاج تأكيد من إدارة الملعب. سيتم التواصل معك خلال 24 ساعة.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBook}
                  disabled={isBooking}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الحجز...
                    </>
                  ) : (
                    'تأكيد الحجز'
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>جميع بياناتك محمية وآمنة</span>
              </div>
            </div>
          </>
        )
      
      case 2:
        return (
          <div className="p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <Loader2 className="w-20 h-20 text-primary-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary-500 rounded-full animate-ping"></div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">جاري تأكيد حجزك</h3>
            <p className="text-gray-600">برجاء الانتظار بينما نقوم بتأمين الموعد لك</p>
          </div>
        )
      
      case 3:
        return (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">تم حجز الموعد بنجاح!</h3>
            <p className="text-gray-600 mb-6">سيتم توجيهك إلى صفحة الدفع خلال لحظات</p>
            <div className="w-12 h-1 bg-primary-500 rounded-full mx-auto animate-pulse"></div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95">
        {getStepContent()}
      </div>
    </div>
  )
}