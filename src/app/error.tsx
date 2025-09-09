'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">Oops!</h1>
        <h2 className="text-3xl font-semibold text-neutral-900 mb-6">Something went wrong</h2>
        <p className="text-neutral-600 mb-8 leading-relaxed">
          We encountered an unexpected error. This might be a temporary issue.
        </p>
        <div className="space-y-4">
          <button 
            onClick={reset}
            className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors mr-4"
          >
            Try Again
          </button>
          <Link 
            href="/"
            className="inline-block bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}