// components/layout/footer.tsx
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">⚽</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">احجزلي</h2>
                <p className="text-sm text-gray-400">حجز ملاعب رياضية</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              منصة احجزلي توفر لك حجز أفضل الملاعب الرياضية بسهولة وأمان. احجز ملعبك الآن واستمتع بأجمل الأوقات.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/fields?type=football" className="text-gray-400 hover:text-white transition-colors">
                  ملاعب كرة القدم
                </Link>
              </li>
              <li>
                <Link href="/fields?type=padel" className="text-gray-400 hover:text-white transition-colors">
                  ملاعب البادل
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="text-gray-400 hover:text-white transition-colors">
                  حجوزاتي
                </Link>
              </li>
              <li>
                <a href="https://forms.google.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                  إضافة ملعب
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">اتصل بنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4" />
                <span>01012345678</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>info@ahgazly.com</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-4 h-4 mt-1" />
                <span>القاهرة - مصر</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-bold mb-4">تابعنا</h3>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-primary-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-primary-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-primary-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} احجزلي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  )
}
