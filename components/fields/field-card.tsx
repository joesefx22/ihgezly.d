// components/fields/field-card.tsx
'use client'

import { MapPin, Star, Users, Clock, ArrowLeft } from 'lucide-react'
import { Field } from '@/lib/types'
import { useState } from 'react'

interface FieldCardProps {
  field: Field
  onBook: (fieldId: string) => void
}

export default function FieldCard({ field, onBook }: FieldCardProps) {
  const [imageError, setImageError] = useState(false)

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'FOOTBALL': return '⚽'
      case 'PADEL': return '🎾'
      case 'TENNIS': return '🎯'
      case 'BASKETBALL': return '🏀'
      default: return '🏟️'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-red-100 text-red-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Status Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(field.status)}`}>
          {field.status === 'OPEN' ? 'مفتوح' : field.status === 'CLOSED' ? 'مغلق' : 'صيانة'}
        </span>
      </div>

      {/* Type Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className="px-3 py-1 bg-black/80 text-white rounded-full text-xs font-bold backdrop-blur-sm">
          {getFieldTypeIcon(field.type)} {field.type === 'FOOTBALL' ? 'كرة قدم' : 'بادل'}
        </span>
      </div>

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {!imageError ? (
          <img
            src={field.imageUrl}
            alt={field.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
            <div className="text-4xl">{getFieldTypeIcon(field.type)}</div>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        {/* Price */}
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{field.pricePerHour}</span>
            <span className="text-white/80">ج.م/ساعة</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{field.name}</h3>
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{field.location}</span>
            </div>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-gray-900">{field.rating}</span>
            <span className="text-gray-500 text-sm">({field.reviewCount})</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{field.description}</p>

        {/* Facilities */}
        {field.facilities && field.facilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {field.facilities.slice(0, 3).map((facility, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                {facility}
              </span>
            ))}
            {field.facilities.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                +{field.facilities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{field.openingTime} - {field.closingTime}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm">عربون {field.depositPrice} ج.م</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onBook(field.id)}
          disabled={field.status !== 'OPEN'}
          className={`
            w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2
            ${field.status === 'OPEN'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white hover:shadow-lg'
              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {field.status === 'OPEN' ? (
            <>
              احجز الآن
              <ArrowLeft className="w-4 h-4" />
            </>
          ) : (
            'غير متاح للحجز'
          )}
        </button>
      </div>
    </div>
  )
}