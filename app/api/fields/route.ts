// app/api/fields/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const location = searchParams.get('location')

    const where: any = {
      status: 'OPEN'
    }

    if (type) {
      where.type = type.toUpperCase()
    }

    if (location && location !== 'الكل') {
      where.location = location
    }

    const fields = await prisma.field.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ fields })
  } catch (error) {
    console.error('Error fetching fields:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الملاعب' },
      { status: 500 }
    )
  }
}
