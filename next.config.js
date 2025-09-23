/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamic deployment with Node.js
  // Note: trailingSlash breaks API routes
  trailingSlash: false,

  images: {
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
    // Disable features that might use Jest workers
    workerThreads: false,
    cpus: 1,
  },

  // Fix cross-origin warnings for development
  allowedDevOrigins: ['127.0.0.1:3000', 'localhost:3000'],

  serverExternalPackages: ['sharp', 'neo4j-driver', '@pinecone-database/pinecone', 'nodemailer', 'redis'],

  // Handle ESM packages - do not transpile transformers due to Sharp conflicts
  // transpilePackages: ['@xenova/transformers'],

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
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self' localhost:* http://localhost:* https://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com localhost:* http://localhost:* https://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tagmanager.google.com localhost:* http://localhost:* https://localhost:*; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data: localhost:* http://localhost:* https://localhost:*; img-src 'self' data: https: blob: https://www.googletagmanager.com https://ssl.gstatic.com localhost:* http://localhost:* https://localhost:*; connect-src 'self' https://agrikoph.com https://shop.agrikoph.com https://api.openai.com https://api.pinecone.io https://api.deepseek.com https://*.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://fonts.googleapis.com https://fonts.gstatic.com localhost:* http://localhost:* https://localhost:*; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tagmanager.google.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:; img-src 'self' data: https: blob: https://www.googletagmanager.com https://ssl.gstatic.com; connect-src 'self' https://agrikoph.com https://shop.agrikoph.com https://api.openai.com https://api.pinecone.io https://api.deepseek.com https://*.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://fonts.googleapis.com https://fonts.gstatic.com; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self';"
          }
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev, webpack }) => {
    // Handle @xenova/transformers binary dependencies
    if (isServer) {
      // During build phase, completely ignore transformers to prevent CSS loading issues
      if (process.env.NODE_ENV === 'production' || !dev) {
        config.externals = config.externals || [];
        config.externals.push({
          '@xenova/transformers': 'false'
        });

        // Block transformers completely during build
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /@xenova\/transformers/,
          })
        );
      } else {
        // External transformers to avoid Sharp conflicts in development
        config.externals = config.externals || [];
        config.externals.push({
          '@xenova/transformers': '@xenova/transformers'
        });
      }

      // Add fallback for missing browser CSS files during build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: 'empty',
        path: 'empty',
      };

      // Custom plugin to create missing CSS file during build
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.beforeCompile.tap('CreateMissingCSSPlugin', () => {
            const fs = require('fs');
            const path = require('path');

            try {
              const browserDir = path.join(compiler.context, '.next', 'server', 'app', 'browser');
              const cssFile = path.join(browserDir, 'default-stylesheet.css');

              if (!fs.existsSync(browserDir)) {
                fs.mkdirSync(browserDir, { recursive: true });
              }

              if (!fs.existsSync(cssFile)) {
                fs.writeFileSync(cssFile, '/* Stub CSS for @xenova/transformers compatibility */');
                console.log('Created stub CSS file for transformers compatibility');
              }
            } catch (error) {
              console.warn('Could not create stub CSS file:', error.message);
            }
          });
        }
      });

      // Ignore missing browser-specific CSS files
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /browser\/default-stylesheet\.css$/,
        })
      );
    }

    // Prevent Jest workers and other worker processes from being used in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'jest-worker': false,
        'worker_threads': false,
        'child_process': false,
        fs: false,
        path: false,
        os: false,
      };

      // Block problematic modules that might spawn workers (client side only)
      config.resolve.alias = {
        ...config.resolve.alias,
        '@xenova/transformers': false, // Block on client side to prevent worker spawning
        'jest-worker': false,
        'worker_threads': false,
        'child_process': false,
      };

      // Add ignore plugin for worker-related modules
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(jest-worker|worker_threads|child_process)$/,
        })
      );
    }

    // Disable Next.js worker optimization that might conflict
    if (dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: false,
        sideEffects: false,
      };
    }

    return config;
  },
}

module.exports = nextConfig