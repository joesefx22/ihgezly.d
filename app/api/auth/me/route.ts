// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/auth/responses'
import { withAudit } from '@/lib/auth/security'

export const GET = withAudit(async (request: NextRequest) => {
  const userId = request.cookies.get('accessToken')?.value

  if (!userId) {
    return NextResponse.json(
      errorResponse('Not authenticated', 'AUTHENTICATION_ERROR'),
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      phoneNumber: true,
      age: true,
      description: true,
      skillLevel: true
    }
  })

  if (!user) {
    return NextResponse.json(
      errorResponse('User not found', 'NOT_FOUND'),
      { status: 404 }
    )
  }

  return NextResponse.json(
    successResponse('User data retrieved', user)
  )
}, 'GET_USER_INFO', 'USER')
