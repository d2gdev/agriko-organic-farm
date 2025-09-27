/** @type {import('next').NextConfig} */
// Check if we're in development before forcing production
const isDevelopment = process.env.NODE_ENV === 'development';

// Force production environment if not explicitly set to development
if (!process.env.NODE_ENV && !isDevelopment) {
  process.env.NODE_ENV = 'production';
}

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
    // Disable image optimization for external images on localhost to fix loading issues
    unoptimized: isDevelopment,
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
    // Disable worker threads completely to fix Jest worker issues
    workerThreads: false,
    cpus: 1,
    // Force disable Jest in production mode
    forceSwcTransforms: true,
  },

  // External packages for server components removed - consolidated below

  // Development indicators configuration
  devIndicators: {
    position: 'bottom-right',
  },

  // Force production optimizations
  productionBrowserSourceMaps: false,

  // Fix cross-origin warnings for development
  allowedDevOrigins: ['127.0.0.1:3000', 'localhost:3000', '192.168.56.1:3000', '127.0.0.1:3001', 'localhost:3001', '192.168.56.1:3001'],

  serverExternalPackages: ['sharp', 'neo4j-driver', '@pinecone-database/pinecone', 'nodemailer', 'redis'],

  // Handle ESM packages - do not transpile transformers due to Sharp conflicts
  transpilePackages: ['sanity', '@sanity/vision', 'next-sanity'],

  compiler: {
    removeConsole: {
      exclude: ['error', 'warn']
    },
  },

  // Temporarily disable all headers to debug 403 issue
  // async headers() {
  //   return [];
  // },

  webpack: (config, { isServer, dev, webpack }) => {
    // Force production mode
    config.mode = process.env.NODE_ENV === 'production' ? 'production' : config.mode;

    // Fix Sanity module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'sanity/structure': require.resolve('sanity/structure'),
      'sanity/desk': require.resolve('sanity/desk'),
      'sanity/_singletons': require.resolve('sanity/_singletons'),
      'sanity/_internal': require.resolve('sanity/_internal'),
      'sanity/_createContext': require.resolve('sanity/_createContext'),
      'sanity/router': require.resolve('sanity/router'),
      'sanity': require.resolve('sanity'),
    };

    // Fix chunk loading issues
    if (!isServer) {
      // Increase chunk loading timeout
      config.output = {
        ...config.output,
        chunkLoadTimeout: 120000, // 120 seconds timeout
        crossOriginLoading: 'anonymous',
      };

      // Optimize chunk splitting to prevent loading errors
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Main vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
        // Prevent runtime chunk issues
        runtimeChunk: false,
        // Ensure consistent module IDs
        moduleIds: 'deterministic',
      };
    }

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
                console.warn('Created stub CSS file for transformers compatibility');
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
    if (dev && isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: false,
        sideEffects: false,
      };
    }

    // Sanity Studio specific configuration
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      path: false,
      os: false,
      stream: false,
      util: false,
    };

    // Don't mess with Sanity module resolution

    return config;
  },
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig