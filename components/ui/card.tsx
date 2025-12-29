// components/ui/Card.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/helpers'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void // ✅ أضفنا onClick
}

export default function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white/5 backdrop-blur-sm border-white/10 shadow-lg",
        "hover:bg-white/10 transition-all duration-300",
        className
      )}
      onClick={onClick} // ✅ الكارت يقبل onClick
    >
      {children}
    </div>
  )
}
