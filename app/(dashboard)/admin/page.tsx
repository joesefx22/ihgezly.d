// app/(dashboard)/admin/page.tsx
'use client'

import { useAuth } from '@/context/authcontext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/app/(dashboard)/layout'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p>Welcome, {user?.name}! You have full system access.</p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/admin/users"
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-bold mb-2">👥 User Management</h3>
              <p>View and manage all system users</p>
            </Link>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-bold mb-2">📊 System Stats</h3>
              <p>View system analytics and reports</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
