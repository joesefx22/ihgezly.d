// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/infrastructure/auth/auth-options'  // ✅ المسار الجديد

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }