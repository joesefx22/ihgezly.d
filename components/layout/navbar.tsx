// components/layout/Navbar.tsx
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { formatRole } from '@/lib/helpers' // المسار الصحيح

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const user = session?.user

  if (!user) return null

  // تحديد المسار حسب الرول
  const rolePaths = {
    PLAYER: '/dashboard/player',
    OWNER: '/dashboard/owner',
    EMPLOYEE: '/dashboard/employee',
    ADMIN: '/dashboard/admin'
  }

  const currentPath = rolePaths[user.role as keyof typeof rolePaths] || '/dashboard'

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-950 text-white shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link 
              href={currentPath} 
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚽</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                احجزلي
              </span>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href={currentPath}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === currentPath 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                الرئيسية
              </Link>
              
              {user.role === 'ADMIN' && (
                <Link
                  href="/dashboard/admin/users"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.includes('/admin/users')
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  إدارة المستخدمين
                </Link>
              )}
              
              <Link
                href="/dashboard/player/bookings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.includes('/bookings')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                حجوزاتي
              </Link>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-gray-400">{formatRole(user.role)}</span>
            </div>
            
            {/* User Avatar */}
            <div className="relative group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white font-semibold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-gray-700">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  
                  <div className="mt-2">
                    <Link
                      href={`/dashboard/${user.role.toLowerCase()}/profile`}
                      className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg"
                    >
                      الملف الشخصي
                    </Link>
                    
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg mt-1"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}