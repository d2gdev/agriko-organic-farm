'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AutoTrackingProvider to avoid SSR issues
const DynamicAutoTrackingProvider = dynamic(
  () => import('./AutoTrackingProvider').then(mod => ({ default: mod.AutoTrackingProvider })),
  {
    ssr: false,
    loading: () => <div suppressHydrationWarning />,
  }
);

interface ClientOnlyAutoTrackingProviderProps {
  children: React.ReactNode;
}

export function ClientOnlyAutoTrackingProvider({ children }: ClientOnlyAutoTrackingProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always render children, but only wrap with tracking after mount
  if (!isMounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  // After hydration, render with full tracking capabilities
  return (
    <Suspense fallback={<div suppressHydrationWarning>{children}</div>}>
      <DynamicAutoTrackingProvider>
        {children}
      </DynamicAutoTrackingProvider>
    </Suspense>
  );
}