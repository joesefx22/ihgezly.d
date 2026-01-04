// app/(player)/bookings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Share2
} from 'lucide-react'
import { Booking } from '@/lib/types'

export default function MyBookingsPage() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    let filtered = bookings
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }
    
    if (selectedDate !== 'all') {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      if (selectedDate === 'today') {
        filtered = filtered.filter(booking => 
          new Date(booking.slot!.startTime).toDateString() === today.toDateString()
        )
      } else if (selectedDate === 'tomorrow') {
        filtered = filtered.filter(booking => 
          new Date(booking.slot!.startTime).toDateString() === tomorrow.toDateString()
        )
      } else if (selectedDate === 'upcoming') {
        filtered = filtered.filter(booking => 
          new Date(booking.slot!.startTime) > today
        )
      } else if (selectedDate === 'past') {
        filtered = filtered.filter(booking => 
          new Date(booking.slot!.startTime) < today
        )
      }
    }
    
    setFilteredBookings(filtered)
  }, [bookings, statusFilter, selectedDate])

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings/my-bookings')
      const data = await res.json()
      setBookings(data.bookings as Booking[])
      setFilteredBookings(data.bookings as Booking[])
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
        fetchBookings()
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'PENDING_CONFIRMATION':
        return <AlertCircle className="w-5 h-5 text-amber-500" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING_CONFIRMATION':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الحجوزات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">حجوزاتي</h1>
          <p className="text-gray-600">إدارة ومتابعة جميع حجوزاتك في مكان واحد</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
                <div className="text-gray-600">إجمالي الحجوزات</div>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'CONFIRMED').length}
                </div>
                <div className="text-gray-600">حجوزات مؤكدة</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'PENDING_CONFIRMATION').length}
                </div>
                <div className="text-gray-600">بانتظار التأكيد</div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-gray-900">تصفية الحجوزات</h3>
            </div>
            
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                تصدير
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                مشاركة
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حالة الحجز
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="CONFIRMED">مؤكد</option>
                <option value="PENDING_CONFIRMATION">بانتظار التأكيد</option>
                <option value="CANCELLED">ملغى</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">جميع الأوقات</option>
                <option value="today">اليوم</option>
                <option value="tomorrow">غداً</option>
                <option value="upcoming">قادمة</option>
                <option value="past">سابقة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد حجوزات</h3>
            <p className="text-gray-500 mb-6">قم بحجز ملعبك الأول الآن!</p>
            <button
              onClick={() => window.location.href = '/fields'}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700"
            >
              استعرض الملاعب
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => (
              <div 
                key={booking.id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      {getStatusIcon(booking.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status === 'CONFIRMED' ? 'مؤكد' :
                         booking.status === 'PENDING_CONFIRMATION' ? 'بانتظار التأكيد' : 'ملغى'}
                      </span>
                      
                      {booking.status === 'PENDING_CONFIRMATION' && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">يحتاج تأكيد موظف</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {booking.field?.name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {new Date(booking.slot!.startTime).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {new Date(booking.slot!.startTime).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{booking.field?.location}</span>
                      </div>
                    </div>
                    
                    {/* Payment Status */}
                    {booking.paymentStatus && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                        <div className={`w-2 h-2 rounded-full ${
                          booking.paymentStatus === 'PAID' ? 'bg-green-500' :
                          booking.paymentStatus === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-700">
                          {booking.paymentStatus === 'PAID' ? 'تم الدفع' :
                           booking.paymentStatus === 'PENDING' ? 'بانتظار الدفع' : 'فشل الدفع'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    {booking.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          إلغاء الحجز
                        </button>
                        <button
                          onClick={() => window.open(`/bookings/${booking.id}/invoice`, '_blank')}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          عرض الفاتورة
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'PENDING_CONFIRMATION' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
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
    </div>
  )
}