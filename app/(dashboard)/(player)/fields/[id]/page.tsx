// app/fields/[fieldId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import DaySelector from '@/app/components/booking/day-selector'
import SlotGrid from '@/app/components/booking/slot-grid'
import { generateNextDays } from '@/lib/time-slots/core-logic'
import { IdempotencyGuard } from '@/lib/idempotency/idempotency-guard'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

interface Field {
  id: string
  name: string
  description?: string
  status: string
  pricePerHour: number
  depositPrice: number
  openingTime: string
  closingTime: string
}

export default function FieldPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const fieldId = params.fieldId as string

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slots, setSlots] = useState<any[]>([])
  const [field, setField] = useState<Field | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const days = generateNextDays(10)

  useEffect(() => {
    if (fieldId) {
      fetchSlots()
    }
  }, [selectedDate, fieldId])

  const fetchSlots = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const dateStr = selectedDate.toISOString().split('T')[0]
      const res = await fetch(`/api/fields/${fieldId}/slots?date=${dateStr}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'فشل في تحميل المواعيد')
      }
      
      setSlots(data.slots || [])
      setField(data.field)
    } catch (err: any) {
      console.error('Error fetching slots:', err)
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleSlotSelect = async (slot: any) => {
    if (!session) {
      router.push('/login')
      return
    }

    // 🎫 توليد Idempotency Key آمن
    const idempotencyKey = IdempotencyGuard.generateKey('booking')
    
    try {
      // 1. قفل الـ Slot
      const lockRes = await fetch(`/api/fields/${fieldId}/slots/${slot.id}/lock`, {
        method: 'POST'
      })

      if (!lockRes.ok) {
        const error = await lockRes.json()
        throw new Error(error.error || 'فشل في قفل الموعد')
      }

      // 2. إنشاء الحجز
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          fieldId,
          idempotencyKey
        })
      })

      const bookingData = await bookingRes.json()

      if (!bookingRes.ok) {
        throw new Error(bookingData.error || 'فشل في إنشاء الحجز')
      }

      if (slot.metadata?.needsConfirmation) {
        alert('تم تقديم طلب الحجز بنجاح! سيتم تأكيده من قبل الموظف.')
        router.push('/bookings')
      } else {
        router.push(`/payment/${bookingData.bookingId}`)
      }
    } catch (err: any) {
      console.error('Booking error:', err)
      alert(err.message || 'حدث خطأ أثناء الحجز')
    }
  }

  if (loading && !field) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">حدث خطأ</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للخلف
          </button>
        </div>
      </div>
    )
  }

  if (!field) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الملعب غير موجود</h2>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">{field.name}</h1>
          {field.description && (
            <p className="text-gray-600 mt-2">{field.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {field.pricePerHour} ج.م/ساعة
            </span>
            <span className="text-gray-600">
              مواعيد العمل: {field.openingTime} - {field.closingTime}
            </span>
            {field.status === 'CLOSED' && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                مغلق حالياً
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <DaySelector
            days={days}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">جاري تحميل المواعيد...</p>
            </div>
          ) : (
            <SlotGrid
              slots={slots}
              fieldId={fieldId}
              fieldName={field.name}
              userId={session?.user?.id}
              onSlotSelect={handleSlotSelect}
            />
          )}

          {/* Booking Rules */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">شروط الحجز:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>الحد الأقصى للحجز اليومي: ساعتين</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>الحد الأقصى للحجز الأسبوعي: 4 ساعات</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>الحجز قبل 24 ساعة يحتاج تأكيد من الإدارة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>الموعد يبقى محجوزاً لك لمدة 5 دقائق لإتمام الحجز</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}