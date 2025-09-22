'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

import { performanceOptimizer, ResourcePreloader, ImageOptimizer } from '@/lib/performance';
import { initializePerformanceOptimizations } from '@/lib/service-worker';
import { initializeBundleOptimizations } from '@/lib/bundle-optimizer';
// import { FIDOptimizer } from '@/lib/fid-optimizer'; // temporarily disabled
// import { CLSOptimizer } from '@/lib/cls-optimizer'; // temporarily disabled

interface PerformanceOptimizerProps {
  enableResourcePreloading?: boolean;
  enableImageOptimization?: boolean;
  enablePrefetching?: boolean;
}

export default function PerformanceOptimizer({ 
  enableResourcePreloading = true,
  enableImageOptimization = true,
  enablePrefetching = true
}: PerformanceOptimizerProps) {
  
  useEffect(() => {
    // Initialize all performance optimizations
    const initAllOptimizations = async () => {
      try {
        logger.info('🚀 Initializing comprehensive performance optimizations...');

        // 1. Initialize service worker and caching
        await initializePerformanceOptimizations();

        // 2. Initialize bundle optimizations
        initializeBundleOptimizations();

        // 3. Initialize FID optimizations - temporarily disabled
        // const fidCleanup = FIDOptimizer.initialize();

        // 4. Initialize CLS optimizations - temporarily disabled
        // CLSOptimizer.initializeLayoutMonitoring();
        // CLSOptimizer.preloadCriticalFonts();

        // 5. Core Web Vitals monitoring (existing)
        if (enableResourcePreloading) {
          ResourcePreloader.preconnectExternalDomains();
        }

        // Preload critical resources after initial render
        setTimeout(() => {
          if (enableResourcePreloading) {
            // First, aggressively clean up any existing legacy preloads
            ResourcePreloader.cleanupLegacyPreloads();
            // Then preload only what we actually need
            ResourcePreloader.preloadCriticalResources();
          }
          
          if (enableImageOptimization) {
            ImageOptimizer.lazyLoadImages();
          }
        }, 100);

        // Prefetch next pages on idle
        if (enablePrefetching && 'requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            ResourcePreloader.prefetchNextPageResources();
          }, { timeout: 2000 });
        } else if (enablePrefetching) {
          setTimeout(() => {
            ResourcePreloader.prefetchNextPageResources();
          }, 2000);
        }

        logger.info('✅ All performance optimizations initialized successfully');

        // Return cleanup function
        return () => {
          performanceOptimizer.cleanup();
          // fidCleanup(); // temporarily disabled
        };

      } catch (error) {
        logger.error('❌ Performance optimization initialization failed:', error as Record<string, unknown>);
        return () => {}; // Return no-op cleanup function on error
      }
    };

    // Initialize optimizations
    const cleanupPromise = initAllOptimizations();

    // Cleanup on unmount
    return () => {
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, [enableResourcePreloading, enableImageOptimization, enablePrefetching]);

  // Generate and log performance report on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          const report = performanceOptimizer.generateReport();
          
          // Log performance report for debugging
          if (process.env.NODE_ENV === 'development') {
            logger.group('🚀 Performance Report');
            logger.info('Overall Score:', { score: report.overallScore });
            logger.info('Core Web Vitals:', {
              LCP: report.metrics.lcp ? `${Math.round(report.metrics.lcp)}ms` : 'N/A',
              FID: report.metrics.fid ? `${Math.round(report.metrics.fid)}ms` : 'N/A',
              CLS: report.metrics.cls ? report.metrics.cls.toFixed(3) : 'N/A'
            });
            logger.info('Recommendations:', { recommendations: report.recommendations });
            logger.groupEnd();
          }

          // Store report for analytics dashboard
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('agriko_performance_report', JSON.stringify(report));
            } catch {
              // Storage failed, continue silently
            }
          }
        } catch (error) {
          logger.warn('Failed to generate performance report:', error as Record<string, unknown>);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // This component doesn't render anything
}
