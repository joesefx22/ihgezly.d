// app/(player)/payment/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  
  const bookingId = searchParams.get('bookingId')
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState('')
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    if (!bookingId) {
      router.push('/bookings')
      return
    }

    if (!session) {
      router.push(`/login?redirect=/payment?bookingId=${bookingId}`)
      return
    }

    initializePayment()
  }, [bookingId, session])

  const initializePayment = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في تهيئة الدفع')
      }

      setPaymentData(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleIframeMessage = (event: MessageEvent) => {
    if (event.data === 'payment_success') {
      // انتقل لصفحة النجاح
      router.push(`/payment/success?bookingId=${bookingId}`)
    } else if (event.data === 'payment_failed') {
      router.push(`/payment/failed?bookingId=${bookingId}`)
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage)
    return () => window.removeEventListener('message', handleIframeMessage)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">جاري تحضير بوابة الدفع...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">حدث خطأ</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/bookings')}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
            >
              العودة للحجوزات
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">إكمال عملية الدفع</h1>
          
          {/* Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center">
                1
              </div>
              <span className="font-medium">تأكيد الحجز</span>
            </div>
            
            <div className="h-1 flex-1 bg-gray-300 mx-4"></div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center">
                2
              </div>
              <span className="font-medium">الدفع</span>
            </div>
            
            <div className="h-1 flex-1 bg-gray-300 mx-4"></div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">
                3
              </div>
              <span className="text-gray-500">التأكيد</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-primary-500" />
                <h2 className="text-xl font-bold text-gray-900">بيانات الدفع</h2>
              </div>

              {/* Paymob Iframe */}
              <div className="relative">
                {!iframeLoaded && (
                  <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                )}
                
                <iframe
                  src={`https://accept.paymob.com/api/acceptance/iframes/${process.env.NEXT_PUBLIC_PAYMOB_IFRAME_ID}?payment_token=${paymentData?.paymentToken}`}
                  className="w-full h-[600px] border border-gray-300 rounded-xl"
                  onLoad={() => setIframeLoaded(true)}
                  title="Paymob Payment Gateway"
                />
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-bold text-yellow-800 mb-2">معلومات أمان</h3>
                  <ul className="space-y-2 text-yellow-700">
                    <li className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>جميع بيانات الدفع مشفرة ومؤمنة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>نستخدم Paymob لنضمن أمان معاملاتك</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>لن نخزن أي بيانات بطاقتك على خوادمنا</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">ملخص الطلب</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">سعر الساعة</span>
                  <span className="font-medium">{paymentData?.amount} ج.م</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">العربون</span>
                  <span className="font-medium">{paymentData?.deposit} ج.م</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-bold">المبلغ الإجمالي</span>
                    <span className="text-xl font-bold text-primary-600">
                      {paymentData?.total} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-bold text-gray-900 mb-3">تفاصيل الحجز</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الملعب:</span>
                    <span className="font-medium">{paymentData?.fieldName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">التاريخ:</span>
                    <span className="font-medium">
                      {paymentData?.date && new Date(paymentData.date).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الوقت:</span>
                    <span className="font-medium">{paymentData?.time}</span>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => router.push('/bookings')}
                className="w-full mt-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                إلغاء الدفع
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
