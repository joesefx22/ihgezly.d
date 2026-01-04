// lib/shared/env/startup-check.ts
import { ENV } from './env'
import { logger } from '@/lib/shared/logger'  // ✅ المسار الجديد
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد

export async function startupCheck(): Promise<void> {
  logger.info('Starting application...')
  
  const checks = [
    { name: 'Environment', check: checkEnvironment },
    { name: 'Database', check: checkDatabase },
    { name: 'Paymob Config', check: checkPaymob },
  ]
  
  const results = await Promise.allSettled(
    checks.map(async ({ name, check }) => {
      try {
        await check()
        return { name, status: '✅' }
      } catch (error: any) {
        return { name, status: '❌', error: error.message }
      }
    })
  )
  
  console.log('\n📊 Startup Check Results:')
  console.log('========================')
  
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      const value = result.value
      if (value.error) {
        console.log(`${value.status} ${value.name}: ${value.error}`)
      } else {
        console.log(`${value.status} ${value.name}`)
      }
    } else {
      console.log(`❌ Check failed`)
    }
  })
  
  console.log('========================\n')
  
  // Warn if not production ready
  if (ENV.NODE_ENV === 'production') {
    const missingForProduction = []
    
    if (!ENV.PAYMOB_API_KEY) missingForProduction.push('PAYMOB_API_KEY')
    if (!ENV.PAYMOB_HMAC_SECRET) missingForProduction.push('PAYMOB_HMAC_SECRET')
    if (!ENV.PAYMOB_INTEGRATION_ID) missingForProduction.push('PAYMOB_INTEGRATION_ID')
    
    if (missingForProduction.length > 0) {
      logger.warn('⚠️  Missing production configuration:', { missing: missingForProduction })
    }
  }
  
  logger.info('Startup check completed')
}

async function checkEnvironment(): Promise<void> {
  const required = ['NODE_ENV', 'DATABASE_URL', 'NEXTAUTH_URL']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}

async function checkDatabase(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`
    logger.info('Database connection successful')
  } catch (error: any) {
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

async function checkPaymob(): Promise<void> {
  if (ENV.NODE_ENV === 'production') {
    const required = ['PAYMOB_API_KEY', 'PAYMOB_HMAC_SECRET', 'PAYMOB_INTEGRATION_ID']
    const missing = required.filter(key => !ENV[key as keyof typeof ENV])
    
    if (missing.length > 0) {
      throw new Error(`Missing Paymob configuration: ${missing.join(', ')}`)
    }
    logger.info('Paymob configuration is ready for production')
  } else {
    logger.info('Paymob configuration check skipped (development)')
  }
}