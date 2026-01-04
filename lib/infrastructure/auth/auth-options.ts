// lib/infrastructure/auth/auth-options.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { prisma } from '@/lib/infrastructure/database/prisma'  // ✅ المسار الجديد
import { comparePassword } from '@/lib/infrastructure/security/password'  // ✅ المسار الجديد
import { z } from 'zod'
import { authLogger } from '@/lib/shared/logger'  // ✅ Logger الجديد

// Rate Limiter
const loginRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60,
})

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
})

const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' }
      },
      async authorize(credentials) {
        try {
          await loginRateLimiter.consume(credentials?.email || 'unknown')
          
          const validated = loginSchema.parse(credentials)
          const normalizedEmail = normalizeEmail(validated.email)

          const user = await prisma.user.findUnique({
            where: { 
              email: normalizedEmail
            }
          })

          if (!user) {
            authLogger.warn('User not found', { email: normalizedEmail })
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
          }

          if (!user.isActive) {
            authLogger.warn('Inactive account attempt', { userId: user.id })
            throw new Error('الحساب غير نشط')
          }

          if (user.lockedUntil && user.lockedUntil > new Date()) {
            authLogger.warn('Locked account attempt', { userId: user.id })
            throw new Error('الحساب مؤقت مغلق، حاول لاحقاً')
          }

          if (!user.passwordHash) {
            authLogger.warn('No password hash for credentials login', { userId: user.id })
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
          }

          const isValid = await comparePassword(validated.password, user.passwordHash)
          
          if (!isValid) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: { increment: 1 },
                ...(user.loginAttempts + 1 >= 5 ? {
                  lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
                } : {})
              }
            })
            authLogger.warn('Invalid password attempt', { userId: user.id })
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: 0,
              lockedUntil: null,
              lastLogin: new Date()
            }
          })

          authLogger.info('User authenticated successfully', { userId: user.id })
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified
          }

        } catch (error: any) {
          if (error instanceof Error && error.message.includes('RateLimiter')) {
            authLogger.warn('Rate limit exceeded', { email: credentials?.email })
            throw new Error('لقد تجاوزت الحد المسموح به من المحاولات')
          }
          authLogger.error('Authentication error', error)
          throw new Error(error.message || 'فشل تسجيل الدخول')
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      async profile(profile) {
        const normalizedEmail = normalizeEmail(profile.email)
        
        const user = await prisma.user.upsert({
          where: { email: normalizedEmail },
          update: { 
            lastLogin: new Date(),
            name: profile.name
          },
          create: {
            email: normalizedEmail,
            name: profile.name,
            passwordHash: null,
            role: 'PLAYER',
            isActive: true,
            isVerified: true,
            lastLogin: new Date()
          }
        })

        if (!user.isActive) {
          authLogger.warn('Inactive OAuth account', { userId: user.id })
          throw new Error('الحساب غير نشط')
        }

        authLogger.info('OAuth user authenticated', { userId: user.id })
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.isActive = (user as any).isActive
        token.isVerified = (user as any).isVerified
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isActive = token.isActive as boolean
        session.user.isVerified = token.isVerified as boolean
      }
      return session
    }
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login'
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}