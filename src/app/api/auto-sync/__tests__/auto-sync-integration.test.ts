// Integration tests for the complete auto-sync API workflow
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Mock all dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('@/lib/monitoring-observability', () => ({
  monitoring: {
    recordMetric: jest.fn()
  },
  monitorAPICall: jest.fn(() => ({
    finish: jest.fn()
  })),
  monitorDatabaseQuery: jest.fn(() => ({
    finish: jest.fn()
  })),
  monitorSyncEvent: jest.fn(() => ({
    finish: jest.fn()
  }))
}));

jest.mock('@/lib/data-validation', () => ({
  validateWebhookData: jest.fn(),
  validateProductTracking: jest.fn(),
  validateOrderTracking: jest.fn(),
  validateTrackingEvent: jest.fn(),
  validateSearchTracking: jest.fn()
}));

jest.mock('@/lib/redis-rate-limiter', () => ({
  checkWebhookRateLimit: jest.fn()
}));

jest.mock('@/lib/webhook-config', () => ({
  verifyWebhookSignature: jest.fn(),
  processWebhookData: jest.fn()
}));

jest.mock('@/lib/memgraph-auto-sync', () => ({
  autoSyncProductToMemgraph: jest.fn(),
  autoSyncOrderToMemgraph: jest.fn(),
  autoSyncSearchToMemgraph: jest.fn()
}));

jest.mock('@/lib/qdrant-auto-sync', () => ({
  autoSyncProductToQdrant: jest.fn(),
  autoSyncUserSearchToQdrant: jest.fn(),
  autoSyncUserBehaviorToQdrant: jest.fn()
}));

jest.mock('@/lib/analytics-db', () => ({
  saveAnalyticsEvent: jest.fn()
}));

jest.mock('@/lib/woocommerce', () => ({
  getAllProducts: jest.fn()
}));

describe('Auto-Sync API Integration Tests', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock request
    mockRequest = {
      url: 'http://localhost:3000/api/auto-sync?action=product_created',
      text: jest.fn(),
      headers: new Headers({
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      })
    };
  });

  describe('Rate Limiting Integration', () => {
    it('should allow requests within rate limits', async () => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      checkWebhookRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        totalHits: 1,
        resetTime: Date.now() + 60000
      });

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        id: 123,
        action: 'created',
        productData: { id: 123, name: 'Test Product' }
      }));

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(checkWebhookRateLimit).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should reject requests exceeding rate limits', async () => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      checkWebhookRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        totalHits: 101,
        resetTime: Date.now() + 60000
      });

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(429);
      expect(result.error).toBe('Rate limit exceeded');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should include proper rate limit headers', async () => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      const resetTime = Date.now() + 60000;

      checkWebhookRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 5,
        totalHits: 101,
        resetTime
      });

      const response = await POST(mockRequest as NextRequest);

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
      expect(response.headers.get('X-RateLimit-Reset')).toBe(resetTime.toString());
      expect(parseInt(response.headers.get('Retry-After') || '0')).toBeGreaterThan(0);
    });
  });

  describe('Data Validation Integration', () => {
    beforeEach(() => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      checkWebhookRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        totalHits: 1,
        resetTime: Date.now() + 60000
      });
    });

    it('should validate webhook data successfully', async () => {
      const { validateWebhookData } = require('@/lib/data-validation');
      validateWebhookData.mockReturnValue({
        success: true,
        sanitized: {
          id: 123,
          action: 'created',
          arg: { id: 123, name: 'Clean Product Name' }
        }
      });

      // Cannot modify read-only headers property, use new NextRequest instead
      const requestWithHeaders = new NextRequest('http://localhost:3000/api/auto-sync', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'x-wc-webhook-topic': 'product.created'
        },
        body: JSON.stringify({ id: 123, action: 'created' })
      });

      const response = await POST(requestWithHeaders);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(validateWebhookData).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should reject invalid webhook data', async () => {
      const { validateWebhookData } = require('@/lib/data-validation');
      validateWebhookData.mockReturnValue({
        success: false,
        errors: ['Invalid data format', 'Missing required fields']
      });

      // Cannot modify read-only headers property, use new NextRequest instead
      const requestWithHeaders = new NextRequest('http://localhost:3000/api/auto-sync', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'x-wc-webhook-topic': 'product.created'
        },
        body: JSON.stringify({ invalid: 'data' })
      });

      const response = await POST(requestWithHeaders);
      const result = await response.json();

      expect(response.status).toBe(422);
      expect(result.error).toBe('Invalid webhook data');
      expect(result.details).toEqual(['Invalid data format', 'Missing required fields']);
    });

    it('should handle malformed JSON gracefully', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue('invalid json {');

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid JSON payload');
    });
  });

  describe('Webhook Signature Verification', () => {
    beforeEach(() => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      checkWebhookRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        totalHits: 1,
        resetTime: Date.now() + 60000
      });
    });

    it('should verify valid webhook signatures', async () => {
      const { verifyWebhookSignature } = require('@/lib/webhook-config');
      const { validateWebhookData } = require('@/lib/data-validation');

      verifyWebhookSignature.mockReturnValue(true);
      validateWebhookData.mockReturnValue({
        success: true,
        sanitized: { id: 123, action: 'created', arg: { id: 123 } }
      });

      // Cannot modify read-only headers property, use new NextRequest instead
      const requestWithHeaders = new NextRequest('http://localhost:3000/api/auto-sync', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'valid-signature'
        },
        body: JSON.stringify({ id: 123, action: 'created' })
      });

      const response = await POST(requestWithHeaders);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(verifyWebhookSignature).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should reject invalid webhook signatures', async () => {
      const { verifyWebhookSignature } = require('@/lib/webhook-config');
      verifyWebhookSignature.mockReturnValue(false);

      // Cannot modify read-only headers property, use new NextRequest instead
      const requestWithHeaders = new NextRequest('http://localhost:3000/api/auto-sync', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'invalid-signature'
        },
        body: JSON.stringify({ id: 123, action: 'created' })
      });

      const response = await POST(requestWithHeaders);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Invalid webhook signature');
    });
  });

  describe('Product Sync Integration', () => {
    beforeEach(() => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      const { validateProductTracking } = require('@/lib/data-validation');

      checkWebhookRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        totalHits: 1,
        resetTime: Date.now() + 60000
      });

      validateProductTracking.mockReturnValue({
        success: true,
        sanitized: {
          id: 'product_sync_123',
          type: 'product.view',
          timestamp: Date.now(),
          sessionId: 'system_123',
          productId: 123,
          productName: 'Test Product',
          productPrice: 29.99,
          productCategory: 'Electronics'
        }
      });
    });

    it('should sync product data to all databases', async () => {
      const { autoSyncProductToMemgraph } = require('@/lib/memgraph-auto-sync');
      const { autoSyncProductToQdrant } = require('@/lib/qdrant-auto-sync');
      const { saveAnalyticsEvent } = require('@/lib/analytics-db');

      autoSyncProductToMemgraph.mockResolvedValue(undefined);
      autoSyncProductToQdrant.mockResolvedValue(undefined);
      saveAnalyticsEvent.mockResolvedValue(undefined);

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        productId: 123,
        eventType: 'product.created',
        productData: {
          id: 123,
          name: 'Test Product',
          price: '29.99',
          categories: [{ name: 'Electronics' }]
        }
      }));

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(autoSyncProductToMemgraph).toHaveBeenCalled();
      expect(autoSyncProductToQdrant).toHaveBeenCalled();
      expect(saveAnalyticsEvent).toHaveBeenCalled();
    });

    it('should handle sync failures gracefully', async () => {
      const { autoSyncProductToMemgraph } = require('@/lib/memgraph-auto-sync');
      const { monitoring } = require('@/lib/monitoring-observability');

      autoSyncProductToMemgraph.mockRejectedValue(new Error('Memgraph connection failed'));

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        productId: 123,
        eventType: 'product.created',
        productData: { id: 123, name: 'Test Product' }
      }));

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(monitoring.recordMetric).toHaveBeenCalledWith(
        'sync.product_failures',
        1,
        { eventType: 'product.created' }
      );
    });
  });

  describe('Monitoring Integration', () => {
    beforeEach(() => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      checkWebhookRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        totalHits: 1,
        resetTime: Date.now() + 60000
      });
    });

    it('should record API monitoring metrics', async () => {
      const { monitorAPICall, monitoring } = require('@/lib/monitoring-observability');
      const mockFinish = jest.fn();
      monitorAPICall.mockReturnValue({ finish: mockFinish });

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({}));

      await POST(mockRequest as NextRequest);

      expect(monitorAPICall).toHaveBeenCalledWith('/api/auto-sync', 'POST');
      expect(mockFinish).toHaveBeenCalled();
    });

    it('should record sync operation metrics', async () => {
      const { monitorSyncEvent } = require('@/lib/monitoring-observability');
      const { validateProductTracking } = require('@/lib/data-validation');

      const mockSyncFinish = jest.fn();
      monitorSyncEvent.mockReturnValue({ finish: mockSyncFinish });

      validateProductTracking.mockReturnValue({
        success: true,
        sanitized: {
          id: 'test',
          type: 'product.view',
          timestamp: Date.now(),
          sessionId: 'session',
          productId: 123,
          productName: 'Test',
          productPrice: 29.99,
          productCategory: 'Test'
        }
      });

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        productId: 123,
        eventType: 'product.created',
        productData: { id: 123, name: 'Test Product' }
      }));

      await POST(mockRequest as NextRequest);

      expect(monitorSyncEvent).toHaveBeenCalledWith('product_sync');
      expect(mockSyncFinish).toHaveBeenCalledWith(true, 1);
    });

    it('should record database operation metrics', async () => {
      const { monitorDatabaseQuery } = require('@/lib/monitoring-observability');
      const { validateProductTracking } = require('@/lib/data-validation');

      const mockDbFinish = jest.fn();
      monitorDatabaseQuery.mockReturnValue({ finish: mockDbFinish });

      validateProductTracking.mockReturnValue({
        success: true,
        sanitized: {
          id: 'test',
          type: 'product.view',
          timestamp: Date.now(),
          sessionId: 'session',
          productId: 123,
          productName: 'Test',
          productPrice: 29.99,
          productCategory: 'Test'
        }
      });

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        productId: 123,
        eventType: 'product.created',
        productData: { id: 123, name: 'Test Product' }
      }));

      await POST(mockRequest as NextRequest);

      expect(monitorDatabaseQuery).toHaveBeenCalledWith('memgraph', 'product_sync');
      expect(monitorDatabaseQuery).toHaveBeenCalledWith('qdrant', 'product_sync');
      expect(monitorDatabaseQuery).toHaveBeenCalledWith('analytics', 'product_sync');
    });
  });

  describe('GET Endpoint', () => {
    it('should return status information', async () => {
      const request = {
        url: 'http://localhost:3000/api/auto-sync?action=status'
      } as NextRequest;

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.status).toBe('active');
      expect(result.endpoints).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.lastActivity).toBeDefined();
    });

    it('should return default message for unknown actions', async () => {
      const request = {
        url: 'http://localhost:3000/api/auto-sync'
      } as NextRequest;

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message).toBe('Auto-sync API ready');
      expect(result.usage).toBeDefined();
      expect(result.status).toBe('ready');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown actions gracefully', async () => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      checkWebhookRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        totalHits: 1,
        resetTime: Date.now() + 60000
      });

      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/auto-sync?action=unknown_action'
      };
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({}));

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Unknown action');
    });

    it('should handle internal errors gracefully', async () => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      checkWebhookRateLimit.mockRejectedValue(new Error('Unexpected error'));

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-sync failed');
      expect(result.details).toBeDefined();
    });

    it('should log errors appropriately', async () => {
      const { logger } = require('@/lib/logger');
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');

      checkWebhookRateLimit.mockRejectedValue(new Error('Test error'));

      await POST(mockRequest as NextRequest);

      expect(logger.error).toHaveBeenCalledWith(
        '❌ Auto-sync webhook failed:',
        expect.any(Object)
      );
    });
  });

  describe('Performance', () => {
    it('should complete requests within reasonable time', async () => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      const { validateProductTracking } = require('@/lib/data-validation');

      checkWebhookRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        totalHits: 1,
        resetTime: Date.now() + 60000
      });

      validateProductTracking.mockReturnValue({
        success: true,
        sanitized: {
          id: 'test',
          type: 'product.view',
          timestamp: Date.now(),
          sessionId: 'session',
          productId: 123,
          productName: 'Test',
          productPrice: 29.99,
          productCategory: 'Test'
        }
      });

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        productId: 123,
        eventType: 'product.created',
        productData: { id: 123, name: 'Test Product' }
      }));

      const startTime = Date.now();
      await POST(mockRequest as NextRequest);
      const duration = Date.now() - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent requests efficiently', async () => {
      const { checkWebhookRateLimit } = require('@/lib/redis-rate-limiter');
      const { validateProductTracking } = require('@/lib/data-validation');

      checkWebhookRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        totalHits: 1,
        resetTime: Date.now() + 60000
      });

      validateProductTracking.mockReturnValue({
        success: true,
        sanitized: {
          id: 'test',
          type: 'product.view',
          timestamp: Date.now(),
          sessionId: 'session',
          productId: 123,
          productName: 'Test',
          productPrice: 29.99,
          productCategory: 'Test'
        }
      });

      // Create multiple concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) => {
        const request = {
          ...mockRequest,
          text: jest.fn().mockResolvedValue(JSON.stringify({
            productId: 123 + i,
            eventType: 'product.created',
            productData: { id: 123 + i, name: `Test Product ${i}` }
          }))
        };
        return POST(request as NextRequest);
      });

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle 10 concurrent requests in reasonable time
      expect(duration).toBeLessThan(2000);
    });
  });
});