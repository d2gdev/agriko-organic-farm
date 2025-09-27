'use client';

import dynamic from 'next/dynamic';

const PageAnalytics = dynamic(() => import('@/components/PageAnalytics'), {
  ssr: false
});

interface ClientPageAnalyticsProps {
  pageType: 'homepage' | 'product' | 'category' | 'cart' | 'checkout' | 'other';
}

export default function ClientPageAnalytics({ pageType }: ClientPageAnalyticsProps) {
  return <PageAnalytics pageType={pageType} />;
}