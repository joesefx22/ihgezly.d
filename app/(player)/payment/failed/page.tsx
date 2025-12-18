// app/(player)/payment/failed/page.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { XCircle, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('bookingId')
  const error = searchParams.get('error') || 'فشلت عملية الدفع'

  const handleRetry = () => {
    if (bookingId) {
      router.push(`/payment?bookingId=${bookingId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">فشل الدفع</h1>
            <p className="text-gray-600">{error}</p>
          </div>

          {/* Error Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">الأسباب المحتملة:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-5 h-5 text-red-500 mt-0.5" />
                    <span>رصيد غير كافي في البطاقة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-5 h-5 text-red-500 mt-0.5" />
                    <span>بيانات البطاقة غير صحيحة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-5 h-5 text-red-500 mt-0.5" />
                    <span>انتهت صلاحية البطاقة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-5 h-5 text-red-500 mt-0.5" />
                    <span>مشكلة في الاتصال بخدمة الدفع</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">نصيحة:</h4>
                <p className="text-blue-700 text-sm">
                  تأكد من صحة بيانات البطاقة وتوفر الرصيد. يمكنك أيضاً تجربة بطاقة أخرى أو الاتصال بالبنك.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            {bookingId && (
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
              >
                <RefreshCw className="w-5 h-5" />
                المحاولة مرة أخرى
              </button>
            )}
            
            <Link
              href="/bookings"
              className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              العودة للحجوزات
            </Link>
            
            <Link
              href="/"
              className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              العودة للرئيسية
            </Link>
          </div>

          {/* Contact Support */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">هل تواجه مشكلة مستمرة؟</p>
            <Link 
              href="/contact" 
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              اتصل بالدعم الفني
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
