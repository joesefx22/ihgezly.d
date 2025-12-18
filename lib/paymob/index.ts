// lib/paymob/index.ts
import axios from 'axios'

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api'

export class PaymobService {
  private apiKey: string
  private integrationId: string
  private hmacSecret: string

  constructor() {
    this.apiKey = process.env.PAYMOB_API_KEY!
    this.integrationId = process.env.PAYMOB_INTEGRATION_ID!
    this.hmacSecret = process.env.PAYMOB_HMAC_SECRET!
  }

  // 1. الحصول على Authentication Token
  async getAuthToken(): Promise<string> {
    try {
      const response = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
        api_key: this.apiKey
      })
      
      return response.data.token
    } catch (error) {
      console.error('Error getting auth token:', error)
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
  }) {
    try {
      const authToken = await this.getAuthToken()
      
      const response = await axios.post(
        `${PAYMOB_BASE_URL}/ecommerce/orders`,
        {
          auth_token: authToken,
          delivery_needed: 'false',
          amount_cents: amount * 100, // تحويل لـ cents
          currency,
          items: [],
          merchant_order_id: bookingId
        }
      )

      return response.data
    } catch (error) {
      console.error('Error creating order:', error)
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
    orderId: string
    amount: number
    billingData: any
    bookingId: string
  }) {
    try {
      const authToken = await this.getAuthToken()
      
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
        }
      )

      return response.data.token
    } catch (error) {
      console.error('Error getting payment key:', error)
      throw error
    }
  }

  // 4. التحقق من صحة الـ HMAC (لـ Webhook)
  verifyHMAC(data: any, receivedHMAC: string): boolean {
    const { amount_cents, created_at, currency, error_occured, has_parent_transaction, 
            id, integration_id, is_3d_secure, is_auth, is_capture, is_refunded, 
            is_standalone_payment, is_voided, order: { id: order_id }, owner, 
            pending, source_data: { pan, sub_type, type }, success } = data

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
      order_id + 
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

    return calculatedHMAC === receivedHMAC
  }
}

export const paymob = new PaymobService()
