/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ شيل swcMinify (مش مدعوم في Next.js 16)
  // swcMinify: true,

  // ✅ التجارب الجديدة
  experimental: {
    optimizeCss: true,
  },

  // ✅ Image optimization (استخدم remotePatterns فقط)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'accept.paymob.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ✅ Security + Webhook headers
  async headers() {
    return [
      {
        source: '/api/webhooks/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, hmac' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  // ✅ بيئة
  env: {
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    APP_NAME: process.env.APP_NAME || 'GameZone',
  },

  // ✅ Turbopack config (فاضي لو مش محتاج تخصيص)
  turbopack: {},

  // ❌ شيل إعدادات Webpack القديمة (لو عايز تستخدم Webpack بدل Turbopack، شغل build بـ --webpack)
}

module.exports = nextConfig
