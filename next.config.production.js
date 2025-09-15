/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamic deployment with Node.js
  trailingSlash: true,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'agrikoph.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'shop.agrikoph.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  assetPrefix: '',

  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },

  serverExternalPackages: ['sharp', 'neo4j-driver', '@pinecone-database/pinecone', 'nodemailer', 'redis'],

  compiler: {
    removeConsole: {
      exclude: ['error', 'warn']
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.pinecone.io https://*.googleapis.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self';"
          }
        ],
      },
    ];
  },
}

module.exports = nextConfig