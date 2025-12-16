// app/(player)/fields/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import FieldCard from '@/components/fields/field-card'
import LocationFilter from '@/components/fields/location-filter'
import { Loader2, Filter } from 'lucide-react'

interface Field {
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

export default function FieldsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type') as 'football' | 'padel'
  
  const [fields, setFields] = useState<Field[]>([])
  const [filteredFields, setFilteredFields] = useState<Field[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFields()
  }, [type])

  useEffect(() => {
    if (selectedLocation) {
      setFilteredFields(fields.filter(field => field.location === selectedLocation))
    } else {
      setFilteredFields(fields)
    }
  }, [fields, selectedLocation])

  const fetchFields = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/fields?type=${type}`)
      const data = await response.json()
      setFields(data.fields)
      
      // استخراج المناطق الفريدة
      const uniqueLocations = [...new Set(data.fields.map((f: Field) => f.location))]
      setLocations(uniqueLocations)
    } catch (error) {
      console.error('Error fetching fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBook = (fieldId: string) => {
    router.push(`/fields/${fieldId}/booking`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">جاري تحميل الملاعب...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {type === 'football' ? '⚽ ملاعب كرة القدم' : '🎾 ملاعب البادل'}
        </h1>
        <p className="text-gray-600">
          اكتشف أفضل الملاعب المتاحة واحجز وقتك المفضل
        </p>
      </div>

      {/* Location Filter */}
      {locations.length > 0 && (
        <LocationFilter
          locations={locations}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />
      )}

      {/* Fields Grid */}
      {filteredFields.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد ملاعب</h3>
          <p className="text-gray-500">
            {selectedLocation 
              ? `لا توجد ملاعب في منطقة ${selectedLocation}`
              : 'لا توجد ملاعب متاحة حالياً'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              onBook={handleBook}
            />
          ))}
        </div>
      )}
    </div>
  )
}
