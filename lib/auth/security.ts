// lib/auth/security.ts
import { NextRequest } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import crypto from 'crypto';
import { auditLog, logger } from './logger'; // ✅ المسار الصحيح الآن

// ==================== RATE LIMITING ====================
const rateLimiters: Record<string, RateLimiterMemory> = {};

const getRateLimiter = (keyPrefix: string, points: number, duration: number) => {
  if (!rateLimiters[keyPrefix]) {
    rateLimiters[keyPrefix] = new RateLimiterMemory({
      keyPrefix,
      points,
      duration,
      blockDuration: 15 * 60,
    });
  }
  return rateLimiters[keyPrefix];
};

// Rate limits configurations
const RATE_LIMITS = {
  LOGIN: { points: 5, duration: 15 * 60 },
  REGISTER: { points: 3, duration: 60 * 60 },
  API: { points: 100, duration: 15 * 60 },
  PAYMENT: { points: 10, duration: 5 * 60 },
  SENSITIVE: { points: 20, duration: 15 * 60 },
};

// ==================== SECURITY HEADERS ====================
export const securityHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };

  if (process.env.NODE_ENV === 'production') {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' ${appUrl} https://api.paymob.com https://secure.paymob.com;
      frame-src 'self' https://*.paymob.com;
      media-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    headers['Content-Security-Policy'] = csp;
  } else {
    headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval';";
  }

  return headers;
};

// ==================== CSRF PROTECTION ====================
export class CSRFProtection {
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static verifyToken(requestToken: string | null, sessionToken: string | null): boolean {
    if (!requestToken || !sessionToken) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(requestToken),
        Buffer.from(sessionToken)
      );
    } catch {
      return false;
    }
  }

  static async validateRequest(req: NextRequest): Promise<boolean> {
    const sessionToken = req.cookies.get('csrf-token')?.value;
    
    if (req.method === 'GET') return true;
    
    let requestToken = req.headers.get('x-csrf-token');
    
    if (!requestToken) {
      requestToken = await getTokenFromBody(req);
    }
    
    return this.verifyToken(requestToken, sessionToken || '');
  }
}

// ==================== INPUT SANITIZATION ====================
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/&#/g, '')
    .replace(/\\/g, '')
    .trim()
    .slice(0, 1000);
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
  }
  
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'admin123', 'welcome123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('كلمة المرور ضعيفة جداً');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ==================== IP & USER AGENT ====================
export const getClientIp = (req: NextRequest): string => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIp || 'unknown';
};

export const getUserAgent = (req: NextRequest): string => {
  return req.headers.get('user-agent') || 'unknown';
};

export const getLocationInfo = async (ip: string): Promise<string> => {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
    return 'local';
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`);
    const data = await response.json();
    return `${data.city || 'Unknown'}, ${data.country || 'Unknown'}`;
  } catch {
    return 'unknown';
  }
};

// ==================== RATE LIMITING FUNCTIONS ====================
export const checkRateLimit = async (
  identifier: string,
  type: keyof typeof RATE_LIMITS
): Promise<{
  allowed: boolean;
  remainingPoints?: number;
  msBeforeNext?: number;
}> => {
  try {
    const config = RATE_LIMITS[type];
    const rateLimiter = getRateLimiter(type, config.points, config.duration);
    
    const result = await rateLimiter.consume(identifier);
    
    return {
      allowed: true,
      remainingPoints: result.remainingPoints,
      msBeforeNext: result.msBeforeNext,
    };
  } catch (error: any) {
    return {
      allowed: false,
      remainingPoints: 0,
      msBeforeNext: error.msBeforeNext,
    };
  }
};

export const resetRateLimit = async (
  identifier: string,
  type: keyof typeof RATE_LIMITS
): Promise<void> => {
  try {
    const rateLimiter = getRateLimiter(type, RATE_LIMITS[type].points, RATE_LIMITS[type].duration);
    await rateLimiter.delete(identifier);
  } catch (error) {
    logger.error('RATE_LIMIT_RESET_ERROR', {
      identifier,
      type,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== SUSPICIOUS ACTIVITY DETECTION ====================
export const isSuspiciousRequest = (req: NextRequest): boolean => {
  const url = req.url.toLowerCase();
  const userAgent = getUserAgent(req).toLowerCase();
  const ip = getClientIp(req);
  
  const suspiciousPatterns = [
    /union.*select/i,
    /insert.*into/i,
    /drop.*table/i,
    /delete.*from/i,
    /update.*set/i,
    /or.*1=1/i,
    /'or'/i,
    /--/,
    /\/\*.*\*\//,
    /<script>/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /alert\(/i,
    /document\./i,
    /window\./i,
    /\.\.\//,
    /\.\.\\/,
    /etc\/passwd/,
    /win\.ini/,
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /metasploit/i,
    /burpsuite/i,
    /phpinfo/,
    /config\./,
    /\.env/,
    /\.git/,
    /\.DS_Store/,
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent)
  );
  
  if (isSuspicious) {
    auditLog(
      'SYSTEM',
      'SUSPICIOUS_REQUEST_DETECTED',
      'SECURITY',
      url,
      `Suspicious pattern detected from ${ip}`,
      { ip, userAgent, url },
      ip,
      userAgent
    );
  }
  
  return isSuspicious;
};

// ==================== AUDIT DECORATOR ====================
export const withAudit = <T extends any[], R>(
  handler: (req: NextRequest, ...args: T) => Promise<R>,
  action: string,
  entityType?: string
) => {
  return async (req: NextRequest, ...args: T): Promise<R> => {
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);
    const userId = req.headers.get('x-user-id') || 'anonymous';
    
    try {
      const result = await handler(req, ...args);
      
      auditLog(
        userId,
        `${action}_SUCCESS`,
        entityType,
        req.url,
        undefined,
        undefined,
        ipAddress,
        userAgent
      );
      
      return result;
    } catch (error: any) {
      auditLog(
        userId,
        `${action}_FAILED`,
        entityType,
        req.url,
        error.message,
        { error: error.message, stack: error.stack },
        ipAddress,
        userAgent
      );
      
      throw error;
    }
  };
};

// ==================== PASSWORD SECURITY ====================
export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  
  return `${salt}:${hash}`;
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  const [salt, originalHash] = hashedPassword.split(':');
  
  if (!salt || !originalHash) {
    return false;
  }
  
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(originalHash)
    );
  } catch {
    return false;
  }
};

// ==================== SESSION SECURITY ====================
export const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const validateSession = (sessionData: any): boolean => {
  if (!sessionData || !sessionData.createdAt) {
    return false;
  }
  
  const maxAge = 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(sessionData.createdAt).getTime();
  
  return sessionAge < maxAge;
};

// ==================== TOKEN SECURITY ====================
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const encryptData = (data: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
};

export const decryptData = (encryptedData: string, key: string): string => {
  const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// ==================== HELPER FUNCTIONS ====================
const getTokenFromBody = async (req: NextRequest): Promise<string | null> => {
  try {
    const cloneReq = req.clone();
    const body = await cloneReq.text();
    
    if (body) {
      try {
        const parsed = JSON.parse(body);
        return parsed._csrf || parsed.csrfToken || null;
      } catch {
        const formData = await req.formData();
        return formData.get('_csrf') as string || null;
      }
    }
  } catch {
    return null;
  }
  
  return null;
};

// Export everything
export default {
  securityHeaders,
  CSRFProtection,
  sanitizeInput,
  sanitizeObject,
  validateEmail,
  validatePassword,
  getClientIp,
  getUserAgent,
  getLocationInfo,
  checkRateLimit,
  resetRateLimit,
  isSuspiciousRequest,
  withAudit,
  hashPassword,
  verifyPassword,
  generateSessionId,
  validateSession,
  generateSecureToken,
  encryptData,
  decryptData,
};