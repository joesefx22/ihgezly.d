// components/ui/Alert.tsx
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/helpers' // عدلت المسار

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  className?: string
}

const typeConfig = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: CheckCircle,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/20'
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: XCircle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/20'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20'
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: Info,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20'
  }
}

export default function Alert({ type, title, message, className }: AlertProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className={cn(
      "rounded-xl border p-4 backdrop-blur-sm",
      config.bg,
      config.border,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg flex-shrink-0",
          config.iconBg
        )}>
          <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>
        <div className="flex-1">
          <h4 className={cn("font-semibold mb-1", config.text)}>
            {title}
          </h4>
          <p className={cn("text-sm opacity-90", config.text)}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}