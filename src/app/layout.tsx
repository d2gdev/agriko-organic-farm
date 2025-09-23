import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { Inter, Crimson_Pro, Caveat } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import NavbarWrapper from '@/components/NavbarWrapper';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import { SkipLinks } from '@/components/SkipLink';
// import ClientInitializer from '@/components/ClientInitializer'; // Temporarily disabled
// import PathnameTracker from '@/components/PathnameTracker'; // temporarily disabled
// import ErrorHandler from '@/components/ErrorHandler'; // temporarily disabled

// Direct imports instead of lazy loading to fix manifest error
import GoogleAnalytics from '@/components/GoogleAnalytics';
import PageAnalytics from '@/components/PageAnalytics';
// import PerformanceOptimizer from '@/components/PerformanceOptimizer';
import { initializeEnvironmentValidation } from '@/lib/startup-validation';
import { URL_CONSTANTS, urlHelpers } from '@/lib/url-constants';
import { logger } from '@/lib/logger';
// import GlobalErrorBoundary from '@/components/GlobalErrorBoundary'; // Temporarily disabled

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
  preload: true,
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
  preload: true,
  weight: ['400', '700'],
});

// Validate environment variables on startup (server-side only)
if (typeof window === 'undefined') {
  // Only run on server-side to prevent client-side execution
  try {
    initializeEnvironmentValidation();
  } catch (error) {
    logger.warn('⚠️ Environment validation warnings (app will continue):', error as Record<string, unknown>);

    // In development, continue with warnings instead of failing
    if (process.env.NODE_ENV === 'development') {
      logger.info('🔧 Development mode: API endpoints may have limited functionality without proper environment variables');
    } else if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      // Only exit in production runtime, not during build
      logger.error('💥 Production environment validation failed - some features may not work');
      // Don't exit immediately, let the app start but log critical error
    }
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(urlHelpers.getShopUrl()),
  title: 'Agriko Organic Farm - Premium Rice & Health Products',
  description: 'Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm. Black, Brown, Red, White rice, Turmeric, Ginger, Moringa powders.',
  keywords: 'organic rice, black rice, brown rice, turmeric powder, moringa powder, ginger powder, organic honey, health products, sustainable farming',
  authors: [{ name: 'Agriko Team' }],
  creator: 'Agriko',
  publisher: 'Agriko',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: urlHelpers.getShopUrl(),
    siteName: 'Agriko',
    title: 'Agriko Organic Farm - Premium Rice & Health Products',
    description: 'Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Agriko - Quality Agricultural Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agriko Organic Farm - Premium Rice & Health Products',
    description: 'Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm.',
    images: ['/images/og-image.jpg'],
  },
};

export async function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#389d65',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable} ${caveat.variable}`} data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={URL_CONSTANTS.COMPANY_BASE_URL} />
        <link rel="dns-prefetch" href={URL_CONSTANTS.COMPANY_BASE_URL} />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Prevent font loading hydration mismatch */
            :root {
              --font-inter: 'Inter', system-ui, sans-serif;
              --font-crimson: 'Crimson Pro', Georgia, serif;
              --font-caveat: 'Caveat', cursive;
            }
            /* Ensure font fallbacks during loading */
            .font-loading {
              font-display: swap;
              font-synthesis: none;
            }
          `
        }} />
      </head>
      <body className="font-sans min-h-screen flex flex-col bg-cream font-loading">
        {/* Client-side initialization - temporarily disabled */}
        {/* <ClientInitializer /> */}
        
        {/* Google Analytics */}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>

        {/* Page Analytics and User Behavior Tracking */}
        <PageAnalytics pageType="other" />
        
        {/* Performance Optimizations - temporarily disabled to fix preload warnings */}
        {/* <PerformanceOptimizer /> */}

        {/* Service Worker Registration and Legacy Preload Cleanup */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Aggressively remove legacy preloads immediately
              function removeLegacyPreloads() {
                const legacyImages = ['hero-organic-farm.jpg', 'products-hero.jpg'];
                legacyImages.forEach(function(imageName) {
                  const links = document.querySelectorAll('link[rel="preload"][href*="' + imageName + '"]');
                  links.forEach(function(link) {
                    console.warn('🗑️ Removing legacy preload:', link.href);
                    link.remove();
                  });
                });
              }

              // Run cleanup immediately and periodically with proper cleanup
              removeLegacyPreloads();
              const cleanupInterval = setInterval(removeLegacyPreloads, 1000);

              // Set up mutation observer to catch dynamically added preloads
              let observer: MutationObserver | null = null;
              if (typeof MutationObserver !== 'undefined') {
                observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                      if (node.nodeType === 1 && node.nodeName === 'LINK' && node.rel === 'preload') {
                        if (node.href && (node.href.includes('hero-organic-farm.jpg') || node.href.includes('products-hero.jpg'))) {
                          console.warn('🚫 Blocked dynamic legacy preload:', node.href);
                          node.remove();
                        }
                      }
                    });
                  });
                });
                observer.observe(document.head, { childList: true, subtree: true });
              }

              // Cleanup function to prevent memory leaks
              const cleanup = function() {
                console.log('🧹 Cleaning up layout resources...');
                if (cleanupInterval) {
                  clearInterval(cleanupInterval);
                }
                if (observer) {
                  observer.disconnect();
                  observer = null;
                }
              };

              // Register cleanup on page unload
              window.addEventListener('beforeunload', cleanup);
              window.addEventListener('pagehide', cleanup);

              // Also cleanup on visibility change (when tab becomes hidden)
              document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'hidden') {
                  cleanup();
                }
              });

              // Register fixed service worker
              if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                window.addEventListener('load', function() {
                  // First clear old registrations and caches
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      console.log('🗑️ Unregistering old SW:', registration.scope);
                      registration.unregister();
                    }

                    // Clear all old caches
                    if ('caches' in window) {
                      caches.keys().then(function(cacheNames) {
                        cacheNames.forEach(function(cacheName) {
                          console.log('🗑️ Deleting old cache:', cacheName);
                          caches.delete(cacheName);
                        });
                      });
                    }

                    // Wait a moment then register new service worker
                    setTimeout(function() {
                      navigator.serviceWorker.register('/sw.js')
                        .then(function(registration) {
                          console.log('✅ Fixed SW registered successfully');
                        })
                        .catch(function(error) {
                          console.log('❌ SW registration failed:', error);
                        });
                    }, 1000);
                  });
                });
              }
            `,
          }}
        />
        
        {/* Skip links for screen reader navigation */}
        <SkipLinks />

        {/* Track pathname for CSS-based conditional styling - temporarily disabled */}
        {/* <PathnameTracker /> */}

        {/* Global error handler - temporarily disabled due to SSR issues */}
        {/* <ErrorHandler /> */}

        <CartProvider>
          {/* GlobalErrorBoundary temporarily removed */}
          {/* Site navigation */}
          <header
            id="site-navigation"
            role="banner"
            aria-label="Site navigation"
          >
            <NavbarWrapper />
          </header>

          {/* Main content area */}
          <main
            id="main-content"
            role="main"
            className="flex-1 pt-16"
            aria-label="Main content"
          >
            {children}
          </main>
          
          {/* Site footer */}
          <footer
            id="site-footer"
            role="contentinfo"
            aria-label="Site footer"
            className="admin-hide-footer"
          >
            <Footer />
          </footer>
          
          {/* Shopping cart overlay */}
          <aside 
            role="complementary" 
            aria-label="Shopping cart"
          >
            <CartDrawer />
          </aside>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #d1d5db',
              },
              success: {
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}