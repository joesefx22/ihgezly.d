// lib/application/idempotency/idempotency-guard.ts
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { addMinutes } from 'date-fns'
export class IdempotencyGuard {
  /**
   * 🔐 تأكد من أن العملية idempotent
   * @param key المفتاح الفريد
   * @param userId المستخدم
   * @param method اسم العملية
   * @param requestData بيانات الطلب (لتجنب نفس الطلب بمعطيات مختلفة)
   * @returns {idempotent: boolean, response?: any, shouldProceed: boolean}
   */
  static async check(
    key: string,
    userId: string,
    method: string,
    requestData?: any
  ): Promise<{
    idempotent: boolean
    response?: any
    shouldProceed: boolean
  }> {
    const now = new Date()
    
    // 1. تنظيف المفاتيح المنتهية
    await prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: now } }
    })

    // 2. البحث عن المفتاح
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key }
    })

    if (!existing) {
      return { idempotent: false, shouldProceed: true }
    }

    // 3. التحقق من المستخدم والطريقة
    if (existing.userId !== userId || existing.method !== method) {
      throw new Error('مفتاح idempotency غير صالح لهذا المستخدم أو العملية')
    }

    // 4. التحقق من requestHash إذا كان موجوداً
    if (requestData && existing.requestHash) {
      const currentHash = this.hashRequest(requestData)
      if (currentHash !== existing.requestHash) {
        throw new Error('طلب مكرر بمعطيات مختلفة')
      }
    }

    // 5. إذا كان هناك response مخزن
    if (existing.response) {
      return {
        idempotent: true,
        response: existing.response,
        shouldProceed: false
      }
    }

    // 6. المفتاح موجود ولكن بدون response (مازال يعمل)
    return { idempotent: true, shouldProceed: false }
  }

  /**
   * 💾 حفظ نتيجة idempotent
   */
  static async saveResponse(
    key: string,
    userId: string,
    method: string,
    response: any,
    requestData?: any,
    ttlMinutes: number = 60
  ) {
    return prisma.idempotencyKey.upsert({
      where: { key },
      update: {
        response,
        expiresAt: addMinutes(new Date(), ttlMinutes)
      },
      create: {
        key,
        userId,
        method,
        requestHash: requestData ? this.hashRequest(requestData) : null,
        response,
        expiresAt: addMinutes(new Date(), ttlMinutes)
      }
    })
  }

  /**
   * 🔢 توليد مفتاح آمن
   */
  static generateKey(prefix: string = 'req'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${prefix}_${timestamp}_${random}`
  }

  /**
   * 🔐 حساب هاش للطلب
   */
  private static hashRequest(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort())
    // استخدام hash بسيط - يمكن استبداله بـ crypto
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }
}