// lib/shared/api/api-error-handler.ts
import { NextResponse } from 'next/server'
import { DomainError } from '@/lib/core/errors/domain-errors'
import { ERROR_CODES } from '@/lib/core/errors/error-codes'

export function apiErrorHandler(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Handle DomainError
  if (error instanceof DomainError) {
    const status = getHttpStatus(error.code)
    return NextResponse.json(
      {
        error: true,
        code: ERROR_CODES[error.code],
        message: error.message,
        details: error.details
      },
      { status }
    )
  }

  // Handle Zod validation errors
  if (error instanceof Error && error.name === 'ZodError') {
    return NextResponse.json(
      {
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'بيانات غير صالحة',
        details: error.message
      },
      { status: 400 }
    )
  }

  // Handle Prisma errors
  if (error instanceof Error && error.name.includes('Prisma')) {
    return NextResponse.json(
      {
        error: true,
        code: 'DATABASE_ERROR',
        message: 'حدث خطأ في قاعدة البيانات'
      },
      { status: 500 }
    )
  }

  // Default error
  return NextResponse.json(
    {
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'حدث خطأ غير متوقع'
    },
    { status: 500 }
  )
}

function getHttpStatus(errorCode: keyof typeof ERROR_CODES): number {
  const code = ERROR_CODES[errorCode]
  
  if (code.startsWith('AUTH')) return 401
  if (code.startsWith('VAL')) return 400
  if (code.startsWith('SLOT') || code.startsWith('BOOK') || code.startsWith('PAY')) return 400
  if (code.startsWith('FIELD')) return 404
  return 500
}