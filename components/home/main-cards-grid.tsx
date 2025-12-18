'use client'

import { useRouter } from 'next/navigation'
import MainCard from './main-card'
import { 
  Football,
  Tennis,
  CalendarCheck,
  PlusCircle
} from 'lucide-react'

const cards = [
  {
    title: 'ملاعب كرة القدم',
    description: 'احجز أفضل ملاعب الكرة بأعلى جودة',
    icon: Football,
    color: 'bg-gradient-to-r from-sport-football to-green-600',
    href: '/fields?type=football',
    badge: '20+ ملعب'
  },
  {
    title: 'ملاعب البادل',
    description: 'استمتع بأحدث ملاعب البادل',
    icon: Tennis,
    color: 'bg-gradient-to-r from-sport-padel to-blue-600',
    href: '/fields?type=padel',
    badge: '15+ ملعب'
  },
  {
    title: 'حجوزاتي',
    description: 'تابع جميع حجوزاتك القادمة',
    icon: CalendarCheck,
    color: 'bg-gradient-to-r from-purple-500 to-purple-700',
    href: '/bookings',
    badge: 'متابعة'
  },
  {
    title: 'إضافة ملعب جديد',
    description: 'هل لديك ملعب؟ أضفه إلى المنصة',
    icon: PlusCircle,
    color: 'bg-gradient-to-r from-amber-500 to-orange-600',
    href: 'https://forms.google.com/...',
    external: true
  }
]

export default function MainCardsGrid() {
  const router = useRouter()

  const handleClick = (href: string, external: boolean = false) => {
    if (external) {
      window.open(href, '_blank')
    } else {
      router.push(href)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
      {cards.map((card, index) => (
        <div 
          key={index}
          onClick={() => handleClick(card.href, card.external)}
          className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
        >
          <MainCard {...card} />
        </div>
      ))}
    </div>
  )
}
