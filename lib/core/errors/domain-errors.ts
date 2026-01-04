// lib/core/errors/domain-errors.ts
import { ERROR_CODES } from './error-codes'

const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  // Auth
  UNAUTHORIZED: 'غير مصرح',
  INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
  SESSION_EXPIRED: 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى',
  
  // Validation
  INVALID_INPUT: 'بيانات غير صالحة',
  MISSING_FIELD: 'حقل مطلوب',
  INVALID_DATE: 'تاريخ غير صالح',
  
  // Slot
  SLOT_NOT_FOUND: 'الموعد غير موجود',
  SLOT_UNAVAILABLE: 'الموعد غير متاح للحجز',
  SLOT_LOCKED_BY_OTHER: 'الموعد مقفول مؤقتاً',
  SLOT_LOCK_EXPIRED: 'انتهت صلاحية القفل',
  SLOT_ALREADY_BOOKED: 'الموعد محجوز بالفعل',
  SLOT_CANNOT_BE_LOCKED: 'لا يمكن قفل هذا الموعد',
  
  // Booking
  BOOKING_NOT_FOUND: 'الحجز غير موجود',
  BOOKING_NOT_OWNED: 'غير مصرح بالوصول لهذا الحجز',
  BOOKING_INVALID_STATE: 'الحالة الحالية لا تسمح بهذه العملية',
  BOOKING_LIMIT_EXCEEDED: 'وصلت للحد الأقصى للحجز',
  BOOKING_EXPIRED: 'انتهت صلاحية الحجز',
  BOOKING_IN_PROGRESS: 'جاري معالجة الطلب',
  
  // Payment
  PAYMENT_ALREADY_PROCESSED: 'تم دفع هذا الحجز مسبقاً',
  PAYMENT_FAILED: 'فشل عملية الدفع',
  DUPLICATE_PAYMENT: 'تم استخدام orderId مسبقاً',
  PAYMENT_NOT_FOUND: 'عملية الدفع غير موجودة',
  
  // Time
  TIME_IN_PAST: 'لا يمكن حجز وقت مضى',
  TIME_TOO_CLOSE: 'الوقت قريب جداً',
  
  // Field
  FIELD_NOT_FOUND: 'الملعب غير موجود',
  FIELD_CLOSED: 'الملعب مغلق حالياً',
  FIELD_MAINTENANCE: 'الملعب تحت الصيانة',
  
  // System
  INTERNAL_ERROR: 'حدث خطأ غير متوقع',
  RATE_LIMITED: 'تم تجاوز الحد المسموح',
  SERVICE_UNAVAILABLE: 'الخدمة غير متاحة حالياً'
}

export class DomainError extends Error {
  constructor(
    public code: keyof typeof ERROR_CODES,
    public override message?: string,
    public details?: any
  ) {
    super(message || ERROR_MESSAGES[code])
    this.name = 'DomainError'
  }
  
  toResponse() {
    return {
      error: true,
      code: ERROR_CODES[this.code],
      message: this.message || ERROR_MESSAGES[this.code],
      details: this.details
    }
  }
  
  toJSON() {
    return this.toResponse()
  }
}

// Helper function for API responses
export function errorResponse(error: unknown) {
  if (error instanceof DomainError) {
    return {
      status: getStatusCode(error.code),
      body: error.toResponse()
    }
  }
  
  console.error('Unhandled error:', error)
  
  return {
    status: 500,
    body: {
      error: true,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'حدث خطأ غير متوقع'
    }
  }
}

function getStatusCode(code: keyof typeof ERROR_CODES): number {
  const codePrefix = ERROR_CODES[code].split('_')[0]
  
  switch (codePrefix) {
    case 'AUTH':
      return 401
    case 'VAL':
      return 400
    case 'SLOT':
    case 'BOOK':
    case 'PAY':
    case 'TIME':
    case 'FIELD':
      return 400
    case 'SYS':
      return 500
    default:
      return 400
  }
}