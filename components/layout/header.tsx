// components/layout/header.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Menu, User, LogOut, Bell } from 'lucide-react'
import { useState } from 'react'

export default function Header({ user }: { user?: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚽</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">احجزلي</h1>
              <p className="text-xs text-gray-500">حجز ملاعب رياضية</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/fields?type=football" className="text-gray-700 hover:text-primary-600 font-medium">
              ملاعب كرة القدم
            </Link>
            <Link href="/fields?type=padel" className="text-gray-700 hover:text-primary-600 font-medium">
              ملاعب البادل
            </Link>
            {user && (
              <Link href="/bookings" className="text-gray-700 hover:text-primary-600 font-medium">
                حجوزاتي
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-600 hover:text-primary-600 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">{user.name}</span>
                  </button>
                  
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-primary-600 font-medium hover:text-primary-700"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-3">
              <Link
                href="/fields?type=football"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ملاعب كرة القدم
              </Link>
              <Link
                href="/fields?type=padel"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ملاعب البادل
              </Link>
              {user && (
                <Link
                  href="/bookings"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  حجوزاتي
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
