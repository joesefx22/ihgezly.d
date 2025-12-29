// components/ui/LoadingSpinner.tsx
import { cn } from '@/lib/helpers'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  className,
  color = 'text-blue-500' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-gray-300 border-t-current",
        sizeClasses[size],
        color
      )} />
      <span className="sr-only">جاري التحميل...</span>
    </div>
  )
}