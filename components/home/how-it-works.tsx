// components/home/how-it-works.tsx
export default function HowItWorks() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8">إزاي بيشتغل؟</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">١. اختار الملعب</h3>
            <p className="text-gray-600">تصفح الملاعب المتاحة حسب الموقع والوقت.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">٢. احجز بسهولة</h3>
            <p className="text-gray-600">حدد الوقت المناسب وكمّل الحجز في ثواني.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">٣. العب واستمتع</h3>
            <p className="text-gray-600">روح الملعب في المعاد واستمتع باللعب.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
