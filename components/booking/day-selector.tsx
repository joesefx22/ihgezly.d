// components/booking/day-selector.tsx
'use client'

import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Day } from '@/lib/time-slots/core-logic'

interface DaySelectorProps {
  days: Day[]
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}

export default function DaySelector({ days, selectedDate, onSelectDate }: DaySelectorProps) {
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('days-container')
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">اختر التاريخ</h2>
          <p className="text-gray-600 mt-1">حدد اليوم المناسب لحجزك</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          id="days-container"
          className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide"
        >
          {days.map((day) => {
            const isSelected = selectedDate?.toDateString() === day.date.toDateString()
            
            return (
              <button
                key={day.date.toISOString()}
                onClick={() => onSelectDate(day.date)}
                className={`
                  flex-shrink-0 w-36 h-36 rounded-2xl p-5 text-center transition-all duration-300
                  border-2 hover:border-primary-500 hover:shadow-lg
                  ${isSelected
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500 text-white shadow-xl scale-105'
                    : 'bg-white border-gray-200 text-gray-700 hover:shadow-lg'
                  }
                  ${day.isWeekend ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' : ''}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {day.isToday ? 'اليوم' : day.isTomorrow ? 'غداً' : day.weekday}
                </div>
                <div className="text-3xl font-bold mb-2">{day.dayNumber}</div>
                <div className="text-sm mb-3">{day.monthName}</div>
                
                {day.isWeekend && !isSelected && (
                  <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    عطلة نهاية الأسبوع
                  </div>
                )}
                
                {isSelected && (
                  <div className="mt-2">
                    <div className="w-8 h-1 bg-white/30 rounded-full mx-auto"></div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        
        {/* Gradient overlays for scroll indication */}
        <div className="absolute left-0 top-0 bottom-6 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-6 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}