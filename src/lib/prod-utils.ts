// Production Environment Utilities
import { logger } from '@/lib/logger';

export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';

// Production-safe logging
export const prodLog = (message: string, data?: unknown) => {
  if (!isProd) {
    logger.debug(message, data as Record<string, unknown>);
  }
};

// Memory usage monitoring
export const checkMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);

    if (usedMB > 45) { // Warn at 45MB to stay under 50MB limit
      if (!isProd) {
        console.warn(`Memory usage high: ${usedMB}MB`);
      }
    }

    return { usedMB, totalMB: Math.round(usage.heapTotal / 1024 / 1024) };
  }
  return null;
};

// Production-safe error handling
export const prodError = (error: unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (isProd) {
    // In production, log sanitized errors only
    logger.error(`Error${context ? ` in ${context}` : ''}: ${errorMessage}`);
  } else {
    // In development, show full error details
    logger.error(`Error${context ? ` in ${context}` : ''}:`, error as Record<string, unknown>);
  }
};
