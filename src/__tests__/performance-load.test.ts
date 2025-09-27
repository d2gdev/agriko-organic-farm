// Performance and Load Testing for Auto-Sync System
// Tests system behavior under realistic production loads

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auto-sync/route';
import { rateLimiter } from '@/lib/redis-rate-limiter';
import { monitoring } from '@/lib/monitoring-observability';
import { Core } from '@/types/TYPE_REGISTRY';

// Performance testing configuration
const PERFORMANCE_THRESHOLDS = {
  SINGLE_REQUEST_MAX_MS: 500,
  BATCH_REQUEST_MAX_MS: 5000,
  CONCURRENT_REQUEST_MAX_MS: 10000,
  MEMORY_GROWTH_MAX_MB: 100,
  CPU_USAGE_MAX_PERCENT: 80
};

// Load testing scenarios
const LOAD_SCENARIOS = {
  LIGHT: { concurrent: 10, duration: 5000 },
  MEDIUM: { concurrent: 50, duration: 10000 },
  HEAVY: { concurrent: 100, duration: 15000 },
  STRESS: { concurrent: 200, duration: 20000 }
};

describe('Performance Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any cached data
    if (global.gc) {
      global.gc();
    }
  });

  describe('Single Request Performance', () => {
    it('should process single webhook within performance threshold', async () => {
      const payload = {
        productId: 1,
        eventType: 'product.created',
        productData: {
          id: 1,
          name: 'Performance Test Product',
          price: 2999 as Core.Money
        }
      };

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100'
        },
        body: JSON.stringify(payload)
      });

      const startTime = performance.now();
      const response = await POST(request);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_REQUEST_MAX_MS);
      expect([200, 403, 422]).toContain(response.status);

      console.warn(`Single request performance: ${duration.toFixed(2)}ms`);
    });

    it('should handle validation-heavy payloads efficiently', async () => {
      // Create large but valid payload
      const largePayload = {
        productId: 999,
        eventType: 'product.created',
        productData: {
          id: 999,
          name: 'Large Product with Long Name'.repeat(10),
          description: 'Very detailed product description. '.repeat(100),
          categories: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: `Category ${i + 1}`,
            slug: `category-${i + 1}`
          })),
          images: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            src: `https://example.com/image-${i + 1}.jpg`,
            alt: `Image ${i + 1}`
          })),
          metadata: Object.fromEntries(
            Array.from({ length: 50 }, (_, i) => [`key${i}`, `value${i}`])
          )
        }
      };

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(largePayload)
      });

      const startTime = performance.now();
      const _response = await POST(request);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_REQUEST_MAX_MS * 2); // Allow 2x for large payload
      console.warn(`Large payload validation: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Batch Processing Performance', () => {
    it('should handle multiple sequential requests efficiently', async () => {
      const requestCount = 20;
      const requests = Array.from({ length: requestCount }, (_, i) => ({
        productId: i + 1,
        eventType: 'product.created',
        productData: {
          id: i + 1,
          name: `Batch Product ${i + 1}`,
          price: 2999 as Core.Money
        }
      }));

      const startTime = performance.now();

      for (const payload of requests) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': `192.168.1.${(payload.productId % 255) + 1}`
          },
          body: JSON.stringify(payload)
        });

        await POST(request);
      }

      const duration = performance.now() - startTime;
      const avgDuration = duration / requestCount;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_REQUEST_MAX_MS);
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_REQUEST_MAX_MS);

      console.warn(`Batch processing (${requestCount} requests): ${duration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms average`);
    });
  });

  describe('Concurrent Request Performance', () => {
    Object.entries(LOAD_SCENARIOS).forEach(([scenarioName, config]) => {
      it(`should handle ${scenarioName.toLowerCase()} load (${config.concurrent} concurrent requests)`, async () => {
        const requests = Array.from({ length: config.concurrent }, (_, i) => {
          const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': `10.0.${Math.floor(i / 255)}.${(i % 255) + 1}`
            },
            body: JSON.stringify({
              productId: i + 1,
              eventType: 'product.created',
              productData: {
                id: i + 1,
                name: `Concurrent Product ${i + 1}`,
                price: 2999 as Core.Money
              }
            })
          });
          return POST(request);
        });

        const startTime = performance.now();
        const responses = await Promise.all(requests);
        const duration = performance.now() - startTime;

        expect(duration).toBeLessThan(config.duration);
        expect(responses).toHaveLength(config.concurrent);

        // Check response distribution
        const statusCodes = responses.reduce((acc, response) => {
          acc[response.status] = (acc[response.status] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        console.warn(`${scenarioName} load test: ${duration.toFixed(2)}ms for ${config.concurrent} requests`);
        console.warn(`Status distribution:`, statusCodes);

        // At least 70% should succeed (accounting for rate limiting)
        const successfulRequests = (statusCodes[200] || 0);
        expect(successfulRequests).toBeGreaterThan(config.concurrent * 0.7);
      }, 30000); // 30 second timeout for load tests
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during sustained load', async () => {
      const initialMemory = process.memoryUsage();

      // Run sustained load
      for (let batch = 0; batch < 5; batch++) {
        const requests = Array.from({ length: 20 }, (_, i) => {
          const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': `172.16.${batch}.${i + 1}`
            },
            body: JSON.stringify({
              productId: batch * 20 + i + 1,
              eventType: 'product.created',
              productData: {
                id: batch * 20 + i + 1,
                name: `Memory Test Product ${batch * 20 + i + 1}`,
                price: 2999 as Core.Money
              }
            })
          });
          return POST(request);
        });

        await Promise.all(requests);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryGrowthMB = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);

      console.warn(`Memory growth: ${memoryGrowthMB.toFixed(2)}MB`);
      console.warn(`Initial heap: ${(initialMemory.heapUsed / (1024 * 1024)).toFixed(2)}MB`);
      console.warn(`Final heap: ${(finalMemory.heapUsed / (1024 * 1024)).toFixed(2)}MB`);

      expect(memoryGrowthMB).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_GROWTH_MAX_MB);
    }, 60000);

    it('should clean up rate limiting data efficiently', async () => {
      const initialMetrics = rateLimiter.getMetrics();
      const initialEntries = initialMetrics.fallbackEntries;

      // Create many rate limit entries with short expiration
      const promises = Array.from({ length: 100 }, (_, i) =>
        rateLimiter.checkRateLimit(`cleanup-test-${i}`, {
          windowMs: 100, // Short window
          maxRequests: 1,
          keyPrefix: 'perf-test:'
        })
      );

      await Promise.all(promises);

      const afterCreationMetrics = rateLimiter.getMetrics();
      expect(afterCreationMetrics.fallbackEntries).toBeGreaterThan(initialEntries);

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 150));

      // Trigger potential cleanup
      await rateLimiter.checkRateLimit('cleanup-trigger', {
        windowMs: 60000,
        maxRequests: 1,
        keyPrefix: 'perf-test:'
      });

      const finalMetrics = rateLimiter.getMetrics();
      console.warn(`Rate limiting cleanup: ${initialEntries} → ${afterCreationMetrics.fallbackEntries} → ${finalMetrics.fallbackEntries} entries`);

      // Should have cleaned up some entries
      expect(finalMetrics.fallbackEntries).toBeLessThanOrEqual(afterCreationMetrics.fallbackEntries);
    });
  });

  describe('Database Performance Simulation', () => {
    it('should handle database connection delays gracefully', async () => {
      // Mock slow database responses
      jest.doMock('@/lib/memgraph-auto-sync', () => ({
        autoSyncProductToMemgraph: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
        )
      }));

      jest.doMock('@/lib/qdrant-auto-sync', () => ({
        autoSyncProductToQdrant: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(resolve, 150)) // 150ms delay
        )
      }));

      jest.doMock('@/lib/analytics-db', () => ({
        saveAnalyticsEvent: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
        )
      }));

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          productId: 1,
          eventType: 'product.created',
          productData: { id: 1, name: 'Slow DB Test', price: 2999 as Core.Money }
        })
      });

      const startTime = performance.now();
      const response = await POST(request);
      const duration = performance.now() - startTime;

      // Should handle parallel database operations efficiently
      expect(duration).toBeLessThan(500); // Less than sum of delays due to parallel execution
      expect([200, 500]).toContain(response.status);

      console.warn(`Slow database simulation: ${duration.toFixed(2)}ms`);
    });

    it('should timeout appropriately on very slow databases', async () => {
      // Mock extremely slow database
      jest.doMock('@/lib/memgraph-auto-sync', () => ({
        autoSyncProductToMemgraph: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
        )
      }));

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          productId: 1,
          eventType: 'product.created'
        })
      });

      const startTime = performance.now();
      const response = await POST(request);
      const duration = performance.now() - startTime;

      // Should either timeout or handle gracefully
      expect(duration).toBeLessThan(30000); // 30 second max
      expect(response.status).toBeGreaterThanOrEqual(200);

      console.warn(`Database timeout handling: ${duration.toFixed(2)}ms`);
    }, 35000);
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting checks efficiently under load', async () => {
      const checkCount = 1000;
      const clientIps = Array.from({ length: 50 }, (_, i) => `10.10.10.${i + 1}`);

      const startTime = performance.now();

      const promises = Array.from({ length: checkCount }, (_, i) => {
        const ip = clientIps[i % clientIps.length];
        if (!ip) {
          throw new Error('IP address not found');
        }
        return rateLimiter.checkRateLimit(ip, {
          windowMs: 60000,
          maxRequests: 100,
          keyPrefix: 'perf-test:'
        });
      });

      const results = await Promise.all(promises);
      const duration = performance.now() - startTime;
      const avgDuration = duration / checkCount;

      expect(results).toHaveLength(checkCount);
      expect(avgDuration).toBeLessThan(10); // Less than 10ms per check

      console.warn(`Rate limiting performance: ${checkCount} checks in ${duration.toFixed(2)}ms (${avgDuration.toFixed(3)}ms avg)`);

      // Verify results make sense
      const allowedCount = results.filter(r => r.allowed).length;
      const deniedCount = results.filter(r => !r.allowed).length;

      expect(allowedCount + deniedCount).toBe(checkCount);
      console.warn(`Rate limiting results: ${allowedCount} allowed, ${deniedCount} denied`);
    });
  });

  describe('Monitoring Performance', () => {
    it('should record metrics efficiently without impacting performance', async () => {
      const metricCount = 1000;

      const startTime = performance.now();

      for (let i = 0; i < metricCount; i++) {
        monitoring.recordMetric('test.performance', i, {
          batch: Math.floor(i / 100).toString(),
          index: i.toString()
        });
      }

      const duration = performance.now() - startTime;
      const avgDuration = duration / metricCount;

      expect(avgDuration).toBeLessThan(1); // Less than 1ms per metric

      console.warn(`Monitoring performance: ${metricCount} metrics in ${duration.toFixed(2)}ms (${avgDuration.toFixed(3)}ms avg)`);
    });

    it('should handle monitoring system under concurrent load', async () => {
      const concurrentMetrics = 100;

      const startTime = performance.now();

      const promises = Array.from({ length: concurrentMetrics }, (_, i) =>
        Promise.resolve().then(() => {
          monitoring.recordMetric('test.concurrent', Math.random() * 100, {
            thread: i.toString(),
            timestamp: Date.now().toString()
          });
        })
      );

      await Promise.all(promises);

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      console.warn(`Concurrent monitoring: ${concurrentMetrics} metrics in ${duration.toFixed(2)}ms`);
    });
  });
});

describe('Load Testing Scenarios', () => {
  describe('Black Friday Simulation', () => {
    it('should handle peak e-commerce traffic patterns', async () => {
      // Simulate burst traffic with different patterns
      const trafficPatterns = [
        { intensity: 'low', requests: 10, delayMs: 100 },
        { intensity: 'medium', requests: 30, delayMs: 50 },
        { intensity: 'high', requests: 60, delayMs: 20 },
        { intensity: 'peak', requests: 100, delayMs: 10 },
        { intensity: 'burst', requests: 150, delayMs: 5 }
      ];

      for (const pattern of trafficPatterns) {
        console.warn(`Testing ${pattern.intensity} traffic: ${pattern.requests} requests`);

        const startTime = performance.now();

        const requests = Array.from({ length: pattern.requests }, async (_, i) => {
          // Stagger requests to simulate real traffic
          await new Promise(resolve => setTimeout(resolve, i * pattern.delayMs));

          const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': `203.0.113.${(i % 255) + 1}` // Simulate different IPs
            },
            body: JSON.stringify({
              productId: i + 1,
              eventType: 'product.created',
              productData: {
                id: i + 1,
                name: `${pattern.intensity} Traffic Product ${i + 1}`,
                price: (Math.random() * 100 + 10).toFixed(2)
              }
            })
          });

          return POST(request);
        });

        const responses = await Promise.all(requests);
        const duration = performance.now() - startTime;

        const statusCodes = responses.reduce((acc, response) => {
          acc[response.status] = (acc[response.status] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        console.warn(`${pattern.intensity} traffic completed in ${duration.toFixed(2)}ms`);
        console.warn(`Status distribution:`, statusCodes);

        // System should remain stable
        expect(responses).toHaveLength(pattern.requests);

        // Should have some successful responses even under load
        const successRate = (statusCodes[200] || 0) / pattern.requests;
        if (pattern.intensity === 'burst') {
          expect(successRate).toBeGreaterThan(0.3); // 30% success rate under burst
        } else {
          expect(successRate).toBeGreaterThan(0.6); // 60% success rate under normal load
        }
      }
    }, 120000); // 2 minute timeout for full load test
  });

  describe('Webhook Storm Simulation', () => {
    it('should handle sudden webhook storms gracefully', async () => {
      // Simulate WooCommerce sending burst of webhooks (inventory update, etc.)
      const webhookTypes = ['product_created', 'product_updated', 'order_created'];
      const stormSize = 200;

      const webhookRequests = Array.from({ length: stormSize }, (_, i) => {
        const action = webhookTypes[i % webhookTypes.length];
        if (!action) {
          throw new Error('Webhook action not found');
        }
        return new NextRequest(`http://localhost:3000/api/auto-sync?action=${action}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-wc-webhook-topic': action.replace('_', '.'),
            'user-agent': 'WooCommerce/6.0.0'
          },
          body: JSON.stringify({
            id: i + 1,
            name: `Storm Product ${i + 1}`,
            type: 'simple',
            status: 'publish'
          })
        });
      });

      const startTime = performance.now();
      const responses = await Promise.all(webhookRequests.map(request => POST(request)));
      const duration = performance.now() - startTime;

      console.warn(`Webhook storm (${stormSize} webhooks) processed in ${duration.toFixed(2)}ms`);

      // Should handle gracefully without crashing
      expect(responses).toHaveLength(stormSize);

      const statusCodes = responses.reduce((acc, response) => {
        acc[response.status] = (acc[response.status] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      console.warn('Webhook storm status distribution:', statusCodes);

      // Should not have any 5xx errors (server crashes)
      expect(statusCodes[500] || 0).toBe(0);
    }, 60000);
  });
});

// Performance reporting
export const generatePerformanceReport = () => {
  const report = {
    thresholds: PERFORMANCE_THRESHOLDS,
    loadScenarios: LOAD_SCENARIOS,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage()
  };

  console.warn('Performance Test Report:', JSON.stringify(report, null, 2));
  return report;
};