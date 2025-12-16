// app/(player)/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import HeroSection from '@/components/home/hero-section'
import MainCardsGrid from '@/components/home/main-cards-grid'
import HowItWorks from '@/components/home/how-it-works'
import FeaturedFields from '@/components/home/featured-fields'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  // إذا كان موظف، يذهب للوحة التحكم
  if (session?.user?.role === 'EMPLOYEE') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header user={session?.user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Main Action Cards */}
        <section className="my-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            ابدأ حجزك الآن
          </h2>
          <MainCardsGrid />
        </section>
        
        {/* How It Works */}
        <HowItWorks />
        
        {/* Featured Fields */}
        <FeaturedFields />
      </main>
      
      <Footer />
    </div>
  )
}
