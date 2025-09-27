'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

import { usePathname, useSearchParams } from 'next/navigation';
import { pageview, GA_TRACKING_ID } from '@/lib/gtag';
import Script from 'next/script';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if we're on localhost - do this inside component for proper hydration
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.startsWith('192.168.'));

  useEffect(() => {
    try {
      if (!GA_TRACKING_ID || isLocalhost) {
        if (isLocalhost) {
          logger.debug('GoogleAnalytics: Disabled on localhost');
          // Disable gtag to prevent any events from firing
          if (typeof window !== 'undefined') {
            (window as Window & typeof globalThis & { gtag?: () => void }).gtag = () => {};
          }
        } else {
          logger.warn('GoogleAnalytics: No tracking ID found');
        }
        return;
      }

      const url = pathname + searchParams.toString();
      logger.debug('GoogleAnalytics: Tracking pageview', { url, trackingId: GA_TRACKING_ID });
      pageview(url);
    } catch (error) {
      logger.error('Error in Google Analytics pageview:', error as Record<string, unknown>);
    }
  }, [pathname, searchParams, isLocalhost]);

  // Don't render GA scripts on localhost at all
  if (!GA_TRACKING_ID || isLocalhost) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onLoad={() => {
          logger.debug('GoogleAnalytics: Script loaded successfully');
        }}
        onError={(error) => {
          logger.error('Error loading Google Analytics script:', error as Record<string, unknown>);
        }}
      />
      <Script
        strategy="afterInteractive"
        id="google-analytics"
        onLoad={() => {
          logger.debug('GoogleAnalytics: Initialization script loaded');
        }}
      >
        {`
          try {
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            window.gtag('js', new Date());
            window.gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          } catch (error) {
            console.error('Error initializing Google Analytics:', error);
          }
        `}
      </Script>
    </>
  );
}