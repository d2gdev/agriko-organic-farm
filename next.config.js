/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Apache2 deployment
  output: 'export',
  trailingSlash: true,
  
  // Skip API routes during static export
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    // Remove API routes from static export
    const pathMap = {};
    for (const [path, page] of Object.entries(defaultPathMap)) {
      if (!path.startsWith('/api/')) {
        pathMap[path] = page;
      }
    }
    return pathMap;
  },
  
  images: {
    // Required for static export
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
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Asset prefix for production deployment
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://shop.agrikoph.com' : '',
  
  compress: true,
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizeCss: false, // Disabled for static export compatibility
  },
  // Note: Headers are configured in Apache2 for static export deployment
  // Security headers are set in apache-config/shop.agrikoph.com.conf
}

module.exports = nextConfig