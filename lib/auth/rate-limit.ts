// lib/rate-limit.ts
import { LRUCache } from 'lru-cache'
import { NextRequest } from 'next/server'
import { RateLimitError } from './errors'

interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
}

class RateLimiter {
  private cache = new LRUCache<string, number>({
    max: 10000,
    ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000')
  })

  private defaults: RateLimitConfig = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests, please try again later.'
  }

  private getKey(req: NextRequest, prefix: string = 'global'): string {
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    const path = req.nextUrl.pathname
    return `${prefix}:${ip}:${path}`
  }

  async check(
    req: NextRequest, 
    config?: Partial<RateLimitConfig>,
    prefix: string = 'global'
  ): Promise<void> {
    const finalConfig = { ...this.defaults, ...config }
    const key = this.getKey(req, prefix)
    
    const current = this.cache.get(key) || 0
    
    if (current >= finalConfig.max) {
      throw new RateLimitError(finalConfig.message)
    }
    
    this.cache.set(key, current + 1)
  }

  async checkForAuth(req: NextRequest, email: string): Promise<void> {
    const key = `auth:${email}`
    const config: RateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per 15 minutes
      message: 'Too many login attempts, please try again later.'
    }
    
    await this.check(req, config, key)
  }

  async checkForRegister(req: NextRequest, ip: string): Promise<void> {
    const key = `register:${ip}`
    const config: RateLimitConfig = {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registrations per hour per IP
      message: 'Too many registration attempts from this IP.'
    }
    
    await this.check(req, config, key)
  }
}

export const rateLimiter = new RateLimiter()
