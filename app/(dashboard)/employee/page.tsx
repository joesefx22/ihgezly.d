// app/(dashboard)/employee/page.tsx
'use client'

import { useAuth } from '@/context/authcontext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/app/(dashboard)/layout'

export default function EmployeeDashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p>Welcome, {user?.name}! You are an employee.</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
