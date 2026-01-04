// lib/core/types/index.ts
import { 
  SLOT_STATUS, 
  BOOKING_STATUS, 
  FIELD_STATUS, 
  FIELD_TYPES,
  PAYMENT_STATUS 
} from '@/lib/shared/constants'  // ✅ مسار صحيح

export type SlotStatus = typeof SLOT_STATUS[keyof typeof SLOT_STATUS]
export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS]
export type FieldStatus = typeof FIELD_STATUS[keyof typeof FIELD_STATUS]
export type FieldType = typeof FIELD_TYPES[keyof typeof FIELD_TYPES]
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  createdAt: Date
}

export interface Field {
  id: string
  name: string
  description: string
  location: string
  address: string
  pricePerHour: number
  depositPrice: number
  imageUrl: string
  gallery: string[]
  type: FieldType
  status: FieldStatus
  openingTime: string // "08:00"
  closingTime: string // "22:00"
  slotDurationMin: number
  facilities: string[]
  rules: string[]
  rating: number
  reviewCount: number
  createdAt: Date
}

export interface Slot {
  id: string
  fieldId: string
  startTime: Date
  endTime: Date
  status: SlotStatus
  price: number
  deposit: number
  lockedUntil?: Date
  lockedByUserId?: string
}

export interface Booking {
  id: string
  userId: string
  fieldId: string
  slotId: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  depositPaid: number
  refundableUntil?: Date
  cancellationReason?: string
  createdAt: Date
  updatedAt: Date
  field?: Field
  slot?: Slot
  user?: User
}

export interface Payment {
  id: string
  bookingId: string
  amount: number
  currency: string
  paymentId: string
  orderId: string
  status: PaymentStatus
  metadata?: Record<string, any>
  createdAt: Date
}