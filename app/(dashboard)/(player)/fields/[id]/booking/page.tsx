'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DaySelector from '@/components/booking/day-selector'
import SlotGrid from '@/components/booking/slot-grid'
import { Loader2, ArrowRight, MapPin, CreditCard } from 'lucide-react'
import { generateNextTenDays, Day } from '@/lib/time-slots/core-logic'
import { mapApiSlotsToUI, UISlot } from '@/components/booking/slots-mapper'

interface Field {
  id: string
  name: string
  description: string
  location: string
  pricePerHour: number
  depositPrice: number
  imageUrl: string
}

export default function FieldBookingPage() {
  const params = useParams()
  const router = useRouter()
  const fieldId = params.id as string
  
  const [field, setField] = useState<Field | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)
  const [slots, setSlots] = useState<UISlot[]>([])
  const [days, setDays] = useState<Day[]>([])

  useEffect(() => {
    fetchField()
    const nextTenDays = generateNextTenDays()
    setDays(nextTenDays)
    if (nextTenDays.length > 0) {
      setSelectedDay(nextTenDays[0])
    }
  }, [])

  useEffect(() => {
    if (selectedDay && fieldId) {
      fetchSlots(selectedDay.date)
    }
  }, [selectedDay, fieldId])

  const fetchField = async () => {
    try {
      const response = await fetch(`/api/fields/${fieldId}`)
      const data = await response.json()
      setField(data.field)
    } catch (error) {
      console.error('Error fetching field:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async (date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0] // YYYY-MM-DD
      const response = await fetch(`/api/fields/${fieldId}/slots/${formattedDate}`)
      const data = await response.json()
      setSlots(mapApiSlotsToUI(data.slots))   // ✅ استخدام المابّر هنا
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }

  const handleSelectDate = (day: Day) => {
    setSelectedDay(day)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">جاري تحميل بيانات الملعب...</p>
      </div>
    )
  }

  if (!field) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">الملعب غير موجود</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
        >
          العودة
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Field Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowRight className="w-5 h-5" />
          العودة
        </button>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{field.name}</h1>
          <p className="text-gray-600 mb-4">{field.description}</p>
          
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{field.location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">
                سعر الساعة: <strong>{field.pricePerHour} ج.م</strong>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">
                العربون: <strong>{field.depositPrice} ج.م</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <DaySelector
        days={days}
        selectedDate={selectedDay}
        onSelectDate={handleSelectDate}
      />

      {/* Slots Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          المواعيد المتاحة {selectedDay && `ليوم ${selectedDay.date.toLocaleDateString('ar-EG')}`}
        </h3>
        
        {slots.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-600">لا توجد مواعيد متاحة لهذا اليوم</p>
          </div>
        ) : (
          <SlotGrid
            slots={slots}
            fieldId={fieldId}
            fieldName={field.name}
          />
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h4 className="font-semibold text-gray-900 mb-3">مفتاح الألوان:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-sm text-gray-700">متاح للحجز</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-sm text-gray-700">يحتاج تأكيد</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-700">محجوز</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-sm text-gray-700">مؤقت</span>
          </div>
        </div>
      </div>
    </div>
  )
}
