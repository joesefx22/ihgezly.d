// app/(dashboard)/(player)/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authcontext';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import LoadingSpinner from '@/components/ui/loadingspinner';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';

export default function PlayerDashboard() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 🔒 تأمين الصفحة
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // ✅ تحقق من الرول
  useEffect(() => {
    if (user && user.role !== 'PLAYER') {
      switch (user.role) {
        case 'ADMIN':
          router.push('/dashboard/admin');
          break;
        case 'OWNER':
          router.push('/dashboard/owner');
          break;
        case 'EMPLOYEE':
          router.push('/dashboard/employee');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // سيتم التوجيه في useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                مرحباً، {user.name || 'لاعب'} 👋
              </h1>
              <p className="text-gray-600 mt-2">
                لوحة تحكم اللاعب • {user.email}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {user.role}
                </span>
                <span className="text-sm text-gray-500">
  عضو منذ {new Date(user.createdAt ?? Date.now()).toLocaleDateString('ar-EG')}
</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/dashboard/player/fields')}
                variant="primary"
              >
                🏟️ استعرض الملاعب
              </Button>
              <Button 
                onClick={() => logout()}
                variant="outline"
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">الحجوزات النشطة</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">الساعات المحجوزة</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">المدفوعات</p>
                <p className="text-2xl font-bold">1,250 ج.م</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">التقييم</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/dashboard/player/fields')}>
            <div className="text-center">
              <div className="text-5xl mb-4">🏟️</div>
              <h3 className="text-xl font-bold mb-3">حجز ملاعب</h3>
              <p className="text-gray-600 mb-4">
                استعرض الملاعب المتاحة واحجز موعدك
              </p>
              <Button className="w-full" variant="outline">
                تصفح الملاعب
              </Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/dashboard/player/bookings')}>
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-3">حجوزاتي</h3>
              <p className="text-gray-600 mb-4">
                إدارة وتعديل الحجوزات الحالية والسابقة
              </p>
              <Button className="w-full" variant="outline">
                عرض الحجوزات
              </Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/dashboard/player/payment')}>
            <div className="text-center">
              <div className="text-5xl mb-4">💳</div>
              <h3 className="text-xl font-bold mb-3">الدفع</h3>
              <p className="text-gray-600 mb-4">
                إدارة طرق الدفع وسجل المعاملات
              </p>
              <Button className="w-full" variant="outline">
                الدفع والحسابات
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 text-gray-900">النشاط الأخير</h2>
          <div className="space-y-4">
            {[
              { action: 'تم تأكيد حجز ملعب كرة القدم', time: 'منذ ساعتين', status: '✅' },
              { action: 'تم دفع قيمة الحجز', time: 'منذ يوم', status: '💰' },
              { action: 'تم تحديث الملف الشخصي', time: 'منذ 3 أيام', status: '📝' },
              { action: 'تقييم ملعب النادي الأهلي', time: 'منذ أسبوع', status: '⭐' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <span className="text-xl">{item.status}</span>
                  <div>
                    <div className="font-medium">{item.action}</div>
                    <div className="text-sm text-gray-500">{item.time}</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost">عرض</Button>
              </div>
            ))}
          </div>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}