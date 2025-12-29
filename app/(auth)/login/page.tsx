// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@/lib/auth/validators'
import { useAuth } from '@/context/authcontext'
import { 
  LogIn, 
  Mail, 
  Lock, 
  Shield,
  Gamepad2
} from 'lucide-react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Card from '@/components/ui/card'
import Alert from '@/components/ui/alert'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard')
    return null
  }

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError('')
    
    try {
      await login(data.email, data.password)
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  const redirect = searchParams.get('redirect')
  const registered = searchParams.get('registered')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">مرحباً بعودتك!</h1>
          <p className="text-gray-300">سجل دخولك وابدأ رحلتك</p>
        </div>

        <Card className="p-8 bg-white/10 backdrop-blur-lg border border-white/20">
          {registered && (
            <Alert 
              type="success" 
              title="تم التسجيل بنجاح" 
              message="تم إنشاء حسابك، يمكنك تسجيل الدخول الآن" 
              className="mb-6"
            />
          )}

          {redirect && (
            <Alert 
              type="info" 
              title="مطلوب تسجيل دخول" 
              message="يجب تسجيل الدخول للوصول إلى هذه الصفحة" 
              className="mb-6"
            />
          )}

          {error && (
            <Alert 
              type="error" 
              title="فشل تسجيل الدخول" 
              message={error} 
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <div className="absolute right-3 top-3 text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
                disabled={isLoading}
                className="bg-white/5 border-white/20 text-white pr-10"
              />
            </div>

            <div className="relative">
              <div className="absolute right-3 top-3 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <Input
                label="كلمة المرور"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
                disabled={isLoading}
                className="bg-white/5 border-white/20 text-white pr-10"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500
                       hover:from-blue-600 hover:to-purple-600 text-white font-semibold
                       rounded-xl shadow-lg hover:shadow-xl transition-all duration-300
                       flex items-center justify-center gap-2"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-center text-gray-300 text-sm mb-4">
              ليس لديك حساب؟{' '}
              <Link
                href="/register"
                className="font-medium text-blue-400 hover:text-blue-300 underline"
              >
                إنشاء حساب جديد
              </Link>
            </p>
          </div>

          {/* Roles Info */}
          <div className="mt-8 p-4 bg-white/5 rounded-xl">
            <h4 className="text-sm font-medium text-white mb-3 text-center">
              <Shield className="w-4 h-4 inline ml-1" />
              الأدوار المتاحة
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-blue-500/20 rounded-lg">
                <div className="text-lg">🎮</div>
                <div className="text-xs text-blue-300 font-medium">لاعب</div>
              </div>
              <div className="text-center p-2 bg-green-500/20 rounded-lg">
                <div className="text-lg">🏟️</div>
                <div className="text-xs text-green-300 font-medium">مالك</div>
              </div>
              <div className="text-center p-2 bg-purple-500/20 rounded-lg">
                <div className="text-lg">👨‍💼</div>
                <div className="text-xs text-purple-300 font-medium">موظف</div>
              </div>
              <div className="text-center p-2 bg-orange-500/20 rounded-lg">
                <div className="text-lg">👑</div>
                <div className="text-xs text-orange-300 font-medium">مدير</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              يتم تحديد دورك تلقائياً بعد التسجيل
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}