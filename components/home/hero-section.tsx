// components/home/hero-section.tsx
'use client'

import { Search, ArrowLeft, Calendar } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HeroSection() {
  const router = useRouter()
  const [searchType, setSearchType] = useState<'football' | 'padel'>('football')

  const handleSearch = () => {
    router.push(`/fields?type=${searchType}`)
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 px-8 mb-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full border-4"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          احجز أفضل الملاعب
          <span className="block text-primary-200">بضغطة زر</span>
        </h1>
        
        <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
          اكتشف وأحجز أفضل ملاعب كرة القدم والبادل في مصر. جودة عالية، أسعار مناسبة، وحجز فوري.
        </p>

        {/* Search Box */}
        <div className="bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                <button
                  onClick={() => setSearchType('football')}
                  className={`flex-1 py-4 px-6 font-medium transition-colors ${
                    searchType === 'football'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ⚽ كرة القدم
                </button>
                <button
                  onClick={() => setSearchType('padel')}
                  className={`flex-1 py-4 px-6 font-medium transition-colors ${
                    searchType === 'padel'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🎾 البادل
                </button>
              </div>
            </div>
            
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-8 rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              ابحث عن ملاعب
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold">50+</div>
            <div className="text-primary-200">ملعب متاح</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">1,200+</div>
            <div className="text-primary-200">حجز ناجح</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">24/7</div>
            <div className="text-primary-200">دعم فني</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">100%</div>
            <div className="text-primary-200">ضمان رضا</div>
          </div>
        </div>
      </div>
    </section>
  )
}
