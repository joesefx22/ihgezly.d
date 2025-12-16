// components/fields/field-card.tsx
'use client'

import { MapPin, Clock, CreditCard, Star } from 'lucide-react'
import Image from 'next/image'
import Badge from '@/components/ui/badge'

interface FieldCardProps {
  field: {
    id: string
    name: string
    description: string
    location: string
    pricePerHour: number
    depositPrice: number
    imageUrl: string
    type: 'FOOTBALL' | 'PADEL'
    status: 'OPEN' | 'CLOSED' | 'MAINTENANCE'
    facilities: string[]
  }
  onBook: (id: string) => void
}

export default function FieldCard({ field, onBook }: FieldCardProps) {
  const isAvailable = field.status === 'OPEN'
  
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
      {/* Status Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge 
          variant={
            field.status === 'OPEN' ? 'success' : 
            field.status === 'MAINTENANCE' ? 'warning' : 'error'
          }
        >
          {field.status === 'OPEN' ? 'متاح' : 
           field.status === 'MAINTENANCE' ? 'صيانة' : 'مغلق'}
        </Badge>
      </div>
      
      {/* Sport Type Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge 
          variant={field.type === 'FOOTBALL' ? 'sport' : 'info'}
          className="px-3 py-1"
        >
          {field.type === 'FOOTBALL' ? 'كرة قدم' : 'بادل'}
        </Badge>
      </div>
      
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={field.imageUrl || '/images/fields/default.jpg'}
          alt={field.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{field.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{field.description}</p>
        
        {/* Location */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 text-sm">{field.location}</span>
        </div>
        
        {/* Facilities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {field.facilities.slice(0, 3).map((facility, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {facility}
            </span>
          ))}
          {field.facilities.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{field.facilities.length - 3}
            </span>
          )}
        </div>
        
        {/* Pricing */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">سعر الساعة:</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary-600">
                {field.pricePerHour}
              </span>
              <span className="text-gray-500">جنيه</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">العربون:</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-amber-600">
                {field.depositPrice}
              </span>
              <span className="text-gray-500">جنيه</span>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <button
          onClick={() => onBook(field.id)}
          disabled={!isAvailable}
          className={`
            w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300
            flex items-center justify-center gap-2
            ${isAvailable 
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:shadow-lg' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
          `}
        >
          {isAvailable ? 'احجز الآن' : 'غير متاح للحجز'}
        </button>
      </div>
    </div>
  )
}
