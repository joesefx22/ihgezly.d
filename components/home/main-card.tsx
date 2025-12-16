// components/home/main-card.tsx
interface MainCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  badge?: string
  external?: boolean
}

export default function MainCard({ title, description, icon: Icon, color, badge, external }: MainCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 h-full ${color} text-white`}>
      {/* Icon */}
      <div className="mb-6">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <Icon className="w-8 h-8" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="opacity-90 mb-4 text-sm">{description}</p>

      {/* Badge */}
      {badge && (
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs font-medium">
            {badge}
          </span>
        </div>
      )}

      {/* External Indicator */}
      {external && (
        <div className="absolute top-4 right-4">
          <span className="text-xs bg-white/30 px-2 py-1 rounded">↗</span>
        </div>
      )}

      {/* Hover Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </div>
  )
}
