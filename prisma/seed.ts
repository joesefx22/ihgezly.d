// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Helper: generate time slots
function generateSlots(opening: string, closing: string, durationMin: number) {
  const slots = []
  const [openH, openM] = opening.split(':').map(Number)
  const [closeH, closeM] = closing.split(':').map(Number)

  let start = new Date()
  start.setHours(openH, openM, 0, 0)

  let end = new Date()
  end.setHours(closeH, closeM, 0, 0)

  // لو وقت الإغلاق أقل من وقت الفتح → نزود يوم
  if (end <= start) {
    end.setDate(end.getDate() + 1)
  }

  while (start < end) {
    const slotStart = new Date(start)
    const slotEnd = new Date(start.getTime() + durationMin * 60000)

    if (slotEnd > end) break

    slots.push({
      startTime: slotStart,
      endTime: slotEnd
    })

    start = slotEnd
  }

  return slots
}

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Users
  const hashedPassword = await hash('password123', 12)

  const player = await prisma.user.create({
    data: {
      name: 'محمد أحمد',
      email: 'player@example.com',
      passwordHash: hashedPassword,
      role: 'PLAYER',
      phone: '01012345678'
    }
  })

  const employee = await prisma.user.create({
    data: {
      name: 'أحمد موظف',
      email: 'employee@example.com',
      passwordHash: hashedPassword,
      role: 'EMPLOYEE',
      phone: '01087654321'
    }
  })

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'ADMIN'
    }
  })

  // 2. Fields
  const fields = await Promise.all([
    prisma.field.create({
      data: {
        name: 'ملعب النصر الخماسي',
        description: 'ملعب عشب صناعي عالي الجودة مع إضاءة ليلية',
        location: 'المقطم',
        type: 'FOOTBALL',
        pricePerHour: 300,
        depositPrice: 100,
        openingTime: '08:00',
        closingTime: '23:00',
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
        openingTime: '09:00',
        closingTime: '23:59', // ✅ تعديل هنا
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
        openingTime: '07:00',
        closingTime: '22:00',
        slotDurationMin: 60,
        facilities: ['تكييف', 'كافتيريا', 'مدرب', 'معدات'],
        imageUrl: '/images/fields/padel1.jpg'
      }
    })
  ])

  // 3. Generate Slots for each field
  for (const field of fields) {
    const slots = generateSlots(field.openingTime, field.closingTime, field.slotDurationMin)

    await prisma.slot.createMany({
      data: slots.map(s => ({
        fieldId: field.id,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    })
  }

  // 4. Create a booking for testing
  const firstField = fields[0]

  const firstSlot = await prisma.slot.findFirst({
    where: { fieldId: firstField.id }
  })

  if (firstSlot) {
    const booking = await prisma.booking.create({
      data: {
        userId: player.id,
        fieldId: firstField.id,
        slotId: firstSlot.id,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: firstField.pricePerHour,
        depositPaid: firstField.depositPrice
      }
    })

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        status: 'PAID',
        currency: 'EGP'
      }
    })

    await prisma.notification.create({
      data: {
        userId: player.id,
        type: 'BOOKING_CONFIRMED',
        title: 'تم تأكيد الحجز',
        message: `تم تأكيد حجزك في ${firstField.name}.`,
        relatedId: booking.id
      }
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
