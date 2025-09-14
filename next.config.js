/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Dynamic Next.js server - no static export
  // Server will run behind Apache reverse proxy
  trailingSlash: true,

  images: {
    // Images will be optimized by Next.js server
    unoptimized: false,
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
    formats: ['image/avif', 'image/webp'], // AVIF first for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Reduced sizes for better performance
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    minimumCacheTTL: 86400, // 24 hours cache for better performance
    dangerouslyAllowSVG: false, // Disabled for security - SVGs can contain malicious scripts
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // No asset prefix needed - Apache will proxy everything
  assetPrefix: '',
  
  compress: true,
  poweredByHeader: false, // Remove X-Powered-By header for security and performance
  generateEtags: true, // Enable ETags for better caching
  
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizeCss: process.env.NODE_ENV !== 'production', // Enable in development
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'], // Optimize package imports
  },
  
  // External packages for better bundling (moved from experimental)
  serverExternalPackages: ['sharp', 'neo4j-driver', '@pinecone-database/pinecone', 'nodemailer', 'redis'],
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Security headers for enhanced protection
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
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.pinecone.io https://*.googleapis.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.pinecone.io https://*.googleapis.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self';"
          }
        ],
      },
    ];
  },
  
  // Note: Additional headers may be configured in Apache2 for static export deployment
  // Security headers are also set in apache-config/shop.agrikoph.com.conf
}

module.exports = withBundleAnalyzer(nextConfig)