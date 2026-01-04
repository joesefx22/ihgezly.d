// lib/domain/booking/types.ts
import { 
  SlotStatus, 
  BookingStatus, 
  PaymentStatus 
} from '@/lib/shared/constants'  // ✅ المسار الجديد

export interface BookingCreateInput {
  slotId: string
  fieldId: string
  userId: string
  idempotencyKey?: string
}

export interface BookingCreateResult {
  bookingId: string
  needsConfirmation: boolean
  idempotencyKey?: string
}

export interface BookingUpdateInput {
  bookingId: string
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  paymentId?: string
  orderId?: string
}

export interface PaymentInitInput {
  bookingId: string
  amount: number
  currency?: string
  idempotencyKey?: string
}

export interface PaymentInitResult {
  paymentUrl: string
  orderId: string
  idempotencyKey?: string
}

export interface SlotLockInput {
  slotId: string
  userId: string
  fieldId: string
}

export interface SlotLockResult {
  success: boolean
  locked?: boolean
  extended?: boolean
  lockedUntil?: Date
}

// Response types for APIs
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// Webhook types
export interface PaymobWebhookPayload {
  obj: {
    id: number
    amount_cents: number
    success: boolean
    order: {
      id: number
      merchant_order_id: string
    }
    created_at: number
    currency: string
    source_data?: any
  }
}

export type BookingWithRelations = any // سيحدد من Prisma
export type SlotWithRelations = any