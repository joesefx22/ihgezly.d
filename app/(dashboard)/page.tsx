// app/(dashboard)/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import HeroSection from '@/components/home/hero-section';
import FeaturedFields from '@/components/home/featured-fields';
import HowItWorks from '@/components/home/how-it-works';
import MainCardsGrid from '@/components/home/main-cards-grid';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  // 🔄 توجيه المستخدمين المسجلين حسب الرول
  if (session?.user) {
    const userRole = session.user.role;
    
    switch (userRole) {
      case 'PLAYER':
        redirect('/dashboard/player');
      case 'ADMIN':
        redirect('/dashboard/admin');
      case 'OWNER':
        redirect('/dashboard/owner');
      case 'EMPLOYEE':
        redirect('/dashboard/employee');
      default:
        // لو الرول مش معروف، يفضل في الصفحة العامة
        break;
    }
  }
  
  // 📍 Landing Page للزوار أو الرول غير المعروف
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-16">
          <HeroSection />
        </section>
        
        {/* Main Action Cards */}
        <section className="my-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            ابدأ حجزك الآن
          </h2>
          <MainCardsGrid />
        </section>
        
        {/* How It Works */}
        <section className="my-16">
          <HowItWorks />
        </section>
        
        {/* Featured Fields */}
        <section className="my-16">
          <FeaturedFields />
        </section>
        
        {/* Call to Action */}
        <section className="text-center my-16 bg-blue-50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            انضم إلى مجتمعنا
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            سجل الآن وتمتع بتجربة حجز ملاعب سلسة وإدارة فعالة
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="/login" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              تسجيل الدخول
            </a>
            <a 
              href="/register" 
              className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              إنشاء حساب
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}