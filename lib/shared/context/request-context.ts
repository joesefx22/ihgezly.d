// lib/shared/context/request-context.ts
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from 'next-auth'
import { AsyncLocalStorage } from 'async_hooks'
import { authOptions } from '@/lib/infrastructure/auth/auth-options'  // ✅ المسار الجديد
import { logger } from '@/lib/shared/logger'  // ✅ المسار الجديد

export class RequestContext {
  private static storage = new AsyncLocalStorage<Map<string, any>>()

  static get<T>(key: string): T | undefined {
    return this.storage.getStore()?.get(key)
  }

  static set(key: string, value: any): void {
    const store = this.storage.getStore()
    if (store) {
      store.set(key, value)
    }
  }

  static run(context: Map<string, any>, callback: () => void): void {
    this.storage.run(context, callback)
  }

  // Helper methods
  static getRequestId(): string {
    return this.get('requestId') || 'unknown'
  }

  static getUserId(): string | undefined {
    return this.get('userId')
  }

  static getSessionId(): string | undefined {
    return this.get('sessionId')
  }
}

// Middleware لإضافة Context
export function withRequestContext(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const context = new Map<string, any>()
    
    // Generate request ID
    const requestId = uuidv4()
    context.set('requestId', requestId)
    
    // Extract user info from session
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        context.set('userId', session.user.id)
        context.set('sessionId', session.id)
      }
    } catch (error) {
      logger.warn('Failed to get session in request context', { error })
    }
    
    // Extract useful headers
    context.set('userAgent', req.headers.get('user-agent'))
    context.set('ip', req.ip || req.headers.get('x-forwarded-for') || 'unknown')
    context.set('path', req.nextUrl.pathname)
    context.set('method', req.method)
    
    // Run handler with context
    return RequestContext.run(context, async () => {
      // Log request start
      logger.info('Request started', {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        userId: RequestContext.getUserId()
      })
      
      const startTime = Date.now()
      
      try {
        const response = await handler(req)
        
        // Log successful request
        const duration = Date.now() - startTime
        logger.info('Request completed', {
          requestId,
          durationMs: duration,
          status: response.status,
          path: req.nextUrl.pathname,
          userId: RequestContext.getUserId()
        })
        
        // Add request ID to response headers
        response.headers.set('X-Request-ID', requestId)
        
        return response
      } catch (error) {
        // Log error
        const duration = Date.now() - startTime
        logger.error('Request failed', {
          requestId,
          durationMs: duration,
          path: req.nextUrl.pathname,
          userId: RequestContext.getUserId(),
          error: error instanceof Error ? error.message : String(error)
        })
        
        throw error
      }
    })
  }
}