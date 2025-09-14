'use client';

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

import { usePathname } from 'next/navigation';
import { behaviorEvent, funnelEvent, performanceEvent } from '@/lib/gtag';
import { searchConsoleTracking, webVitalsTracking } from '@/lib/search-console';

interface PageAnalyticsProps {
  pageType?: 'homepage' | 'product' | 'category' | 'cart' | 'checkout' | 'other';
  productId?: string;
  productName?: string;
  categoryName?: string;
}

export default function PageAnalytics({ 
  pageType = 'other', 
  productId, 
  productName, 
  categoryName 
}: PageAnalyticsProps) {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const hasTrackedVisitRef = useRef<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    startTimeRef.current = startTime;

    // Track page load performance
    const trackPageLoad = () => {
      try {
        const loadTime = Date.now() - startTime;
        performanceEvent.pageLoad(pathname, loadTime, {
          // Core Web Vitals will be tracked separately
        });
      } catch (error) {
        logger.error('Error tracking page load:', error as Record<string, unknown>);
      }
    };

    // Track funnel events based on page type
    const trackFunnelEvent = () => {
      try {
        if (hasTrackedVisitRef.current) return;
        hasTrackedVisitRef.current = true;

        switch (pageType) {
          case 'homepage':
            funnelEvent.viewHomepage();
            break;
          case 'category':
            if (categoryName) {
              funnelEvent.viewProductCategory(categoryName);
            }
            break;
          case 'product':
            if (productId && productName) {
              funnelEvent.viewProductDetail(productId, productName);
            }
            break;
          case 'cart':
            // Cart view will be tracked separately with cart data
            break;
          case 'checkout':
            // Checkout will be tracked separately with cart data
            break;
        }
      } catch (error) {
        logger.error('Error tracking funnel event:', error as Record<string, unknown>);
      }
    };

    // Track SEO metrics
    const trackSEOMetrics = () => {
      try {
        const title = document.title ?? '';
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
        const h1Elements = document.querySelectorAll('h1').length;
        const imagesWithAlt = document.querySelectorAll('img[alt]').length;
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href*="agrikoph.com"]').length;
        const wordCount = document.body.innerText.split(/\s+/).length;

        searchConsoleTracking.trackSEOMetrics({
          pageTitle: title,
          metaDescription: metaDescription,
          h1Count: h1Elements,
          imageAltCount: imagesWithAlt,
          internalLinkCount: internalLinks,
          wordCount: wordCount
        });
      } catch (error) {
        logger.error('Error tracking SEO metrics:', error as Record<string, unknown>);
      }
    };

    // Track organic search arrival
    const trackOrganicArrival = () => {
      try {
        const referrer = document.referrer;
        if (referrer) {
          searchConsoleTracking.trackOrganicArrival(referrer, pathname);
        }
      } catch (error) {
        logger.error('Error tracking organic arrival:', error as Record<string, unknown>);
      }
    };

    // Set up scroll depth tracking
    const trackScrollDepth = () => {
      try {
        const scrollHandler = () => {
          try {
            const scrollTop = window.pageYOffset ?? document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
            
            // Track significant scroll milestones
            if (scrollPercent > scrollDepthRef.current) {
              scrollDepthRef.current = scrollPercent;
              
              if (scrollPercent >= 25 && scrollPercent < 50) {
                behaviorEvent.scrollDepth(pathname, 25);
              } else if (scrollPercent >= 50 && scrollPercent < 75) {
                behaviorEvent.scrollDepth(pathname, 50);
              } else if (scrollPercent >= 75) {
                behaviorEvent.scrollDepth(pathname, 75);
              }
            }
          } catch (error) {
            logger.error('Error in scroll handler:', error as Record<string, unknown>);
          }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
        return () => window.removeEventListener('scroll', scrollHandler);
      } catch (error) {
        logger.error('Error setting up scroll depth tracking:', error as Record<string, unknown>);
        return () => {};
      }
    };

    // Set up exit intent detection
    const trackExitIntent = () => {
      try {
        const exitHandler = (e: MouseEvent) => {
          try {
            if (e.clientY <= 0) {
              const timeOnPage = Date.now() - startTimeRef.current;
              behaviorEvent.exitIntent(pathname, timeOnPage);
            }
          } catch (error) {
            logger.error('Error in exit handler:', error as Record<string, unknown>);
          }
        };

        document.addEventListener('mouseleave', exitHandler);
        return () => document.removeEventListener('mouseleave', exitHandler);
      } catch (error) {
        logger.error('Error setting up exit intent tracking:', error as Record<string, unknown>);
        return () => {};
      }
    };

    // Initialize tracking
    setTimeout(() => {
      trackPageLoad();
      trackFunnelEvent();
      trackSEOMetrics();
      trackOrganicArrival();
      webVitalsTracking.trackWebVitals();
    }, 100);

    const cleanupScrollTracking = trackScrollDepth();
    const cleanupExitTracking = trackExitIntent();

    // Track time on page when component unmounts
    return () => {
      try {
        const timeOnPage = Date.now() - startTimeRef.current;
        behaviorEvent.timeOnPage(pathname, timeOnPage);
        
        cleanupScrollTracking();
        cleanupExitTracking();
      } catch (error) {
        logger.error('Error in cleanup:', error as Record<string, unknown>);
      }
    };
  }, [pathname, pageType, productId, productName, categoryName]);

  // Track visibility changes (tab switching)
  useEffect(() => {
    try {
      const handleVisibilityChange = () => {
        try {
          if (document.visibilityState === 'hidden') {
            const timeOnPage = Date.now() - startTimeRef.current;
            behaviorEvent.timeOnPage(pathname, timeOnPage);
          } else if (document.visibilityState === 'visible') {
            startTimeRef.current = Date.now();
          }
        } catch (error) {
          logger.error('Error in visibility change handler:', error as Record<string, unknown>);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    } catch (error) {
      logger.error('Error setting up visibility change tracking:', error as Record<string, unknown>);
      return () => {};
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}