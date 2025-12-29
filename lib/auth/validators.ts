// lib/auth/validators.ts
import { z } from 'zod'

// Base schemas
export const emailSchema = z.string()
  .email('البريد الإلكتروني غير صالح')
  .min(1, 'البريد الإلكتروني مطلوب')
  .max(100, 'البريد الإلكتروني طويل جداً')

export const passwordSchema = z.string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .max(100, 'كلمة المرور طويلة جداً')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
  .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل')
  .regex(/[^A-Za-z0-9]/, 'يجب أن تحتوي على رمز خاص واحد على الأقل')

export const nameSchema = z.string()
  .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
  .max(100, 'الاسم طويل جداً')
  .regex(/^[a-zA-Z\u0600-\u06FF\s]*$/, 'الاسم يمكن أن يحتوي فقط على أحرف ومسافات')

export const phoneSchema = z.string()
  .min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل')
  .max(15, 'رقم الهاتف طويل جداً')
  .regex(/^[0-9+\-\s()]*$/, 'رقم الهاتف غير صالح')

export const ageSchema = z.number()
  .min(13, 'العمر يجب أن يكون 13 سنة على الأقل')
  .max(100, 'العمر يجب أن يكون 100 سنة على الأكثر')

export const skillLevelSchema = z.enum(['WEAK', 'AVERAGE', 'GOOD', 'EXCELLENT', 'LEGENDARY'])

// Complete schemas
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phoneNumber: phoneSchema,
  age: ageSchema,
  description: z.string().max(500, 'الوصف طويل جداً (500 حرف كحد أقصى)').optional(),
  skillLevel: skillLevelSchema // إزالة .default()
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"]
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة')
})

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phoneNumber: phoneSchema.optional(),
  age: ageSchema.optional(),
  description: z.string().max(500).optional(),
  skillLevel: skillLevelSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "يجب تقديم حقل واحد على الأقل"
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"]
})

// Type inference
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Helper type for forms
export type RegisterFormInput = RegisterInput & {
  skillLevel: 'WEAK' | 'AVERAGE' | 'GOOD' | 'EXCELLENT' | 'LEGENDARY'
}