'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/loadingspinner'

type Role = "PLAYER" | "OWNER" | "EMPLOYEE" | "ADMIN"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(redirectTo)
    } else if (
      status === 'authenticated' &&
      requiredRole &&
      session?.user?.role !== requiredRole
    ) {
      const rolePaths: Record<Role, string> = {
        PLAYER: '/dashboard/player',
        OWNER: '/dashboard/owner',
        EMPLOYEE: '/dashboard/employee',
        ADMIN: '/dashboard/admin'
      }

      const redirectPath = rolePaths[session?.user?.role ?? 'PLAYER']
      router.push(redirectPath)
    }
  }, [status, session, requiredRole, router, redirectTo])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (requiredRole && session?.user?.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}
