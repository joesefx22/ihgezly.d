// lib/infrastructure/payments/providers/hmac-verifier.ts
import crypto from 'crypto'
import { ENV } from '@/lib/shared/env/env'
import { paymentLogger } from '@/lib/shared/logger'

export class PaymobHmacVerifier {
  private readonly hmacSecret: string

  constructor() {
    this.hmacSecret = ENV.PAYMOB_HMAC_SECRET || ''
  }

  verify(data: any, receivedHmac: string): boolean {
    try {
      const orderedData = this.orderData(data)
      const dataString = JSON.stringify(orderedData)
      
      const calculatedHmac = crypto
        .createHmac('sha512', this.hmacSecret)
        .update(dataString)
        .digest('hex')
      
      const isValid = crypto.timingSafeEqual(
        Buffer.from(calculatedHmac, 'hex'),
        Buffer.from(receivedHmac, 'hex')
      )

      paymentLogger.info('HMAC verification completed', { 
        isValid,
        orderId: data.order?.id 
      })
      
      return isValid
    } catch (error: any) {
      paymentLogger.error('HMAC verification error', error)
      return false
    }
  }

  isFresh(timestamp: number, maxAgeSeconds: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000)
    const age = now - timestamp
    return age <= maxAgeSeconds && age >= 0
  }

  private orderData(data: any): any {
    const ordered: any = {}
    
    const fields = [
      'amount_cents',
      'created_at',
      'currency',
      'error_occured',
      'has_parent_transaction',
      'id',
      'integration_id',
      'is_3d_secure',
      'is_auth',
      'is_capture',
      'is_refunded',
      'is_standalone_payment',
      'is_voided',
      'order',
      'owner',
      'pending',
      'source_data',
      'success',
    ]

    fields.forEach(field => {
      if (data[field] !== undefined) {
        ordered[field] = data[field]
      }
    })
    
    return ordered
  }
}

export const paymobHmacVerifier = new PaymobHmacVerifier()