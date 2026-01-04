//lib/shared/env/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // === Database ===
  DATABASE_URL: z.string()
    .url()
    .refine(url => url.startsWith('postgresql://'), {
      message: 'DATABASE_URL must start with postgresql://'
    }),
  
  // === NextAuth ===
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // === Paymob ===
  PAYMOB_API_KEY: z.string().min(1).optional(),
  PAYMOB_HMAC_SECRET: z.string().min(1).optional(),
  PAYMOB_INTEGRATION_ID: z.string().min(1).optional(),
  PAYMOB_IFRAME_ID: z.string().optional(),
  
  // === Cron ===
  CRON_SECRET: z.string()
    .min(32, 'CRON_SECRET must be at least 32 characters')
    .default('dev-cron-secret-change-in-production'),
  
  // === App ===
  APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // === Logging ===
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error'])
    .default('info'),
  
  // === Email (Optional) ===
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
})

// Validate env
const env = envSchema.safeParse(process.env)

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.flatten().fieldErrors)
  
  // في production نوقف، في development نعطي defaults
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables')
  }
  
  console.warn('⚠️  Running with invalid environment variables')
}

export const ENV = env.success ? env.data : {
  NODE_ENV: 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  CRON_SECRET: process.env.CRON_SECRET || 'dev-cron-secret',
  LOG_LEVEL: 'debug',
}