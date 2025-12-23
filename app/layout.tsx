// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './../styles/globals.css'
import { NextAuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'احجزلي - حجز ملاعب رياضية',
  description: 'احجز أفضل ملاعب كرة القدم والبادل في مصر',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-gray-50">
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
