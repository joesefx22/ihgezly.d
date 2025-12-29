// components/layout/Footer.tsx
import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Shield, Award } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">⚽</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                  احجزلي
                </h2>
                <p className="text-sm text-gray-400">حجز ملاعب رياضية</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              منصة احجزلي توفر لك تجربة حجز ملاعب رياضية فريدة. 
              اختر من بين أفضل الملاعب واحجز وقتك المفضل بسهولة وأمان.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">حجز آمن</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">جودة عالية</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">روابط سريعة</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/fields" 
                  className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span>استعرض الملاعب</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/how-it-works" 
                  className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span>كيفية الحجز</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span>الأسعار</span>
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:partners@ahgazly.com" 
                  target="_blank"
                  className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span>أضف ملعبك</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">تواصل معنا</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <span className="block text-gray-400 text-sm">الهاتف</span>
                  <a href="tel:+201012345678" className="text-white hover:text-blue-400 transition-colors">
                    01012345678
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <span className="block text-gray-400 text-sm">البريد الإلكتروني</span>
                  <a href="mailto:info@ahgazly.com" className="text-white hover:text-blue-400 transition-colors">
                    info@ahgazly.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <span className="block text-gray-400 text-sm">العنوان</span>
                  <span className="text-white">القاهرة - مصر</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Social Media & Newsletter */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">تابعنا</h3>
            <div className="flex gap-3 mb-6">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-gray-800 hover:bg-blue-600 rounded-xl transition-colors"
                aria-label="فيسبوك"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-gray-800 hover:bg-pink-600 rounded-xl transition-colors"
                aria-label="انستجرام"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-gray-800 hover:bg-blue-400 rounded-xl transition-colors"
                aria-label="تويتر"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h4 className="text-sm font-medium mb-2">اشترك في النشرة البريدية</h4>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                  اشترك
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                © {currentYear} احجزلي. جميع الحقوق محفوظة.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                سياسة الخصوصية
              </Link>
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                الشروط والأحكام
              </Link>
              <Link 
                href="/refund" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                سياسة الاسترجاع
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                الدعم الفني
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}