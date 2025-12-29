// app/(player)/bookings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle
} from 'lucide-react'
import CountdownTimer from '@/components/booking/countdown-timer'

// ✅ عرفنا نوع الحجز
interface Booking {
  id: string
  status: 'CONFIRMED' | 'PENDING_CONFIRMATION' | 'CANCELLED'
  field: {
    id: string
    name: string
    location: string
  }
  slot: {
    id: string
    startTime: string
    endTime?: string
  }
}

export default function MyBookingsPage() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings/my-bookings')
      const data = await res.json()
      setBookings(data.bookings as Booking[]) // ✅ cast للنوع
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء الحجز؟')) return
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'إلغاء من المستخدم' })
      })
      
      if (res.ok) {
        alert('تم إلغاء الحجز بنجاح')
        fetchBookings() // Refresh
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">حجوزاتي</h1>
      
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد حجوزات</h3>
          <p className="text-gray-500">قم بحجز ملعبك الأول الآن!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div 
              key={booking.id}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Booking Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      booking.status === 'PENDING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status === 'CONFIRMED' ? 'مؤكد' :
                       booking.status === 'PENDING_CONFIRMATION' ? 'بانتظار التأكيد' : 'ملغى'}
                    </div>
                    
                    {booking.status === 'PENDING_CONFIRMATION' && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">يحتاج تأكيد موظف</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {booking.field.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {new Date(booking.slot.startTime).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {new Date(booking.slot.startTime).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{booking.field.location}</span>
                    </div>
                  </div>
                  
                  {/* Countdown Timer */}
                  {booking.status === 'CONFIRMED' && (
                    <CountdownTimer 
                      targetDate={new Date(booking.slot.startTime)}
                      onExpired={fetchBookings}
                    />
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-3">
                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      إلغاء الحجز
                    </button>
                  )}
                  
                  {booking.status === 'PENDING_CONFIRMATION' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      إلغاء الطلب
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
