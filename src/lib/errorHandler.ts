import { logger } from '@/lib/logger';
// Global error handler for unhandled promise rejections and other errors
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection:', event.reason);
      // Prevent the default browser behavior
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      logger.error('Uncaught error:', event.error);
      // Prevent the default browser behavior for script errors
      if (event.error instanceof Error) {
        event.preventDefault();
      }
    });
  }
}

// Call this function in your app's entry point (e.g., layout.tsx or page.tsx)
export default setupGlobalErrorHandlers;