// components/booking/countdown-timer.tsx
'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  targetDate: Date
  onExpired?: () => void
}

export default function CountdownTimer({ targetDate, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(targetDate.getTime() - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = targetDate.getTime() - Date.now()
      setTimeLeft(diff)
      if (diff <= 0) {
        clearInterval(interval)
        if (onExpired) onExpired()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onExpired])

  if (timeLeft <= 0) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold">
        <Clock className="w-4 h-4" />
        <span>انتهى الوقت</span>
      </div>
    )
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  return (
    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
      <Clock className="w-4 h-4 text-primary-600" />
      <span className="text-sm text-gray-700">
        يبدأ خلال:
        <strong className="ml-1 text-primary-700">
          {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </strong>
      </span>
    </div>
  )
}
