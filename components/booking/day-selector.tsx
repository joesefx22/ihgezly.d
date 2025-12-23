// components/booking/day-selector.tsx
'use client'

import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

interface Day {
  date: Date
  label: string
  isToday: boolean
  isTomorrow: boolean
}

interface DaySelectorProps {
  days: Day[]
  selectedDate: Day | null
  onSelectDate: (day: Day) => void
}

export default function DaySelector({ days, selectedDate, onSelectDate }: DaySelectorProps) {
  const [scrollPosition, setScrollPosition] = useState(0)

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('days-container')
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setScrollPosition(container.scrollLeft + scrollAmount)
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">اختر اليوم</h3>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          id="days-container"
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
        >
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => onSelectDate(day)}
              className={`flex-shrink-0 w-28 rounded-xl p-4 text-center transition-all ${
                selectedDate?.date.toDateString() === day.date.toDateString()
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <div className="text-sm mb-1">
                {day.isToday ? 'اليوم' : day.isTomorrow ? 'غداً' : day.label.split('،')[0]}
              </div>
              <div className="text-lg font-bold">
                {day.date.toLocaleDateString('ar-EG', { day: 'numeric' })}
              </div>
              <div className="text-sm mt-1">
                {day.date.toLocaleDateString('ar-EG', { month: 'long' })}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
