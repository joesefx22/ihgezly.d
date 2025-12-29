// app/(dashboard)/layout.tsx
import type { Metadata } from 'next'
import { Inter, Tajawal } from 'next/font/google'
import '../globals.css' // المسار الصح
import { AuthProvider } from '@/context/authcontext'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/layout/header'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

// إعداد الخطوط
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const tajawal = Tajawal({
  weight: ['300', '400', '500', '700', '800'],
  subsets: ['arabic'],
  variable: '--font-tajawal',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'احجزلي - لوحة التحكم',
  description: 'لوحة تحكم نظام احجزلي لحجز الملاعب الرياضية',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="ar" 
      dir="rtl" 
      className={`${inter.variable} ${tajawal.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 font-sans antialiased">
        <AuthProvider>
          {/* Header العام للموقع */}
          <Header />
          
          {/* Navbar للداشبورد فقط */}
          <Navbar />
          
          {/* المحتوى الرئيسي */}
          <main className="container mx-auto px-4 py-6 md:py-8">
            {children}
          </main>
          
          {/* Footer */}
          <Footer />
          
          {/* Toast Notifications */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
                fontFamily: 'var(--font-tajawal), var(--font-inter), sans-serif',
                fontSize: '14px',
                border: '1px solid #374151',
              },
              success: {
                style: {
                  background: '#065f46',
                  border: '1px solid #10b981',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                style: {
                  background: '#7f1d1d',
                  border: '1px solid #ef4444',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
              loading: {
                style: {
                  background: '#1e40af',
                  border: '1px solid #3b82f6',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}