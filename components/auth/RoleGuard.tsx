// components/auth/RoleGuard.tsx
'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/loadingspinner'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: ('PLAYER' | 'OWNER' | 'EMPLOYEE' | 'ADMIN')[]
  fallback?: ReactNode
  redirectTo?: string
}

export default function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  redirectTo = '/unauthorized'
}: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session?.user) {
    // Not authenticated, redirect to login
    router.push('/login')
    return null
  }

  if (!allowedRoles.includes(session.user.role as any)) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Redirect to unauthorized page or dashboard based on role
    const rolePaths = {
      PLAYER: '/dashboard/player',
      OWNER: '/dashboard/owner',
      EMPLOYEE: '/dashboard/employee',
      ADMIN: '/dashboard/admin'
    }
    
    const redirectPath = redirectTo === '/unauthorized' 
      ? rolePaths[session.user.role as keyof typeof rolePaths] || '/dashboard'
      : redirectTo
    
    router.push(redirectPath)
    return null
  }

  return <>{children}</>
}