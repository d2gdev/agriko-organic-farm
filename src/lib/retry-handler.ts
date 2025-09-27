import { logger } from '@/lib/logger';

// Retry configuration for different operation types
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

// Default retry configurations for different scenarios
export const DEFAULT_RETRY_CONFIGS = {
  // Network operations (API calls, external services)
  network: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: (error: unknown) => {
      if (error instanceof Error) {
        // Retry on network errors, timeouts, and 5xx server errors
        return error.message.includes('timeout') ||
               error.message.includes('ECONNRESET') ||
               error.message.includes('ENOTFOUND') ||
               error.message.includes('fetch failed');
      }
      return false;
    }
  },

  // Database operations
  database: {
    maxAttempts: 2,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    retryableErrors: (error: unknown) => {
      if (error instanceof Error) {
        // Retry on connection errors, timeouts, deadlocks
        return error.message.includes('timeout') ||
               error.message.includes('connection') ||
               error.message.includes('deadlock') ||
               error.message.includes('ECONNREFUSED');
      }
      return false;
    }
  },

  // External API calls (WooCommerce, AI services)
  external_api: {
    maxAttempts: 3,
    baseDelayMs: 2000,
    maxDelayMs: 15000,
    backoffMultiplier: 1.5,
    retryableErrors: (error: unknown) => {
      if (error instanceof Error) {
        // Check for HTTP status codes in error message
        const message = error.message.toLowerCase();
        return message.includes('500') ||
               message.includes('502') ||
               message.includes('503') ||
               message.includes('504') ||
               message.includes('timeout') ||
               message.includes('rate limit') ||
               message.includes('temporary');
      }
      return false;
    }
  },

  // File operations
  file_system: {
    maxAttempts: 2,
    baseDelayMs: 100,
    maxDelayMs: 1000,
    backoffMultiplier: 2,
    retryableErrors: (error: unknown) => {
      if (error instanceof Error) {
        return error.message.includes('EBUSY') ||
               error.message.includes('EMFILE') ||
               error.message.includes('ENFILE');
      }
      return false;
    }
  },

  // Critical operations (should retry more aggressively)
  critical: {
    maxAttempts: 5,
    baseDelayMs: 500,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: () => true // Retry all errors for critical operations
  }
};

// Circuit breaker state for preventing cascading failures
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

// Circuit breaker configuration
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  timeout: 60000, // 1 minute
  halfOpenRetryTimeout: 30000 // 30 seconds
};

// Check if circuit breaker allows operation
function checkCircuitBreaker(key: string): boolean {
  const state = circuitBreakers.get(key);
  if (!state) {
    circuitBreakers.set(key, {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed'
    });
    return true;
  }

  const now = Date.now();

  switch (state.state) {
    case 'closed':
      return true;

    case 'open':
      if (now - state.lastFailureTime > CIRCUIT_BREAKER_CONFIG.timeout) {
        state.state = 'half-open';
        logger.info(`Circuit breaker transitioning to half-open: ${key}`);
        return true;
      }
      return false;

    case 'half-open':
      return true;

    default:
      return true;
  }
}

// Update circuit breaker state after operation
function updateCircuitBreaker(key: string, success: boolean): void {
  const state = circuitBreakers.get(key);
  if (!state) return;

  if (success) {
    if (state.state === 'half-open') {
      state.state = 'closed';
      state.failures = 0;
      logger.info(`Circuit breaker closed: ${key}`);
    } else if (state.state === 'closed') {
      state.failures = Math.max(0, state.failures - 1);
    }
  } else {
    state.failures++;
    state.lastFailureTime = Date.now();

    if (state.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      state.state = 'open';
      logger.warn(`Circuit breaker opened due to failures: ${key}`, {
        failures: state.failures,
        threshold: CIRCUIT_BREAKER_CONFIG.failureThreshold
      });
    }
  }
}

// Sleep utility for delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Calculate next delay with jitter to prevent thundering herd
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Validate and cap delay values to prevent excessive waits
  const safeBaseDelay = Math.min(config.baseDelayMs, 30000); // Max 30s base delay
  const safeMaxDelay = Math.min(config.maxDelayMs, 60000); // Max 60s total delay

  const exponentialDelay = Math.min(
    safeBaseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    safeMaxDelay
  );

  // Add jitter (±25% randomization)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, exponentialDelay + jitter);
}

// Main retry function with circuit breaker protection
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  operationKey?: string
): Promise<T> {
  const key = operationKey ?? 'default';

  // Check circuit breaker
  if (!checkCircuitBreaker(key)) {
    throw new Error(`Circuit breaker is open for operation: ${key}`);
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // Success - update circuit breaker
      updateCircuitBreaker(key, true);
      
      if (attempt > 1) {
        logger.info(`Operation succeeded after ${attempt} attempts: ${key}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = config.retryableErrors ? config.retryableErrors(error) : true;
      
      if (!isRetryable || attempt === config.maxAttempts) {
        // Final failure - update circuit breaker
        updateCircuitBreaker(key, false);
        
        // Check if we're on localhost to reduce noisy error logs
        const isLocalhost = (typeof window !== 'undefined' && (
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.startsWith('192.168.')
        )) || (
          // Server-side detection: check if the operation key indicates localhost
          typeof key === 'string' && (
            key.includes('localhost') ||
            key.includes('127.0.0.1') ||
            key.includes('192.168.') ||
            // In development, assume localhost for API calls
            (process.env.NODE_ENV === 'development' && key.startsWith('/api/'))
          )
        );

        const logLevel = isLocalhost ? 'debug' : 'error';
        const logMessage = `Operation failed after ${attempt} attempts: ${key}`;
        const logData = {
          error: error instanceof Error ? error.message : String(error),
          isRetryable,
          attempts: attempt
        } as Record<string, unknown>;

        if (logLevel === 'debug') {
          logger.debug(logMessage, logData);
        } else {
          logger.error(logMessage, logData);
        }
        
        throw error;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, config);
      
      // Call retry callback if provided
      if (config.onRetry) {
        config.onRetry(attempt, error);
      }

      logger.warn(`Operation failed, retrying in ${delay}ms: ${key}`, {
        attempt,
        maxAttempts: config.maxAttempts,
        error: error instanceof Error ? error.message : String(error),
        delay
      });

      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

// Convenience functions for common retry scenarios
export function withNetworkRetry<T>(
  operation: () => Promise<T>,
  operationKey?: string,
  customConfig?: Partial<RetryConfig>
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIGS.network, ...customConfig };
  return withRetry(operation, config, operationKey);
}

export function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationKey?: string,
  customConfig?: Partial<RetryConfig>
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIGS.database, ...customConfig };
  return withRetry(operation, config, operationKey);
}

export function withExternalAPIRetry<T>(
  operation: () => Promise<T>,
  operationKey?: string,
  customConfig?: Partial<RetryConfig>
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIGS.external_api, ...customConfig };
  return withRetry(operation, config, operationKey);
}

export function withCriticalRetry<T>(
  operation: () => Promise<T>,
  operationKey?: string,
  customConfig?: Partial<RetryConfig>
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIGS.critical, ...customConfig };
  return withRetry(operation, config, operationKey);
}

// HTTP-specific retry with status code awareness
export async function withHttpRetry<T>(
  httpOperation: () => Promise<Response>,
  dataExtractor: (response: Response) => Promise<T>,
  operationKey?: string
): Promise<T>;
export async function withHttpRetry(
  httpOperation: () => Promise<Response>,
  dataExtractor?: undefined,
  operationKey?: string
): Promise<Response>;
export async function withHttpRetry<T>(
  httpOperation: () => Promise<Response>,
  dataExtractor?: (response: Response) => Promise<T>,
  operationKey?: string
): Promise<T | Response> {
  const config: RetryConfig = {
    ...DEFAULT_RETRY_CONFIGS.external_api,
    retryableErrors: (error: unknown) => {
      // Always check the default network retryable errors first
      if (DEFAULT_RETRY_CONFIGS.external_api.retryableErrors?.(error)) {
        return true;
      }

      // HTTP-specific retry logic for status codes and extraction errors
      if (error instanceof Error) {
        // Retry on 5xx server errors, 429 rate limiting, and data extraction errors
        return error.message.includes('HTTP 5') ||
               error.message.includes('HTTP 429') ||
               error.message.includes('Extraction failed');
      }

      return false;
    }
  };

  return withRetry(async () => {
    const response = await httpOperation();
    
    // Check for HTTP error status codes
    if (!response.ok) {
      const status = response.status;
      
      // 4xx errors are generally not retryable (except rate limiting)
      if (status >= 400 && status < 500 && status !== 429) {
        throw new Error(`HTTP ${status}: ${response.statusText}`);
      }
      
      // 5xx errors and 429 are retryable
      if (status >= 500 || status === 429) {
        throw new Error(`HTTP ${status}: ${response.statusText}`);
      }
    }
    
    // Extract data if extractor provided, otherwise return response as-is
    if (dataExtractor) {
      return await dataExtractor(response);
    }

    return response;
  }, config, operationKey);
}

// Get circuit breaker statistics for monitoring
export function getCircuitBreakerStats() {
  const stats: Record<string, CircuitBreakerState & { key: string }> = {};
  
  for (const [key, state] of circuitBreakers.entries()) {
    stats[key] = { ...state, key };
  }
  
  return stats;
}

// Reset circuit breaker (for testing or manual recovery)
export function resetCircuitBreaker(key: string): void {
  circuitBreakers.delete(key);
  logger.info(`Circuit breaker reset: ${key}`);
}

const retryHandlerModule = {
  withRetry,
  withNetworkRetry,
  withDatabaseRetry,
  withExternalAPIRetry,
  withCriticalRetry,
  withHttpRetry,
  getCircuitBreakerStats,
  resetCircuitBreaker,
  DEFAULT_RETRY_CONFIGS,
};

export default retryHandlerModule;
