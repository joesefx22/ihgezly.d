// lib/infrastructure/payments/providers/paymob.ts
import axios from 'axios'
import { ENV } from '@/lib/shared/env/env'
import { paymentLogger } from '@/lib/shared/logger'

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api'

export interface PaymobOrder {
  id: number
  amount_cents: number
  currency: string
  merchant_order_id: string
}

export interface PaymobPaymentKey {
  token: string
  orderId: number
}

export interface PaymobBillingData {
  apartment?: string
  email: string
  floor?: string
  first_name: string
  street?: string
  building?: string
  phone_number: string
  shipping_method?: string
  postal_code?: string
  city?: string
  country?: string
  last_name?: string
  state?: string
}

export class PaymobService {
  private apiKey: string
  private integrationId: string
  private hmacSecret: string

  constructor() {
    this.apiKey = ENV.PAYMOB_API_KEY || ''
    this.integrationId = ENV.PAYMOB_INTEGRATION_ID || ''
    this.hmacSecret = ENV.PAYMOB_HMAC_SECRET || ''
  }

  // 1. الحصول على Authentication Token
  async getAuthToken(): Promise<string> {
    try {
      paymentLogger.info('Requesting Paymob auth token')
      
      const response = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
        api_key: this.apiKey
      })
      
      paymentLogger.info('Paymob auth token received')
      return response.data.token
    } catch (error: any) {
      paymentLogger.error('Error getting Paymob auth token', error)
      throw new Error('فشل في الاتصال بخدمة الدفع')
    }
  }

  // 2. إنشاء Order في Paymob
  async createOrder({
    amount,
    currency = 'EGP',
    bookingId,
    userId
  }: {
    amount: number
    currency?: string
    bookingId: string
    userId: string
  }): Promise<PaymobOrder> {
    try {
      const authToken = await this.getAuthToken()
      
      paymentLogger.info('Creating Paymob order', { bookingId, userId, amount })
      
      const response = await axios.post(
        `${PAYMOB_BASE_URL}/ecommerce/orders`,
        {
          auth_token: authToken,
          delivery_needed: 'false',
          amount_cents: amount * 100,
          currency,
          items: [],
          merchant_order_id: bookingId
        },
        { timeout: 10000 } // 10 seconds timeout
      )

      paymentLogger.info('Paymob order created', { 
        orderId: response.data.id,
        bookingId 
      })

      return response.data
    } catch (error: any) {
      paymentLogger.error('Error creating Paymob order', {
        error: error.message,
        bookingId,
        amount
      })
      throw error
    }
  }

  // 3. إنشاء Payment Key لفتح Iframe
  async getPaymentKey({
    orderId,
    amount,
    billingData,
    bookingId
  }: {
    orderId: string | number
    amount: number
    billingData: PaymobBillingData
    bookingId: string
  }): Promise<string> {
    try {
      const authToken = await this.getAuthToken()
      
      paymentLogger.info('Getting Paymob payment key', { orderId, bookingId })
      
      const response = await axios.post(
        `${PAYMOB_BASE_URL}/acceptance/payment_keys`,
        {
          auth_token: authToken,
          amount_cents: amount * 100,
          expiration: 3600, // ساعة واحدة
          order_id: orderId,
          billing_data: billingData,
          currency: 'EGP',
          integration_id: this.integrationId,
          lock_order_when_paid: 'false',
          extra: {
            booking_id: bookingId
          }
        },
        { timeout: 10000 }
      )

      paymentLogger.info('Paymob payment key received', { orderId })
      return response.data.token
    } catch (error: any) {
      paymentLogger.error('Error getting Paymob payment key', {
        error: error.message,
        orderId
      })
      throw error
    }
  }

  // 4. التحقق من صحة الـ HMAC (لـ Webhook)
  verifyHMAC(data: any, receivedHMAC: string): boolean {
    try {
      const { 
        amount_cents, created_at, currency, error_occured, has_parent_transaction, 
        id, integration_id, is_3d_secure, is_auth, is_capture, is_refunded, 
        is_standalone_payment, is_voided, order, owner, pending, source_data, success 
      } = data

      const orderId = order?.id || ''
      const pan = source_data?.pan || ''
      const sub_type = source_data?.sub_type || ''
      const type = source_data?.type || ''

      const stringToHash = 
        amount_cents + 
        created_at + 
        currency + 
        error_occured + 
        has_parent_transaction + 
        id + 
        integration_id + 
        is_3d_secure + 
        is_auth + 
        is_capture + 
        is_refunded + 
        is_standalone_payment + 
        is_voided + 
        orderId + 
        owner + 
        pending + 
        pan + 
        sub_type + 
        type + 
        success

      const crypto = require('crypto')
      const calculatedHMAC = crypto
        .createHmac('sha512', this.hmacSecret)
        .update(stringToHash)
        .digest('hex')

      const isValid = calculatedHMAC === receivedHMAC
      
      paymentLogger.info('HMAC verification', { 
        isValid,
        orderId: data.order?.id 
      })
      
      return isValid
    } catch (error: any) {
      paymentLogger.error('HMAC verification error', error)
      return false
    }
  }

  // 5. Mock mode للتنمية
  isMockMode(): boolean {
    return ENV.NODE_ENV !== 'production' || !this.apiKey
  }

  // 6. إنشاء order وهمي للتنمية
  async createMockOrder(params: {
    amount: number
    currency: string
    bookingId: string
  }): Promise<PaymobOrder> {
    paymentLogger.info('Creating mock Paymob order', params)
    
    return {
      id: Date.now(),
      amount_cents: params.amount * 100,
      currency: params.currency,
      merchant_order_id: params.bookingId
    }
  }

  // 7. مفتاح دفع وهمي للتنمية
  async getMockPaymentKey(params: {
    orderId: number
  }): Promise<string> {
    paymentLogger.info('Creating mock payment key', params)
    return `mock_token_${Date.now()}_${params.orderId}`
  }
}

export const paymobService = new PaymobService()