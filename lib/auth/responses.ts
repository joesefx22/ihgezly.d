// lib/auth/responses.ts
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errorCode?: string
  details?: any
  timestamp: string
  path?: string
}

export const successResponse = <T>(
  message: string, 
  data?: T,
  path?: string
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
  path
})

export const errorResponse = (
  message: string,
  errorCode?: string,
  details?: any,
  path?: string
): ApiResponse => ({
  success: false,
  message,
  errorCode,
  details,
  timestamp: new Date().toISOString(),
  path
})

export const validationErrorResponse = (
  errors: any[],
  path?: string
): ApiResponse => ({
  success: false,
  message: 'Validation failed',
  errorCode: 'VALIDATION_ERROR',
  details: { errors },
  timestamp: new Date().toISOString(),
  path
})
