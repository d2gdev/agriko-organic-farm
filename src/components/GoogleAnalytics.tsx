'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

import { usePathname, useSearchParams } from 'next/navigation';
import { pageview, GA_TRACKING_ID } from '@/lib/gtag';
import Script from 'next/script';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      if (!GA_TRACKING_ID) return;

      const url = pathname + searchParams.toString();
      pageview(url);
    } catch (error) {
      logger.error('Error in Google Analytics pageview:', error as Record<string, unknown>);
    }
  }, [pathname, searchParams]);

  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onError={(error) => {
          logger.error('Error loading Google Analytics script:', error as Record<string, unknown>);
        }}
      />
      <Script strategy="lazyOnload" id="google-analytics">
        {`
          try {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          } catch (error) {
            logger.error('Error initializing Google Analytics:', error as Record<string, unknown>);
          }
        `}
      </Script>
    </>
  );
}