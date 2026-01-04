import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'نظام حجز الملاعب الرياضية',
  description: 'نظام متكامل لحجز الملاعب الرياضية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
              },
              success: {
                style: {
                  background: '#065f46',
                  border: '1px solid #047857',
                },
              },
              error: {
                style: {
                  background: '#7f1d1d',
                  border: '1px solid #991b1b',
                },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}