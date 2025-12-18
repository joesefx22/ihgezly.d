// app/(player)/payment/success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Calendar, MapPin, Clock, Download } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('bookingId')
  
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) {
      router.push('/bookings')
      return
    }

    fetchBookingDetails()
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      const data = await response.json()
      setBooking(data.booking)
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل الحجز...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">تم الدفع بنجاح! 🎉</h1>
            <p className="text-gray-600">تم تأكيد حجزك بنجاح. يمكنك الآن طباعة الفاتورة أو حفظها.</p>
          </div>

          {/* Booking Details Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8" id="receipt">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">فاتورة الحجز</h2>
                  <p className="text-gray-500">رقم الفاتورة: #{booking?.id?.slice(-8)}</p>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    مدفوعة
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {new Date().toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
            </div>

            {/* Field Info */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">تفاصيل الملعب</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الملعب</p>
                    <p className="font-medium">{booking?.field?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">التاريخ</p>
                    <p className="font-medium">
                      {booking?.slot?.startTime && 
                       new Date(booking.slot.startTime).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الوقت</p>
                    <p className="font-medium">
                      {booking?.slot?.startTime && 
                       new Date(booking.slot.startTime).toLocaleTimeString('ar-EG', {
                         hour: '2-digit',
                         minute: '2-digit'
                       })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">ملخص الدفع</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">سعر الساعة</span>
                  <span className="font-medium">{booking?.field?.pricePerHour} ج.م</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">العربون</span>
                  <span className="font-medium">{booking?.field?.depositPrice} ج.م</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">المبلغ الإجمالي</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {booking?.totalAmount} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">طريقة الدفع</p>
                <p className="font-medium">بطاقة ائتمان/خصم</p>
              </div>
            </div>

            {/* Important Notes */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h4 className="font-bold text-yellow-800 mb-2">ملاحظات هامة:</h4>
              <ul className="space-y-1 text-yellow-700 text-sm">
                <li>• يرجى الحضور قبل موعد الحجز بـ 15 دقيقة</li>
                <li>• التاخير أكثر من 15 دقيقة يؤدي إلى إلغاء الحجز</li>
                <li>• يمكنك إلغاء الحجز قبل 24 ساعة للحصول على استرداد</li>
                <li>• احتفظ بهذه الفاتورة لعرضها في الملعب</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              <Download className="w-5 h-5" />
              طباعة الفاتورة
            </button>
            
            <Link
              href="/bookings"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
            >
              عرض جميع حجوزاتي
            </Link>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
