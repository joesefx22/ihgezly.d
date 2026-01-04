// lib/infrastructure/auth/errors.ts
import { z } from 'zod'
import { authLogger } from '@/lib/shared/logger'  // ✅ استخدم الـ logger الجديد

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errorCode?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    authLogger.error(`AppError: ${message}`, { statusCode, errorCode, details })
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT')
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Token has expired') {
    super(message, 401, 'TOKEN_EXPIRED')
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = 'Invalid token') {
    super(message, 401, 'INVALID_TOKEN')
  }
}

// Error handler
export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof z.ZodError) {
    return new ValidationError(
      'Validation failed',
      error.issues.map((e: z.ZodIssue) => ({
        path: e.path.join('.'),
        message: e.message
      }))
    )
  }
  
  authLogger.error('Unexpected error', error)
  
  return new AppError(
    'An unexpected error occurred',
    500,
    'INTERNAL_SERVER_ERROR'
  )
}