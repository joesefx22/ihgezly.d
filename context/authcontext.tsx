'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/helpers'
import type { User } from 'next-auth' // ✅ استخدم النوع الموسع من next-auth

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  changePassword: (data: ChangePasswordData) => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  age: number
  description?: string
  skillLevel?: User['skillLevel'] // ✅ استخدم نفس النوع
}

interface UpdateProfileData {
  name?: string
  email?: string
  phoneNumber?: string
  age?: number
  description?: string
  skillLevel?: User['skillLevel']
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data as User) // ✅ cast للنوع الصحيح
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/login', '/register', '/']
      const isPublicPath = publicPaths.some(path => pathname?.startsWith(path))

      if (isAuthenticated && isPublicPath) {
        const rolePaths = {
          PLAYER: '/dashboard/player',
          OWNER: '/dashboard/owner',
          EMPLOYEE: '/dashboard/employee',
          ADMIN: '/dashboard/admin'
        }
        const redirectPath = rolePaths[user?.role as keyof typeof rolePaths] || '/dashboard'
        router.push(redirectPath)
      } else if (!isAuthenticated && !isPublicPath && pathname !== '/') {
        router.push('/login')
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.message)

      setUser(data.data.user as User)
      setIsAuthenticated(true)
      toast.success('تم تسجيل الدخول بنجاح!')

      const rolePaths = {
        PLAYER: '/dashboard/player',
        OWNER: '/dashboard/owner',
        EMPLOYEE: '/dashboard/employee',
        ADMIN: '/dashboard/admin'
      }
      router.push(rolePaths[data.data.user.role as keyof typeof rolePaths] || '/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'فشل تسجيل الدخول')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      toast.success('تم التسجيل بنجاح! يمكنك تسجيل الدخول الآن.')
      router.push('/login?registered=true')
    } catch (error: any) {
      toast.error(error.message || 'فشل في التسجيل')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      setUser(null)
      setIsAuthenticated(false)
      toast.success('تم تسجيل الخروج بنجاح')
      router.push('/login')
    } catch {
      toast.error('فشل تسجيل الخروج')
    }
  }

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      setUser(result.data as User)
      toast.success('تم تحديث الملف الشخصي بنجاح')
    } catch (error: any) {
      toast.error(error.message || 'فشل تحديث الملف الشخصي')
      throw error
    }
  }

  const changePassword = async (data: ChangePasswordData) => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      toast.success('تم تغيير كلمة المرور بنجاح')
    } catch (error: any) {
      toast.error(error.message || 'فشل تغيير كلمة المرور')
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser: fetchUser,
    updateProfile,
    changePassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
