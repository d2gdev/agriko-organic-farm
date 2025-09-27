'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function ErrorHandler() {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent the default behavior
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      logger.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };

    // Handle unhandled errors in event handlers
    const handleGlobalError = (event: Event) => {
      if (event.type === 'error') {
        const errorEvent = event as ErrorEvent;
        logger.error('Error event caught:', {
          type: errorEvent.type,
          message: errorEvent.message,
          filename: errorEvent.filename,
          lineno: errorEvent.lineno,
          colno: errorEvent.colno
        });
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    window.addEventListener('error', handleGlobalError, true);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  return null; // This component doesn't render anything
}