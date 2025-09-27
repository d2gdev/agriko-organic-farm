'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { GA_TRACKING_ID, event, ecommerceEvent } from '@/lib/gtag';

export default function AnalyticsTest() {
  useEffect(() => {
    // Test analytics setup after a short delay to ensure scripts are loaded
    const testAnalytics = () => {
      logger.info('Testing Analytics Setup:', {
        trackingId: GA_TRACKING_ID,
        hasWindow: typeof window !== 'undefined',
        hasGtag: !!(typeof window !== 'undefined' && window.gtag),
        hasDataLayer: !!(typeof window !== 'undefined' && (window as Window & { dataLayer?: unknown[] }).dataLayer),
      });

      // Test a simple event
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        event('test_event', {
          event_category: 'debug',
          event_label: 'analytics_test',
          value: 1
        });

        // Test an ecommerce event
        ecommerceEvent.viewItem('test-123', 'Test Product', 'Test Category', 9.99);

        logger.info('Analytics test events sent successfully');
      } else {
        logger.warn('Analytics not ready - gtag not available');
      }
    };

    // Test immediately and after delays
    setTimeout(testAnalytics, 1000);
    setTimeout(testAnalytics, 5000);

    return () => {
      logger.debug('AnalyticsTest component cleanup');
    };
  }, []);

  return null; // This component doesn't render anything
}