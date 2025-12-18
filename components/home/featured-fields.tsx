// components/home/featured-fields.tsx
export default function FeaturedFields() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">ملاعب مميزة</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">ملعب النجيل الصناعي</h3>
            <p className="text-gray-600">مجهز بالكامل ومناسب للمباريات الودية.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">ملعب خماسي</h3>
            <p className="text-gray-600">إضاءة ممتازة وتجهيزات كاملة.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">ملعب سباعي</h3>
            <p className="text-gray-600">مساحة أكبر وتجربة لعب احترافية.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
