// prisma/seed.ts
import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// =======================
// Helpers
// =======================
function generateSlotsForDays(
  opening: Date,
  closing: Date,
  durationMin: number,
  days: number
) {
  const slots: { startTime: Date; endTime: Date }[] = []

  for (let d = 0; d < days; d++) {
    const start = new Date(opening)
    start.setDate(start.getDate() + d)

    const end = new Date(closing)
    end.setDate(end.getDate() + d)

    if (end <= start) {
      end.setDate(end.getDate() + 1)
    }

    let cursor = new Date(start)

    while (cursor < end) {
      const slotStart = new Date(cursor)
      const slotEnd = new Date(cursor.getTime() + durationMin * 60000)

      if (slotEnd > end) break

      slots.push({ startTime: slotStart, endTime: slotEnd })
      cursor = slotEnd
    }
  }

  return slots
}

// =======================
// Seed
// =======================
async function main() {
  console.log('🌱 Starting database seeding...')

  // 1️⃣ Clear data (order مهم)
  await prisma.auditLog.deleteMany()
  await prisma.slot.deleteMany()
  await prisma.field.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleared existing data')

  // 2️⃣ Users
  const hashedPassword = await bcrypt.hash('Password123!', 10)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Player User',
        email: 'player@example.com',
        passwordHash: hashedPassword,
        role: 'PLAYER',
        isVerified: true,
        isActive: true,
        phoneNumber: '01000000000',
        age: 25
      }
    }),
    prisma.user.create({
      data: {
        name: 'Stadium Owner',
        email: 'owner@example.com',
        passwordHash: hashedPassword,
        role: 'OWNER',
        isVerified: true,
        isActive: true,
        phoneNumber: '01000000001',
        age: 30
      }
    }),
    prisma.user.create({
      data: {
        name: 'Employee User',
        email: 'employee@example.com',
        passwordHash: hashedPassword,
        role: 'EMPLOYEE',
        isVerified: true,
        isActive: true,
        phoneNumber: '01000000002',
        age: 28
      }
    }),
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        phoneNumber: '01000000003',
        age: 35
      }
    })
  ])

  const adminUser = users.find(u => u.role === 'ADMIN')!

  console.log('✅ Users created')

  // 3️⃣ Fields
  const today = new Date()

  const fields = await Promise.all([
    prisma.field.create({
      data: {
        name: 'ملعب النصر الخماسي',
        description: 'ملعب عشب صناعي عالي الجودة مع إضاءة ليلية',
        location: 'المقطم',
        type: 'FOOTBALL',
        pricePerHour: 300,
        depositPrice: 100,
        openingTime: new Date(today.setHours(8, 0, 0, 0)),
        closingTime: new Date(today.setHours(23, 0, 0, 0)),
        slotDurationMin: 60,
        facilities: ['إضاءة ليلية', 'تغيير ملابس', 'باركينج', 'كافتيريا'],
        imageUrl: '/images/fields/football1.jpg'
      }
    }),
    prisma.field.create({
      data: {
        name: 'ملعب الأهلي الأخضر',
        description: 'ملعب حديث بتقنية أوروبية',
        location: 'الهضبة',
        type: 'FOOTBALL',
        pricePerHour: 350,
        depositPrice: 150,
        openingTime: new Date(today.setHours(9, 0, 0, 0)),
        closingTime: new Date(today.setHours(23, 59, 0, 0)),
        slotDurationMin: 90,
        facilities: ['تغيير ملابس', 'دش', 'باركينج', 'إضاءة LED'],
        imageUrl: '/images/fields/football2.jpg'
      }
    }),
    prisma.field.create({
      data: {
        name: 'نادي البادل الذهبي',
        description: 'أحدث ملاعب البادل بمواصفات عالمية',
        location: 'التجمع الخامس',
        type: 'PADEL',
        pricePerHour: 250,
        depositPrice: 80,
        openingTime: new Date(today.setHours(7, 0, 0, 0)),
        closingTime: new Date(today.setHours(22, 0, 0, 0)),
        slotDurationMin: 60,
        facilities: ['تكييف', 'كافتيريا', 'مدرب', 'معدات'],
        imageUrl: '/images/fields/padel1.jpg'
      }
    })
  ])

  console.log('🏟️ Fields created')

  // 4️⃣ Slots (7 أيام)
  for (const field of fields) {
    const slots = generateSlotsForDays(
      field.openingTime,
      field.closingTime,
      field.slotDurationMin,
      7
    )

    await prisma.slot.createMany({
      data: slots.map(s => ({
        fieldId: field.id,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    })
  }

  console.log('⏰ Slots generated')

  // 5️⃣ Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'REGISTER',
        entityType: 'USER',
        entityId: adminUser.id,
        oldValue: null,
        newValue: { email: adminUser.email, role: adminUser.role },
        ipAddress: '127.0.0.1',
        userAgent: 'Seeder'
      },
      {
        userId: adminUser.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: adminUser.id,
        oldValue: null,
        newValue: { timestamp: new Date().toISOString() },
        ipAddress: '127.0.0.1',
        userAgent: 'Seeder'
      }
    ]
  })

  console.log('📝 Audit logs created')
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
