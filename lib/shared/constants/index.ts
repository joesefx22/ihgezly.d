// lib/shared/constants/index.ts
// === حالة السلات (Slots) ===
export const SLOT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  TEMP_LOCKED: 'TEMP_LOCKED',
  BOOKED: 'BOOKED',
  UNAVAILABLE: 'UNAVAILABLE',
  AVAILABLE_NEEDS_CONFIRM: 'AVAILABLE_NEEDS_CONFIRM'
} as const

// === حالة الحجوزات (Bookings) ===
export const BOOKING_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED'
} as const

// === حالة المدفوعات (Payments) ===
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED'
} as const

// === حالة الملاعب (Fields) ===
export const FIELD_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  MAINTENANCE: 'MAINTENANCE'
} as const

// === أنواع الملاعب ===
export const FIELD_TYPES = {
  FOOTBALL: 'FOOTBALL',
  PADEL: 'PADEL',
  TENNIS: 'TENNIS',
  BASKETBALL: 'BASKETBALL'
} as const

// === أنواع الإشعارات ===
export const NOTIFICATION_TYPE = {
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  SLOT_REMINDER: 'SLOT_REMINDER'
} as const

// === أنواع للمساعدة في TypeScript ===
export type SlotStatus = typeof SLOT_STATUS[keyof typeof SLOT_STATUS]
export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS]
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]
export type FieldStatus = typeof FIELD_STATUS[keyof typeof FIELD_STATUS]
export type FieldType = typeof FIELD_TYPES[keyof typeof FIELD_TYPES]
export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE]