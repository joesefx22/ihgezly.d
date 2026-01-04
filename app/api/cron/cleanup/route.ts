// app/api/cron/cleanup/route.ts
import { NextResponse } from 'next/server'
import { bookingOrchestrator } from '@/lib/application/services/booking-orchestrator'  // ✅ المسار الجديد
import { ENV } from '@/lib/shared/env/env'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ استخدام الـ logger الجديد

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const jobId = `cron_cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.info('Starting cron cleanup job', { jobId })
    
    const authHeader = request.headers.get('authorization')
    
    if (authHeader !== `Bearer ${ENV.CRON_SECRET}`) {
      logger.warn('Unauthorized cron attempt', { jobId })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [expireResult, unlockResult] = await Promise.all([
      bookingOrchestrator.cleanupExpiredBookings(),
      bookingOrchestrator.cleanupExpiredLocks()
    ])

    logger.info('Cron cleanup completed', { 
      jobId,
      expiredBookings: expireResult.cleaned || 0,
      unlockedSlots: unlockResult.unlockedSlots || 0
    })
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        expireBookings: expireResult,
        unlockSlots: unlockResult
      }
    })
  } catch (error: any) {
    logger.error('Cron cleanup error', error, { jobId })
    return NextResponse.json(
      { 
        success: false,
        error: 'Cleanup failed', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}