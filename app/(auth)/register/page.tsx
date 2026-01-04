'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterInput } from '@/lib/auth/validators'
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Calendar,
  Star,
  FileText,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Target,
  Trophy
} from 'lucide-react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Alert from '@/components/ui/alert'
import { cn } from '@/lib/helpers'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [skillLevel, setSkillLevel] = useState<'WEAK' | 'AVERAGE' | 'GOOD' | 'EXCELLENT' | 'LEGENDARY'>('AVERAGE')
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      age: undefined,
      description: '',
      skillLevel: 'AVERAGE'
    }
  })

  // ✅ التعديل: إزالة useAuth() واستخدام fetch مباشرة
  const registerUser = async (data: RegisterInput) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    
    // Redirect to login
    router.push('/login?registered=true');
  };

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const description = watch('description')

  // ✅ التعديل: سياسة باسورد مبسطة (6 أحرف فقط)
  const passwordChecks = [
    { label: '6 أحرف على الأقل', check: password?.length >= 6 },
    { label: 'أقل من 72 حرفاً', check: password?.length <= 72 },
  ];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError('')
    
    try {
      // ✅ استخدام الدالة الجديدة
      await registerUser(data)
    } catch (err: any) {
      setError(err.message || 'فشل في التسجيل')
    } finally {
      setIsLoading(false)
    }
  }

  const skillLevels = [
    { value: 'WEAK' as const, label: 'ضعيف', desc: 'مبتدئ', icon: '😅' },
    { value: 'AVERAGE' as const, label: 'متوسط', desc: 'لديه خبرة', icon: '😊' },
    { value: 'GOOD' as const, label: 'جيد', desc: 'متمكن', icon: '😎' },
    { value: 'EXCELLENT' as const, label: 'ممتاز', desc: 'محترف', icon: '🔥' },
    { value: 'LEGENDARY' as const, label: 'أسطوري', desc: 'خبير', icon: '👑' }
  ]

  const passwordStrength = passwordChecks.filter(check => check.check).length
  const strengthPercentage = (passwordStrength / 2) * 100
  const strengthColor = passwordStrength <= 1 ? 'red' : 'green'
  const strengthText = passwordStrength <= 1 ? 'ضعيفة' : 'جيدة'

  const selectedSkill = skillLevels.find(level => level.value === skillLevel)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/4 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Welcome & Features */}
          <div className="lg:w-2/5 flex flex-col justify-center text-white p-6 lg:p-12">
            <div className="mb-12">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    مرحباً بك
                  </h1>
                  <p className="text-2xl font-semibold text-gray-300 mt-2">في عالم الألعاب</p>
                </div>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                انضم إلى آلاف اللاعبين المحترفين وابدأ رحلتك نحو التميز. 
                أنشئ ملفك الشخصي واكتشف عالماً من التحديات والإنجازات.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Feature 1 */}
              <div className="bg-gradient-to-r from-white/5 to-white/0 p-6 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-xl">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">تسجيل سهل</h3>
                    <p className="text-gray-400 mt-1">تسجيل بسيط بدون تعقيدات</p>
                  </div>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-gradient-to-r from-white/5 to-white/0 p-6 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/30 to-purple-600/30 rounded-xl">
                    <Target className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">تحديات مناسبة</h3>
                    <p className="text-gray-400 mt-1">تحديات تلائم مستواك وتطور مهاراتك</p>
                  </div>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-gradient-to-r from-white/5 to-white/0 p-6 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500/30 to-green-600/30 rounded-xl">
                    <Trophy className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">انجازات وجوائز</h3>
                    <p className="text-gray-400 mt-1">احصل على مكافآت وتقدم في المراتب</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-gray-400 mt-1">لاعب نشط</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm text-gray-400 mt-1">تحدي يومي</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-white">99%</div>
                <div className="text-sm text-gray-400 mt-1">رضا عملاء</div>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="lg:w-3/5">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
              {/* Form Header */}
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white">إنشاء حساب جديد</h2>
                    <p className="text-gray-300 mt-2">املأ المعلومات لبدء رحلتك</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-300">نظام آمن</span>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                {error && (
                  <Alert 
                    type="error" 
                    title="خطأ في التسجيل" 
                    message={error} 
                    className="mb-6 animate-in slide-in-from-top duration-300"
                  />
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">المعلومات الشخصية</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="الاسم الكامل"
                        type="text"
                        placeholder="أحمد محمد"
                        error={errors.name?.message}
                        icon={<User className="w-5 h-5" />}
                        {...register('name')}
                        disabled={isLoading}
                      />

                      <Input
                        label="البريد الإلكتروني"
                        type="email"
                        placeholder="ahmed@example.com"
                        error={errors.email?.message}
                        icon={<Mail className="w-5 h-5" />}
                        {...register('email')}
                        disabled={isLoading}
                      />

                      <Input
                        label="رقم الهاتف"
                        type="tel"
                        placeholder="+20 100 000 0000"
                        error={errors.phoneNumber?.message}
                        icon={<Phone className="w-5 h-5" />}
                        {...register('phoneNumber')}
                        disabled={isLoading}
                      />

                      <Input
                        label="العمر"
                        type="number"
                        placeholder="25"
                        min="13"
                        max="100"
                        error={errors.age?.message}
                        icon={<Calendar className="w-5 h-5" />}
                        {...register('age', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Lock className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">كلمة المرور</h3>
                      <span className="text-sm text-gray-400">(سياسة بسيطة - 6 أحرف على الأقل)</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="كلمة المرور"
                        type="password"
                        placeholder="••••••••"
                        error={errors.password?.message}
                        icon={<Lock className="w-5 h-5" />}
                        {...register('password')}
                        disabled={isLoading}
                      />

                      <Input
                        label="تأكيد كلمة المرور"
                        type="password"
                        placeholder="••••••••"
                        error={errors.confirmPassword?.message}
                        icon={<Lock className="w-5 h-5" />}
                        {...register('confirmPassword')}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Password Strength */}
                    {password && (
                      <div className="mt-6 p-5 bg-gradient-to-r from-white/5 to-white/0 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-white" />
                            <span className="text-white font-medium">قوة كلمة المرور</span>
                          </div>
                          <span className={cn(
                            "text-sm font-semibold",
                            strengthColor === 'red' ? 'text-red-400' : 'text-green-400'
                          )}>
                            {strengthText}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                strengthColor === 'red' ? 'bg-red-500' : 'bg-green-500'
                              )}
                              style={{ width: `${strengthPercentage}%` }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {passwordChecks.map((check, index) => (
                              <div 
                                key={index}
                                className={cn(
                                  "flex items-center gap-2 text-xs p-2 rounded-lg transition-all duration-300",
                                  check.check 
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                    : 'bg-red-500/10 text-red-300 border border-red-500/20'
                                )}
                              >
                                {check.check ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <X className="w-3 h-3 text-red-400" />
                                )}
                                <span>{check.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Password Match Check */}
                        {password && confirmPassword && (
                          <div className="mt-4 p-3 rounded-lg bg-white/5">
                            <div className={cn(
                              "flex items-center gap-2 text-sm",
                              password === confirmPassword 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            )}>
                              {password === confirmPassword ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              <span>
                                {password === confirmPassword 
                                  ? 'كلمات المرور متطابقة' 
                                  : 'كلمات المرور غير متطابقة'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Skill Level */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Star className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">مستوى المهارة</h3>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-300 text-sm">
                        اختر مستوى مهارتك الحالي لتلائمك التحديات المناسبة
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {skillLevels.map((level) => (
                        <button
                          type="button"
                          key={level.value}
                          onClick={() => {
                            setSkillLevel(level.value)
                            setValue('skillLevel', level.value)
                          }}
                          className={cn(
                            "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300",
                            "transform hover:scale-105 active:scale-95",
                            skillLevel === level.value 
                              ? 'border-white shadow-lg scale-105 bg-gradient-to-br from-orange-500/30 to-orange-600/30' 
                              : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                          )}
                        >
                          <div className="text-2xl mb-2">{level.icon}</div>
                          <div className="text-sm font-semibold text-white">{level.label}</div>
                          <div className="text-xs text-white/70 mt-1">{level.desc}</div>
                        </button>
                      ))}
                    </div>
                    
                    {selectedSkill && skillLevel === selectedSkill.value && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-white/5 to-white/0 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <span className="text-xl">{selectedSkill.icon}</span>
                          </div>
                          <div>
                            <h4 className="text-white font-medium">مستوى {selectedSkill.label}</h4>
                            <p className="text-gray-300 text-sm mt-1">
                              {selectedSkill.desc} - ستتلقى تحديات مناسبة لمستواك
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {errors.skillLevel?.message && (
                      <p className="text-sm text-red-400 mt-3">{errors.skillLevel.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-pink-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">الوصف الشخصي</h3>
                        <p className="text-gray-300 text-sm">(اختياري) شاركنا شيئاً عن نفسك</p>
                      </div>
                    </div>
                    
                    <textarea
                      placeholder="أخبرنا عن نفسك، هواياتك، اهتماماتك، ومهاراتك في الألعاب..."
                      rows={3}
                      maxLength={500}
                      {...register('description')}
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl
                               text-white placeholder-gray-400 focus:outline-none 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-all resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-400">
                        {description?.length || 0} / 500 حرف
                      </div>
                      <div className={cn(
                        "text-xs font-medium",
                        (description?.length || 0) >= 450 
                          ? 'text-orange-400 animate-pulse' 
                          : 'text-gray-400'
                      )}>
                        {description && description.length >= 450 && 'اقتربت من الحد الأقصى'}
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="p-5 bg-gradient-to-r from-white/5 to-white/0 rounded-xl border border-white/10">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 w-5 h-5 rounded border-white/30 bg-white/10 
                                 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        required
                      />
                      <div>
                        <label htmlFor="terms" className="text-gray-300 text-sm leading-relaxed">
                          أنا أوافق على جميع{' '}
                          <Link 
                            href="/terms" 
                            className="text-blue-400 hover:text-blue-300 underline hover:no-underline font-medium"
                          >
                            الشروط والأحكام
                          </Link>{' '}
                          و{' '}
                          <Link 
                            href="/privacy" 
                            className="text-blue-400 hover:text-blue-300 underline hover:no-underline font-medium"
                          >
                            سياسة الخصوصية
                          </Link>{' '}
                          الخاصة بالمنصة. أقر بأن جميع البيانات التي قدمتها صحيحة وأتحمل المسؤولية الكاملة عنها.
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                             hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 
                             text-white font-bold text-lg rounded-xl shadow-2xl
                             transform hover:-translate-y-1 active:translate-y-0
                             transition-all duration-300"
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري إنشاء الحساب...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        إنشاء حسابي والبدء
                      </span>
                    )}
                  </Button>
                </form>

                {/* Login Link */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-center text-gray-300 text-sm">
                    لديك حساب بالفعل؟{' '}
                    <Link
                      href="/login"
                      className="font-bold text-blue-400 hover:text-blue-300 
                               underline hover:no-underline transition-all duration-300
                               hover:tracking-wider"
                    >
                      تسجيل الدخول
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}