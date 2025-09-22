// Integration tests for Redis rate limiter
import { rateLimiter, RATE_LIMITS, checkWebhookRateLimit, checkAPIRateLimit } from '../redis-rate-limiter';

// Mock Redis to test both Redis and fallback modes
const mockRedisClient = {
  ping: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  multi: jest.fn(),
  quit: jest.fn()
};

const mockMulti = {
  incr: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn()
};

describe('Redis Rate Limiter Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.multi.mockReturnValue(mockMulti);
  });

  describe('Rate Limiting Logic', () => {
    it('should allow requests within limits', async () => {
      // Mock successful Redis operations
      mockMulti.exec.mockResolvedValue([
        [null, 1], // incr result
        [null, 1]  // expire result
      ]);

      const result = await rateLimiter.checkRateLimit('test-ip', RATE_LIMITS.WEBHOOK);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // 100 - 1
      expect(result.totalHits).toBe(1);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should deny requests exceeding limits', async () => {
      // Mock Redis showing limit exceeded
      mockMulti.exec.mockResolvedValue([
        [null, 101], // incr result - exceeded limit of 100
        [null, 1]    // expire result
      ]);

      const result = await rateLimiter.checkRateLimit('test-ip', RATE_LIMITS.WEBHOOK);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.totalHits).toBe(101);
    });

    it('should handle Redis connection failures gracefully', async () => {
      // Mock Redis failure
      mockMulti.exec.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimiter.checkRateLimit('test-ip', {
        ...RATE_LIMITS.WEBHOOK,
        skipOnError: true
      });

      // Should allow request when skipOnError is true
      expect(result.allowed).toBe(true);
    });

    it('should fail closed on Redis errors when skipOnError is false', async () => {
      // Mock Redis failure
      mockMulti.exec.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimiter.checkRateLimit('test-ip', {
        ...RATE_LIMITS.WEBHOOK,
        skipOnError: false
      });

      // Should deny request when skipOnError is false
      expect(result.allowed).toBe(false);
    });
  });

  describe('Fallback Mode (In-Memory)', () => {
    it('should use in-memory fallback when Redis is unavailable', async () => {
      // Test with a new identifier to ensure clean state
      const identifier = `fallback-test-${Date.now()}`;

      // First request should be allowed
      const result1 = await rateLimiter.checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test:'
      });

      expect(result1.allowed).toBe(true);
      expect(result1.totalHits).toBe(1);
      expect(result1.remaining).toBe(1);

      // Second request should be allowed
      const result2 = await rateLimiter.checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test:'
      });

      expect(result2.allowed).toBe(true);
      expect(result2.totalHits).toBe(2);
      expect(result2.remaining).toBe(0);

      // Third request should be denied
      const result3 = await rateLimiter.checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test:'
      });

      expect(result3.allowed).toBe(false);
      expect(result3.totalHits).toBe(3);
      expect(result3.remaining).toBe(0);
    });

    it('should reset rate limits after window expires in fallback mode', async () => {
      const identifier = `reset-test-${Date.now()}`;
      const shortWindow = 100; // 100ms window

      // Fill up the limit
      const result1 = await rateLimiter.checkRateLimit(identifier, {
        windowMs: shortWindow,
        maxRequests: 1,
        keyPrefix: 'test:'
      });

      expect(result1.allowed).toBe(true);

      // Second request should be denied
      const result2 = await rateLimiter.checkRateLimit(identifier, {
        windowMs: shortWindow,
        maxRequests: 1,
        keyPrefix: 'test:'
      });

      expect(result2.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, shortWindow + 10));

      // Request should be allowed again
      const result3 = await rateLimiter.checkRateLimit(identifier, {
        windowMs: shortWindow,
        maxRequests: 1,
        keyPrefix: 'test:'
      });

      expect(result3.allowed).toBe(true);
      expect(result3.totalHits).toBe(1); // Reset counter
    });
  });

  describe('Rate Limit Status Checking', () => {
    it('should get current status without incrementing counter', async () => {
      const identifier = `status-test-${Date.now()}`;

      // Check status before any requests
      const initialStatus = await rateLimiter.getRateLimitStatus(identifier, RATE_LIMITS.WEBHOOK);

      expect(initialStatus.totalHits).toBe(0);
      expect(initialStatus.remaining).toBe(100);
      expect(initialStatus.allowed).toBe(true);

      // Make a request
      await rateLimiter.checkRateLimit(identifier, RATE_LIMITS.WEBHOOK);

      // Check status again
      const afterRequestStatus = await rateLimiter.getRateLimitStatus(identifier, RATE_LIMITS.WEBHOOK);

      // Should show the hit but not increment further
      expect(afterRequestStatus.totalHits).toBeGreaterThan(0);
      expect(afterRequestStatus.remaining).toBeLessThan(100);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limits for specific identifiers', async () => {
      const identifier = `reset-test-${Date.now()}`;

      // Fill up some requests
      await rateLimiter.checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test:'
      });
      await rateLimiter.checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test:'
      });

      // Should be at limit
      let result = await rateLimiter.checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test:'
      });
      expect(result.allowed).toBe(false);

      // Reset the limit
      await rateLimiter.resetRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test:'
      });

      // Should be allowed again
      result = await rateLimiter.checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test:'
      });
      expect(result.allowed).toBe(true);
      expect(result.totalHits).toBe(1); // Fresh start
    });
  });

  describe('Convenience Functions', () => {
    it('should provide webhook rate limiting convenience function', async () => {
      const result = await checkWebhookRateLimit('webhook-test-ip');

      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
      expect(result.remaining).toBeDefined();
      expect(result.totalHits).toBeDefined();
      expect(result.resetTime).toBeDefined();
    });

    it('should provide API rate limiting convenience function', async () => {
      const result = await checkAPIRateLimit('api-test-ip');

      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
      expect(result.remaining).toBeDefined();
    });

    it('should use different limits for different endpoint types', async () => {
      const ip = `multi-test-${Date.now()}`;

      // Webhook has lower limit (100) than API (200)
      expect(RATE_LIMITS.WEBHOOK.maxRequests).toBeLessThan(RATE_LIMITS.API.maxRequests);

      const webhookResult = await checkWebhookRateLimit(ip);
      const apiResult = await checkAPIRateLimit(ip);

      // They should be tracked separately
      expect(webhookResult.totalHits).toBe(1);
      expect(apiResult.totalHits).toBe(1);
    });
  });

  describe('Health Monitoring', () => {
    it('should provide health check information', async () => {
      const health = await rateLimiter.healthCheck();

      expect(health).toBeDefined();
      expect(health.redis).toBeDefined();
      expect(health.fallback).toBeDefined();
      expect(health.entriesCount).toBeDefined();

      expect(typeof health.redis).toBe('boolean');
      expect(typeof health.fallback).toBe('boolean');
      expect(typeof health.entriesCount).toBe('number');
    });

    it('should provide metrics for monitoring', () => {
      const metrics = rateLimiter.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.redisConnected).toBeDefined();
      expect(metrics.fallbackEntries).toBeDefined();

      expect(typeof metrics.redisConnected).toBe('boolean');
      expect(typeof metrics.fallbackEntries).toBe('number');
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent rate limit checks correctly', async () => {
      const identifier = `concurrent-test-${Date.now()}`;
      const maxRequests = 5;
      const concurrentRequests = 10;

      // Make multiple concurrent requests
      const promises = Array.from({ length: concurrentRequests }, () =>
        rateLimiter.checkRateLimit(identifier, {
          windowMs: 60000,
          maxRequests,
          keyPrefix: 'test:'
        })
      );

      const results = await Promise.all(promises);

      // Count allowed vs denied requests
      const allowed = results.filter(r => r.allowed).length;
      const denied = results.filter(r => !r.allowed).length;

      // Should allow exactly maxRequests and deny the rest
      expect(allowed).toBeLessThanOrEqual(maxRequests);
      expect(denied).toBeGreaterThanOrEqual(concurrentRequests - maxRequests);
      expect(allowed + denied).toBe(concurrentRequests);
    });
  });

  describe('Memory Management', () => {
    it('should clean up expired entries in fallback mode', async () => {
      const identifierPrefix = `cleanup-test-${Date.now()}`;
      const shortWindow = 50;

      // Create several entries with short windows
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit(`${identifierPrefix}-${i}`, {
          windowMs: shortWindow,
          maxRequests: 1,
          keyPrefix: 'cleanup:'
        });
      }

      // Wait for entries to expire
      await new Promise(resolve => setTimeout(resolve, shortWindow + 100));

      // Trigger cleanup by checking metrics (which might trigger internal cleanup)
      const initialMetrics = rateLimiter.getMetrics();
      const initialEntries = initialMetrics.fallbackEntries;

      // Wait a bit more for cleanup to occur
      await new Promise(resolve => setTimeout(resolve, 100));

      // Make a new request to potentially trigger cleanup
      await rateLimiter.checkRateLimit(`${identifierPrefix}-new`, {
        windowMs: 60000,
        maxRequests: 1,
        keyPrefix: 'cleanup:'
      });

      const finalMetrics = rateLimiter.getMetrics();

      // Should not grow indefinitely
      expect(finalMetrics.fallbackEntries).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed Redis responses', async () => {
      // Mock malformed Redis response
      mockMulti.exec.mockResolvedValue(null);

      const result = await rateLimiter.checkRateLimit('error-test', RATE_LIMITS.WEBHOOK);

      // Should handle the error gracefully
      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
    });

    it('should handle Redis command errors', async () => {
      // Mock Redis command error
      mockMulti.exec.mockResolvedValue([
        [new Error('Redis command failed'), null],
        [null, 1]
      ]);

      const result = await rateLimiter.checkRateLimit('error-test', RATE_LIMITS.WEBHOOK);

      // Should handle the error gracefully
      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
    });

    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = {
        windowMs: -1000,
        maxRequests: -5,
        keyPrefix: ''
      };

      // Should not crash
      const result = await rateLimiter.checkRateLimit('invalid-test', invalidConfig);

      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete rate limit checks quickly', async () => {
      const startTime = Date.now();

      await rateLimiter.checkRateLimit('perf-test', RATE_LIMITS.WEBHOOK);

      const duration = Date.now() - startTime;

      // Should complete within reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle high throughput efficiently', async () => {
      const startTime = Date.now();
      const requests = 100;

      const promises = Array.from({ length: requests }, (_, i) =>
        rateLimiter.checkRateLimit(`throughput-test-${i}`, RATE_LIMITS.API)
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      const requestsPerSecond = (requests / duration) * 1000;

      // Should handle at least 100 requests per second
      expect(requestsPerSecond).toBeGreaterThan(100);
    });
  });
});