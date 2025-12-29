// components/layout/Header.tsx
"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Menu, User as UserIcon, LogOut, Bell } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import type { User as AppUser } from "next-auth"

interface HeaderProps {
  user?: AppUser
}

export default function Header({ user: userProp }: HeaderProps) {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const user = userProp ?? session?.user

  const getDashboardPath = () => {
    const role = user?.role
    if (!role) return "/dashboard"
    switch (role) {
      case "PLAYER":
        return "/dashboard/player"
      case "OWNER":
        return "/dashboard/owner"
      case "EMPLOYEE":
        return "/dashboard/employee"
      case "ADMIN":
        return "/dashboard/admin"
      default:
        return "/dashboard"
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">⚽</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900">احجزلي</h1>
              <p className="text-xs text-gray-500 mt-[-2px]">حجز ملاعب رياضية</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/fields"
              className={`font-medium transition-colors ${
                pathname === "/fields" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              الملاعب
            </Link>

            {user && (
              <Link
                href={getDashboardPath()}
                className={`font-medium transition-colors ${
                  pathname.startsWith("/dashboard") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                }`}
              >
                لوحة التحكم
              </Link>
            )}

            <Link href="/about" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
              عن احجزلي
            </Link>
            <Link href="/contact" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
              اتصل بنا
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <button
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                  aria-label="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* User Dropdown */}
                <div className="relative group">
                  <button
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    aria-label="حساب المستخدم"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="font-medium text-gray-900 text-sm">{user.name ?? "مستخدم"}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </button>

                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>

                      <div className="mt-2">
                        <Link
                          href={getDashboardPath()}
                          className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
                        >
                          <UserIcon className="w-4 h-4" />
                          لوحة التحكم
                        </Link>

                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل الخروج
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
              aria-label="القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 animate-slideDown">
            <div className="flex flex-col gap-2">
              <Link
                href="/fields"
                className="px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                الملاعب
              </Link>

              {user && (
                <Link
                  href={getDashboardPath()}
                  className="px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  لوحة التحكم
                </Link>
              )}

              <Link
                href="/about"
                className="px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                عن احجزلي
              </Link>

              <Link
                href="/contact"
                className="px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                اتصل بنا
              </Link>

              {!user && (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-3 text-center text-blue-600 hover:bg-blue-50 rounded-lg font-medium border border-blue-200 mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
