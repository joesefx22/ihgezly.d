// next.config.js 
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'accept.paymob.com',
        pathname: '/**',
      },
    ],
  },
  // إعدادات مهمة للـ Webhook
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
    ]
  },
}

module.exports = nextConfig
