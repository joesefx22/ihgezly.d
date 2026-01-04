// lib/shared/helpers/api-auth.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/infrastructure/auth/auth-options'

/**
 * =========================
 * Custom Auth Errors
 * =========================
 */

export class AuthError extends Error {
  status: number
  code: string

  constructor(
    message: string = 'غير مصرح',
    status: number = 401,
    code: string = 'UNAUTHORIZED'
  ) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.code = code
  }
}

export class PermissionError extends Error {
  status = 403
  code = 'FORBIDDEN'

  constructor(message: string = 'صلاحية غير كافية') {
    super(message)
    this.name = 'PermissionError'
  }
}

export class AccountError extends Error {
  status = 403
  code = 'ACCOUNT_INACTIVE'

  constructor(message: string = 'الحساب غير نشط') {
    super(message)
    this.name = 'AccountError'
  }
}

/**
 * =========================
 * Core Guards
 * =========================
 */

// لازم يكون عامل Login
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new AuthError()
  }

  return session
}

// لازم يكون Role معين
export function requireRole(
  session: Awaited<ReturnType<typeof requireAuth>>,
  allowedRoles: string[]
) {
  if (!allowedRoles.includes(session.user.role)) {
    throw new PermissionError()
  }
}

// الحساب لازم يكون Active
export function requireActiveAccount(
  session: Awaited<ReturnType<typeof requireAuth>>
) {
  if (session.user.isActive === false) {
    throw new AccountError()
  }
}

/**
 * =========================
 * Optional helper (API only)
 * =========================
 */

export async function getSessionForAPI() {
  return getServerSession(authOptions)
}
