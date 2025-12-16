// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. إنشاء مستخدمين
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
  
  // 2. إنشاء ملاعب كرة قدم
  const footballFields = await Promise.all([
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
        slotDuration: 60,
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
        closingTime: '00:00',
        slotDuration: 90,
        facilities: ['تغيير ملابس', 'دش', 'باركينج', 'إضاءة LED'],
        imageUrl: '/images/fields/football2.jpg'
      }
    })
  ])
  
  // 3. إنشاء ملاعب بادل
  const padelFields = await Promise.all([
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
        slotDuration: 60,
        facilities: ['تكييف', 'كافتيريا', 'مدرب', 'معدات'],
        imageUrl: '/images/fields/padel1.jpg'
      }
    })
  ])
  
  console.log('✅ Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
