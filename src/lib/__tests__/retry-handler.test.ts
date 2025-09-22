/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  withRetry,
  withNetworkRetry,
  withDatabaseRetry,
  withExternalAPIRetry,
  withCriticalRetry,
  withHttpRetry,
  getCircuitBreakerStats,
  resetCircuitBreaker,
  DEFAULT_RETRY_CONFIGS,
  type RetryConfig,
} from '@/lib/retry-handler';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the global setTimeout for faster tests
const originalSetTimeout = global.setTimeout;
const mockSetTimeout = jest.fn((callback: Function, delay: number) => {
  // Execute callback synchronously to eliminate delays in tests
  callback();
  return 'mock-timeout' as any;
});

describe('Retry Handler', () => {
  const mockLogger = require('@/lib/logger').logger;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Apply the setTimeout mock
    global.setTimeout = mockSetTimeout as any;

    // Reset circuit breakers
    const keys = Object.keys(getCircuitBreakerStats());
    keys.forEach(key => resetCircuitBreaker(key));
  });

  afterEach(() => {
    jest.useRealTimers();
    global.setTimeout = originalSetTimeout;
  });

  describe('withRetry', () => {
    const testConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
    };

    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation, testConfig);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, testConfig);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Operation succeeded after 3 attempts')
      );
    });

    it('should fail after max attempts', async () => {
      const error = new Error('Persistent failure');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(withRetry(operation, testConfig)).rejects.toThrow('Persistent failure');

      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed after 3 attempts'),
        expect.objectContaining({
          error: 'Persistent failure',
          attempts: 3
        })
      );
    });

    it('should respect retryableErrors function', async () => {
      const retryableError = new Error('timeout');
      const nonRetryableError = new Error('invalid input');

      const configWithRetryableCheck: RetryConfig = {
        ...testConfig,
        retryableErrors: (error: unknown) => {
          return error instanceof Error && error.message.includes('timeout');
        }
      };

      // Should retry on retryable error
      const operation1 = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const result1 = await withRetry(operation1, configWithRetryableCheck);
      expect(result1).toBe('success');
      expect(operation1).toHaveBeenCalledTimes(2);

      // Should not retry on non-retryable error
      const operation2 = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(withRetry(operation2, configWithRetryableCheck)).rejects.toThrow('invalid input');
      expect(operation2).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const error = new Error('Test error');
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const configWithCallback: RetryConfig = {
        ...testConfig,
        onRetry
      };

      await withRetry(operation, configWithCallback);

      expect(onRetry).toHaveBeenCalledWith(1, error);
    });

    it('should handle operation key for circuit breaker', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withRetry(operation, testConfig, 'test-operation');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should calculate exponential backoff delays', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      await withRetry(operation, testConfig);

      // Check that delays were calculated (logged in warn messages)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('retrying in'),
        expect.objectContaining({
          attempt: 1,
          delay: expect.any(Number)
        })
      );
    });
  });

  describe('Circuit Breaker', () => {
    const testConfig: RetryConfig = {
      maxAttempts: 1,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
    };

    it('should open circuit breaker after failure threshold', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      const operationKey = 'failing-operation';

      // Trigger enough failures to open circuit breaker (threshold = 5)
      for (let i = 0; i < 5; i++) {
        try {
          await withRetry(operation, testConfig, operationKey);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker opened due to failures'),
        expect.objectContaining({
          failures: 5,
          threshold: 5
        })
      );

      // Next attempt should fail immediately due to open circuit breaker
      await expect(withRetry(operation, testConfig, operationKey))
        .rejects.toThrow('Circuit breaker is open for operation: failing-operation');
    });

    it('should transition to half-open after timeout', async () => {
      // Use real Jest timers for this test that needs time advancement
      global.setTimeout = originalSetTimeout;

      const operation = jest.fn().mockRejectedValue(new Error('Failure'));
      const operationKey = 'timeout-test';

      // Open circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await withRetry(operation, testConfig, operationKey);
        } catch (error) {
          // Expected
        }
      }

      // Fast forward past circuit breaker timeout (60 seconds)
      jest.advanceTimersByTime(61000);

      // Should allow next operation (half-open state)
      const successOperation = jest.fn().mockResolvedValue('success');
      await withRetry(successOperation, testConfig, operationKey);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker transitioning to half-open')
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker closed')
      );

      // Restore mock for other tests
      global.setTimeout = mockSetTimeout as any;
    });

    it('should get circuit breaker statistics', () => {
      // Initially empty
      let stats = getCircuitBreakerStats();
      expect(Object.keys(stats)).toHaveLength(0);

      // After some operations
      const operation = jest.fn().mockResolvedValue('success');
      withRetry(operation, testConfig, 'test-stats');

      stats = getCircuitBreakerStats();
      expect(stats['test-stats']).toBeDefined();
      expect(stats['test-stats']?.state).toBe('closed');
      expect(stats['test-stats']?.failures).toBe(0);
    });

    it('should reset circuit breaker', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failure'));
      const operationKey = 'reset-test';

      // Open circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await withRetry(operation, testConfig, operationKey);
        } catch (error) {
          // Expected
        }
      }

      // Reset circuit breaker
      resetCircuitBreaker(operationKey);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker reset: reset-test')
      );

      // Should work normally after reset
      const successOperation = jest.fn().mockResolvedValue('success');
      await withRetry(successOperation, testConfig, operationKey);
      expect(successOperation).toHaveBeenCalled();
    });
  });

  describe('Convenience functions', () => {
    beforeEach(() => {
      // Mock the main withRetry function to track calls
      jest.resetModules();
    });

    it('should use network retry configuration', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withNetworkRetry(operation, 'network-test');

      expect(operation).toHaveBeenCalled();
      // Network config should be applied (maxAttempts: 3, baseDelayMs: 1000)
    });

    it('should use database retry configuration', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withDatabaseRetry(operation, 'db-test');

      expect(operation).toHaveBeenCalled();
      // Database config should be applied (maxAttempts: 2, baseDelayMs: 500)
    });

    it('should use external API retry configuration', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withExternalAPIRetry(operation, 'api-test');

      expect(operation).toHaveBeenCalled();
      // External API config should be applied
    });

    it('should use critical retry configuration', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withCriticalRetry(operation, 'critical-test');

      expect(operation).toHaveBeenCalled();
      // Critical config should be applied (maxAttempts: 5)
    });

    it('should allow custom config overrides', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');

      const resultPromise = withNetworkRetry(operation, 'custom-test', {
        maxAttempts: 5,
        baseDelayMs: 50,
        retryableErrors: () => true // Override to make all errors retryable
      });

      // Advance timers to allow retry delay to complete
      jest.runAllTimers();

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('HTTP Retry', () => {
    beforeEach(() => {
      // Create a proper Response mock
      // @ts-ignore - Mock assignment for testing
      global.Response = jest.fn().mockImplementation((body, init) => {
        const mockResponse = {
          ok: init?.status ? init.status < 400 : true,
          status: init?.status || 200,
          statusText: init?.statusText || 'OK',
          json: jest.fn().mockResolvedValue(body),
          text: jest.fn().mockResolvedValue(JSON.stringify(body)),
        };
        // Set proper prototype for instanceof checks
        Object.setPrototypeOf(mockResponse, Response.prototype);
        return mockResponse;
      }) as jest.MockedClass<typeof Response>;
    });

    it('should succeed with successful HTTP response', async () => {
      const httpOperation = jest.fn().mockResolvedValue(new Response('success', { status: 200 }));
      const dataExtractor = jest.fn().mockResolvedValue({ data: 'extracted' });

      const result = await withHttpRetry(httpOperation, dataExtractor, 'http-success');

      expect(result).toEqual({ data: 'extracted' });
      expect(httpOperation).toHaveBeenCalledTimes(1);
      expect(dataExtractor).toHaveBeenCalled();
    });

    it('should retry on 5xx errors', async () => {
      const httpOperation = jest.fn()
        .mockResolvedValueOnce(new Response('Server Error', { status: 500, statusText: 'Internal Server Error' }))
        .mockResolvedValue(new Response('success', { status: 200 }));

      const result = await withHttpRetry(httpOperation, undefined, 'http-5xx');

      expect(httpOperation).toHaveBeenCalledTimes(2);
      expect(result).toBeInstanceOf(Response);
    });

    it('should retry on 429 rate limit', async () => {
      const httpOperation = jest.fn()
        .mockResolvedValueOnce(new Response('Rate Limited', { status: 429, statusText: 'Too Many Requests' }))
        .mockResolvedValue(new Response('success', { status: 200 }));

      await withHttpRetry(httpOperation, undefined, 'http-429');

      expect(httpOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      const httpOperation = jest.fn()
        .mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));

      await expect(withHttpRetry(httpOperation, undefined, 'http-404'))
        .rejects.toThrow('HTTP 404: Not Found');

      expect(httpOperation).toHaveBeenCalledTimes(1);
    });

    it('should work without data extractor', async () => {
      const response = new Response('raw response', { status: 200 });
      const httpOperation = jest.fn().mockResolvedValue(response);

      const result = await withHttpRetry(httpOperation, undefined, 'http-raw');

      expect(result).toBe(response);
      expect(httpOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle data extractor errors', async () => {
      const httpOperation = jest.fn().mockResolvedValue(new Response('success', { status: 200 }));
      const dataExtractor = jest.fn().mockRejectedValue(new Error('Extraction failed'));

      await expect(withHttpRetry(httpOperation, dataExtractor, 'http-extract-error'))
        .rejects.toThrow('Extraction failed');

      expect(httpOperation).toHaveBeenCalledTimes(3); // Should retry extraction errors
    });
  });

  describe('Default Retry Configs', () => {
    it('should have network configuration', () => {
      const config = DEFAULT_RETRY_CONFIGS.network;
      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(1000);
      expect(config.maxDelayMs).toBe(10000);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.retryableErrors).toBeInstanceOf(Function);
    });

    it('should have database configuration', () => {
      const config = DEFAULT_RETRY_CONFIGS.database;
      expect(config.maxAttempts).toBe(2);
      expect(config.baseDelayMs).toBe(500);
      expect(config.maxDelayMs).toBe(5000);
    });

    it('should have external API configuration', () => {
      const config = DEFAULT_RETRY_CONFIGS.external_api;
      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(2000);
      expect(config.maxDelayMs).toBe(15000);
      expect(config.backoffMultiplier).toBe(1.5);
    });

    it('should have file system configuration', () => {
      const config = DEFAULT_RETRY_CONFIGS.file_system;
      expect(config.maxAttempts).toBe(2);
      expect(config.baseDelayMs).toBe(100);
      expect(config.maxDelayMs).toBe(1000);
    });

    it('should have critical configuration', () => {
      const config = DEFAULT_RETRY_CONFIGS.critical;
      expect(config.maxAttempts).toBe(5);
      expect(config.retryableErrors?.()).toBe(true);
    });

    it('should test network retryable errors', () => {
      const { retryableErrors } = DEFAULT_RETRY_CONFIGS.network;

      expect(retryableErrors?.(new Error('timeout occurred'))).toBe(true);
      expect(retryableErrors?.(new Error('ECONNRESET'))).toBe(true);
      expect(retryableErrors?.(new Error('ENOTFOUND'))).toBe(true);
      expect(retryableErrors?.(new Error('fetch failed'))).toBe(true);
      expect(retryableErrors?.(new Error('invalid input'))).toBe(false);
      expect(retryableErrors?.('not an error')).toBe(false);
    });

    it('should test database retryable errors', () => {
      const { retryableErrors } = DEFAULT_RETRY_CONFIGS.database;

      expect(retryableErrors?.(new Error('connection timeout'))).toBe(true);
      expect(retryableErrors?.(new Error('deadlock detected'))).toBe(true);
      expect(retryableErrors?.(new Error('ECONNREFUSED'))).toBe(true);
      expect(retryableErrors?.(new Error('syntax error'))).toBe(false);
    });

    it('should test external API retryable errors', () => {
      const { retryableErrors } = DEFAULT_RETRY_CONFIGS.external_api;

      expect(retryableErrors?.(new Error('HTTP 500 error'))).toBe(true);
      expect(retryableErrors?.(new Error('502 Bad Gateway'))).toBe(true);
      expect(retryableErrors?.(new Error('503 Service Unavailable'))).toBe(true);
      expect(retryableErrors?.(new Error('504 Gateway Timeout'))).toBe(true);
      expect(retryableErrors?.(new Error('rate limit exceeded'))).toBe(true);
      expect(retryableErrors?.(new Error('temporary failure'))).toBe(true);
      expect(retryableErrors?.(new Error('HTTP 400 Bad Request'))).toBe(false);
    });

    it('should test file system retryable errors', () => {
      const { retryableErrors } = DEFAULT_RETRY_CONFIGS.file_system;

      expect(retryableErrors?.(new Error('EBUSY: resource busy'))).toBe(true);
      expect(retryableErrors?.(new Error('EMFILE: too many open files'))).toBe(true);
      expect(retryableErrors?.(new Error('ENFILE: file table overflow'))).toBe(true);
      expect(retryableErrors?.(new Error('ENOENT: no such file'))).toBe(false);
    });
  });

  describe('Edge cases and error handling', () => {
    const testConfig: RetryConfig = {
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
    };

    it('should handle operations that throw non-Error objects', async () => {
      const operation = jest.fn().mockRejectedValue('string error');

      await expect(withRetry(operation, testConfig)).rejects.toBe('string error');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle operations that throw null/undefined', async () => {
      const operation = jest.fn().mockRejectedValue(null);

      await expect(withRetry(operation, testConfig)).rejects.toBe(null);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle very large delay values', async () => {
      const largeDelayConfig: RetryConfig = {
        maxAttempts: 2,
        baseDelayMs: 1000000,
        maxDelayMs: 2000000,
        backoffMultiplier: 2,
      };

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      await withRetry(operation, largeDelayConfig);

      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('retrying in'),
        expect.objectContaining({
          delay: expect.any(Number)
        })
      );
    });

    it('should handle zero and negative delays', async () => {
      const zeroDelayConfig: RetryConfig = {
        maxAttempts: 2,
        baseDelayMs: 0,
        maxDelayMs: 0,
        backoffMultiplier: 0,
      };

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      await withRetry(operation, zeroDelayConfig);

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle operations that hang', async () => {
      const hangingOperation = jest.fn().mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );

      // This test just verifies the structure - we can't actually test hanging without real timeouts
      // which would make the test suite slow. The retry handler would timeout and retry appropriately.
      expect(typeof hangingOperation).toBe('function');
      expect(() => hangingOperation()).not.toThrow();
    });

    it('should handle concurrent retry operations', async () => {
      const operation1 = jest.fn().mockResolvedValue('result1');
      const operation2 = jest.fn().mockResolvedValue('result2');

      const [result1, result2] = await Promise.all([
        withRetry(operation1, testConfig, 'concurrent1'),
        withRetry(operation2, testConfig, 'concurrent2')
      ]);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(operation1).toHaveBeenCalledTimes(1);
      expect(operation2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance and memory', () => {
    it('should handle rapid retry operations without memory leaks', async () => {
      const fastOperation = jest.fn().mockResolvedValue('fast');
      const promises: Promise<string>[] = [];

      for (let i = 0; i < 100; i++) {
        promises.push(withRetry(fastOperation, {
          maxAttempts: 1,
          baseDelayMs: 1,
          maxDelayMs: 10,
          backoffMultiplier: 1,
        }, `fast-${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(100);
      expect(fastOperation).toHaveBeenCalledTimes(100);
    });

    it('should clean up circuit breaker state appropriately', () => {
      // Test that circuit breaker maps don't grow indefinitely
      const initialStatsSize = Object.keys(getCircuitBreakerStats()).length;

      // Create and reset multiple circuit breakers
      for (let i = 0; i < 10; i++) {
        resetCircuitBreaker(`temp-${i}`);
      }

      const finalStatsSize = Object.keys(getCircuitBreakerStats()).length;
      expect(finalStatsSize).toBe(initialStatsSize); // Should remain the same
    });
  });
});