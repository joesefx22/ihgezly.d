// components/fields/location-filter.tsx
'use client'

import { Filter } from 'lucide-react'

interface LocationFilterProps {
  locations: string[]
  selectedLocation: string | null
  onSelectLocation: (location: string | null) => void
}

export default function LocationFilter({ locations, selectedLocation, onSelectLocation }: LocationFilterProps) {
  const allLocations = ['الكل', ...locations]

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">فلتر حسب المنطقة</h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {allLocations.map((location) => (
          <button
            key={location}
            onClick={() => onSelectLocation(location === 'الكل' ? null : location)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              (selectedLocation === location || (location === 'الكل' && !selectedLocation))
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {location}
          </button>
        ))}
      </div>
    </div>
  )
}
