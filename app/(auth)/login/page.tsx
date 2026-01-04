'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { loginSchema, LoginInput } from '@/lib/auth/validators'
import { LogIn, Mail, Lock, Shield, Gamepad2 } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc' // ✅ تمت الإضافة
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Card from '@/components/ui/card'
import Alert from '@/components/ui/alert'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false) // ✅ تمت الإضافة
  const [error, setError] = useState('')
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

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ تمت الإضافة: Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    
    try {
      const result = await signIn('google', {
        redirect: false
      })
      
      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول بجوجل')
    } finally {
      setGoogleLoading(false)
    }
  }

  const redirect = searchParams.get('redirect')
  const registered = searchParams.get('registered')
  const accountError = searchParams.get('error')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

          {accountError === 'account_inactive' && (
            <Alert 
              type="error" 
              title="الحساب غير نشط" 
              message="حسابك غير نشط حالياً، يرجى التواصل مع الدعم" 
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
                disabled={isLoading || googleLoading}
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
                disabled={isLoading || googleLoading}
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
              disabled={isLoading || googleLoading}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>

          {/* ✅ تمت الإضافة: Google Login Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-300">أو</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full mt-6 py-4 bg-white text-gray-900 hover:bg-gray-100
                       border border-gray-300 rounded-xl shadow-md
                       flex items-center justify-center gap-2 transition-all duration-300"
              loading={googleLoading}
              disabled={isLoading || googleLoading}
            >
              {googleLoading ? 'جاري تسجيل الدخول...' : (
                <>
                  <FcGoogle className="w-5 h-5" />
                  تسجيل الدخول بجوجل
                </>
              )}
            </Button>
          </div>

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
        </Card>
      </div>
    </div>
  )
}