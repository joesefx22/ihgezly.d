// app/page.tsx
'use client'
// app/layout.tsx أو app/page.tsx
import { startupCheck } from '@/lib/env/startup-check'

// في Server Component
await startupCheck()
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DaySelector from './components/booking/day-selector'
import SlotGrid from './components/booking/slot-grid'
import { generateNextDays } from '@/lib/time-slots/core-logic'

export default function HomePage() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slots, setSlots] = useState<any[]>([])
  const [field, setField] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const days = generateNextDays(10)

  useEffect(() => {
    fetchSlots()
  }, [selectedDate])

  const fetchSlots = async () => {
    try {
      setLoading(true)
      // TODO: احصل fieldId من context أو params
      const fieldId = '1' // مؤقت
      
      const dateStr = selectedDate.toISOString().split('T')[0]
      const res = await fetch(`/api/fields/${fieldId}/slots?date=${dateStr}`)
      const data = await res.json()
      
      setSlots(data.slots)
      setField(data.field)
    } catch (error) {
      console.error('Error fetching slots:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">حجز الملاعب</h1>
          <p className="text-gray-600 mt-2">اختر الوقت المناسب وحجز ملاعبك المفضلة</p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {field && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{field.name}</h2>
              <p className="text-gray-600">{field.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {field.pricePerHour} ج.م/ساعة
                </span>
                <span className="text-gray-600">
                  مواعيد العمل: {field.openingTime} - {field.closingTime}
                </span>
              </div>
            </div>
          )}

          <DaySelector
            days={days}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">جاري تحميل المواعيد...</p>
            </div>
          ) : (
            <SlotGrid
              slots={slots}
              fieldId={field?.id || ''}
              fieldName={field?.name || ''}
              userId={session?.user?.id}
            />
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <h4 className="font-bold mb-2">🚀 حجز فوري</h4>
            <p className="text-sm text-gray-600">احجز وادفع مباشرة للمواعيد بعد 24 ساعة</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border">
            <h4 className="font-bold mb-2">⏰ تأكيد يدوي</h4>
            <p className="text-sm text-gray-600">المواعيد القريبة تحتاج تأكيد من الإدارة</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border">
            <h4 className="font-bold mb-2">🔒 قفل آمن</h4>
            <p className="text-sm text-gray-600">الموعد يبقى مقفول لك 5 دقائق لإتمام الحجز</p>
          </div>
        </div>
      </div>
    </div>
  )
}