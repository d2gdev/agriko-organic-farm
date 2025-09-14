import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-sanitizer';
import { withExternalAPIRetry } from '@/lib/retry-handler';

// Timeout configuration based on operation type
export const TIMEOUT_CONFIGS = {
  // Critical user-facing operations
  critical: {
    timeout: 5000,
    retries: 3,
    description: 'Critical user-facing operations (checkout, payments)',
  },

  // Standard API calls
  standard: {
    timeout: 10000,
    retries: 2,
    description: 'Standard API operations (product fetch, user data)',
  },

  // Background operations
  background: {
    timeout: 30000,
    retries: 1,
    description: 'Background operations (analytics, monitoring)',
  },

  // File uploads
  upload: {
    timeout: 60000,
    retries: 1,
    description: 'File upload operations',
  },

  // External third-party APIs
  external: {
    timeout: 15000,
    retries: 2,
    description: 'External third-party API calls',
  },
} as const;

export type TimeoutLevel = keyof typeof TIMEOUT_CONFIGS;

interface ReliableFetchOptions extends RequestInit {
  timeoutLevel?: TimeoutLevel;
  customTimeout?: number;
  retries?: number;
  includeAuth?: boolean;
  onTimeout?: () => void;
  onRetry?: (attempt: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Enhanced fetch with timeout, retry, and error handling
 */
export async function reliableFetch(
  url: string,
  options: ReliableFetchOptions = {}
): Promise<Response> {
  const {
    timeoutLevel = 'standard',
    customTimeout,
    retries,
    onTimeout,
    onRetry,
    onError,
    ...fetchOptions
  } = options;

  const config = TIMEOUT_CONFIGS[timeoutLevel];
  const timeoutMs = customTimeout || config.timeout;
  const maxRetries = retries !== undefined ? retries : config.retries;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    if (onTimeout) {
      onTimeout();
    }
  }, timeoutMs);

  try {
    // Add signal to fetch options
    const enhancedOptions: RequestInit = {
      ...fetchOptions,
      signal: controller.signal,
    };

    // Log the request
    logger.debug('🔄 Reliable fetch initiated', {
      url,
      timeoutLevel,
      timeoutMs,
      maxRetries,
    });

    // Wrap with retry logic if retries are enabled
    if (maxRetries > 0) {
      return await withExternalAPIRetry(
        async () => {
          const response = await fetch(url, enhancedOptions);

          // Check for successful response
          if (!response.ok && response.status >= 500) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }

          return response;
        },
        url,
        {
          maxAttempts: maxRetries,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
          onRetry: (attempt: number, error: unknown) => {
            logger.warn('⚠️ Fetch retry attempt', {
              url,
              attempt,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            if (onRetry) {
              onRetry(attempt);
            }
          },
        }
      );
    } else {
      // Single attempt without retry
      return await fetch(url, enhancedOptions);
    }
  } catch (error: unknown) {
    // Clear the timeout
    clearTimeout(timeoutId);

    // Handle specific error types
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error(
        `Request timeout after ${timeoutMs}ms for ${url}`
      );
      logger.error('⏱️ Fetch timeout', {
        url,
        timeoutMs,
        timeoutLevel,
      });
      if (onError) {
        onError(timeoutError);
      }
      throw timeoutError;
    }

    // Log and handle other errors
    const sanitizedError = handleError(error, 'reliableFetch');

    logger.error('❌ Fetch failed', {
      url,
      error: sanitizedError.message,
      timeoutLevel,
    });

    if (onError) {
      onError(new Error(String(sanitizedError?.message || 'Unknown error')));
    }

    throw sanitizedError;
  } finally {
    // Always clear the timeout
    clearTimeout(timeoutId);
  }
}

/**
 * Batch fetch with concurrent request limiting
 */
export async function batchFetch(
  urls: string[],
  options: ReliableFetchOptions & { concurrency?: number } = {}
): Promise<Response[]> {
  const { concurrency = 5, ...fetchOptions } = options;

  const results: Response[] = [];
  const errors: Error[] = [];

  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchPromises = batch.map((url) =>
      reliableFetch(url, fetchOptions).catch((error) => {
        errors.push(error);
        return null;
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is Response => r !== null));
  }

  // Log batch completion
  logger.info('📦 Batch fetch completed', {
    totalUrls: urls.length,
    successful: results.length,
    failed: errors.length,
  });

  // If all requests failed, throw an aggregate error
  if (results.length === 0 && errors.length > 0) {
    throw new AggregateError(errors, 'All batch requests failed');
  }

  return results;
}

/**
 * Fetch with automatic JSON parsing and validation
 */
export async function fetchJSON<T>(
  url: string,
  options: ReliableFetchOptions = {}
): Promise<T> {
  const response = await reliableFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch JSON from ${url}: ${response.status} ${response.statusText}`
    );
  }

  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response from ${url}: ${error}`);
  }
}

/**
 * Health check with timeout
 */
export async function healthCheck(
  url: string,
  timeoutMs: number = 5000
): Promise<boolean> {
  try {
    const response = await reliableFetch(url, {
      method: 'HEAD',
      customTimeout: timeoutMs,
      retries: 0,
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch with progress tracking for large downloads
 */
export async function fetchWithProgress(
  url: string,
  onProgress?: (loaded: number, total: number) => void,
  options: ReliableFetchOptions = {}
): Promise<Blob> {
  const response = await reliableFetch(url, options);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    loaded += value.length;

    if (onProgress && total > 0) {
      onProgress(loaded, total);
    }
  }

  return new Blob(chunks as BlobPart[]);
}

export default reliableFetch;