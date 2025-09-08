'use client';

import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';

interface TimeoutFallbackProps {
  children: ReactNode;
  timeoutMs?: number;
  fallback?: ReactNode;
}

export default function TimeoutFallback({ 
  children, 
  timeoutMs = 15000,
  fallback 
}: TimeoutFallbackProps) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  if (showFallback) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Taking longer than expected...
          </h2>
          <p className="text-gray-600 mb-6">
            The page is taking a while to load. This might be due to a slow connection or server issues.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors mr-4"
            >
              Refresh Page
            </button>
            <Link 
              href="/" 
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors inline-block"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}