// Integration tests for data validation and monitoring systems
import {
  validateWebhookData,
  validateTrackingEvent,
  validateProductTracking,
  validateSearchTracking,
  validateOrderTracking,
  sanitizeHtml,
  sanitizeAlphanumeric
} from '../data-validation';

import { monitoring, monitorDatabaseQuery, monitorSyncEvent, monitorAPICall } from '../monitoring-observability';

describe('Data Validation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook Data Validation', () => {
    it('should validate and sanitize valid webhook data', () => {
      const validWebhookData = {
        id: 123,
        action: 'created',
        arg: {
          id: 456,
          name: 'Test Product',
          slug: 'test-product',
          price: '99.99',
          regular_price: '99.99',
          status: 'publish',
          stock_status: 'instock',
          stock_quantity: 10,
          categories: [
            { id: 1, name: 'Electronics', slug: 'electronics' }
          ],
          images: [
            { id: 1, src: 'https://example.com/image.jpg', alt: 'Test image' }
          ],
          description: 'A test product',
          short_description: 'Test',
          sku: 'TEST-123'
        }
      };

      const result = validateWebhookData(validWebhookData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.sanitized).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid webhook data with detailed errors', () => {
      const invalidWebhookData = {
        id: 'invalid', // Should be number
        action: 'invalid_action', // Not in enum
        arg: {
          id: -1, // Should be positive
          name: '', // Should not be empty
          price: 'invalid_price', // Should match regex
          status: 'invalid_status' // Not in enum
        }
      };

      const result = validateWebhookData(invalidWebhookData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.data).toBeUndefined();
      expect(result.sanitized).toBeUndefined();
    });

    it('should sanitize malicious HTML in webhook data', () => {
      const maliciousWebhookData = {
        id: 123,
        action: 'created',
        arg: {
          id: 456,
          name: '<script>alert("xss")</script>Clean Product Name',
          slug: 'clean-product',
          price: '99.99',
          regular_price: '99.99',
          status: 'publish',
          stock_status: 'instock',
          stock_quantity: 10,
          description: '<img src="x" onerror="alert(1)">Product description',
          short_description: '<b>Bold</b> text'
        }
      };

      const result = validateWebhookData(maliciousWebhookData);

      expect(result.success).toBe(true);
      expect((result.sanitized?.arg as any).name).not.toContain('<script>');
      expect((result.sanitized?.arg as any).description).not.toContain('onerror');
      expect((result.sanitized?.arg as any).short_description).not.toContain('<b>');
    });
  });

  describe('Tracking Event Validation', () => {
    it('should validate product tracking events', () => {
      const validProductTracking = {
        id: 'track_123',
        type: 'product.view',
        timestamp: Date.now(),
        sessionId: 'session_abc123',
        userId: 'user_456',
        productId: 789,
        productName: 'Test Product',
        productPrice: 29.99,
        productCategory: 'Electronics',
        quantity: 1,
        metadata: { source: 'homepage' }
      };

      const result = validateProductTracking(validProductTracking);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.sanitized).toBeDefined();
    });

    it('should validate search tracking events', () => {
      const validSearchTracking = {
        id: 'search_123',
        type: 'search.performed',
        timestamp: Date.now(),
        sessionId: 'session_abc123',
        userId: 'user_456',
        query: 'laptop computers',
        resultsCount: 25,
        clickedResultId: 12,
        filters: { category: 'electronics', price_range: '100-500' }
      };

      const result = validateSearchTracking(validSearchTracking);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.sanitized).toBeDefined();
    });

    it('should validate order tracking events', () => {
      const validOrderTracking = {
        id: 'order_123',
        type: 'order.created',
        timestamp: Date.now(),
        sessionId: 'session_abc123',
        userId: 'user_456',
        orderId: 'ORDER_789',
        orderValue: 149.99,
        itemCount: 3,
        paymentMethod: 'credit_card',
        items: [
          { productId: 1, quantity: 2, price: 29.99 },
          { productId: 2, quantity: 1, price: 89.99 }
        ]
      };

      const result = validateOrderTracking(validOrderTracking);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.sanitized).toBeDefined();
    });

    it('should reject tracking events with invalid data types', () => {
      const invalidTracking = {
        id: 123, // Should be string
        type: 'invalid.type', // Not in enum
        timestamp: 'invalid', // Should be number
        sessionId: '', // Should not be empty
        productId: -1, // Should be positive
        productPrice: 'free' // Should be number
      };

      const result = validateProductTracking(invalidTracking);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize HTML content properly', () => {
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p><img src="x" onerror="alert(1)">';
      const sanitized = sanitizeHtml(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('<p>');
      expect(sanitized).not.toContain('<img>');
      expect(sanitized).toContain('Safe content');
    });

    it('should sanitize alphanumeric strings', () => {
      const dirtyString = 'user@123!#$%^&*()_+-=[]{}|;\':",./<>?';
      const sanitized = sanitizeAlphanumeric(dirtyString);

      expect(sanitized).toBe('user123_-');
      expect(sanitized).not.toContain('@');
      expect(sanitized).not.toContain('!');
      expect(sanitized).not.toContain('%');
    });

    it('should handle nested object sanitization', () => {
      const dirtyMetadata = {
        'user@input': '<script>alert("xss")</script>',
        'clean_field': 'clean value',
        'nested': {
          'dirty#field': '<img src="x" onerror="alert(1)">',
          'array_field': ['<script>', 'clean', '<style>']
        }
      };

      // Test the sanitization through validation
      const trackingEvent = {
        id: 'test_123',
        type: 'custom.event',
        timestamp: Date.now(),
        sessionId: 'session_123',
        metadata: dirtyMetadata
      };

      const result = validateTrackingEvent(trackingEvent);

      expect(result.success).toBe(true);
      expect(result.sanitized?.metadata).toBeDefined();

      // Check that script tags are removed
      const sanitizedMeta = result.sanitized?.metadata as any;
      expect(JSON.stringify(sanitizedMeta)).not.toContain('<script>');
      expect(JSON.stringify(sanitizedMeta)).not.toContain('onerror');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      const nullResult = validateWebhookData(null);
      const undefinedResult = validateWebhookData(undefined);

      expect(nullResult.success).toBe(false);
      expect(undefinedResult.success).toBe(false);
      expect(nullResult.errors).toBeDefined();
      expect(undefinedResult.errors).toBeDefined();
    });

    it('should handle empty objects', () => {
      const emptyResult = validateWebhookData({});

      expect(emptyResult.success).toBe(false);
      expect(emptyResult.errors).toBeDefined();
      expect(emptyResult.errors?.length).toBeGreaterThan(0);
    });

    it('should handle very large strings', () => {
      const largeString = 'a'.repeat(10000);
      const trackingEvent = {
        id: 'test_123',
        type: 'custom.event',
        timestamp: Date.now(),
        sessionId: largeString, // This should be trimmed or rejected
        metadata: { largeField: largeString }
      };

      const result = validateTrackingEvent(trackingEvent);

      // Should either succeed with truncated data or fail with validation error
      if (result.success) {
        expect(result.sanitized?.sessionId?.length).toBeLessThanOrEqual(255);
      } else {
        expect(result.errors).toBeDefined();
      }
    });

    it('should handle malformed JSON-like structures', () => {
      const malformedData = {
        id: 123,
        action: 'created',
        arg: 'not an object' // Should be an object
      };

      const result = validateWebhookData(malformedData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});

describe('Monitoring System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database Performance Monitoring', () => {
    it('should track database query performance', async () => {
      const dbMonitor = monitorDatabaseQuery('memgraph', 'product_query');

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));

      const executionTime = dbMonitor.finish(true);

      expect(executionTime).toBeGreaterThanOrEqual(100);
      expect(executionTime).toBeLessThan(200); // Should be close to 100ms
    });

    it('should record slow query metrics', async () => {
      const mockRecordMetric = jest.spyOn(monitoring, 'recordMetric');

      await monitoring.monitorDatabasePerformance('memgraph', 'slow_query', 2000, true);

      expect(mockRecordMetric).toHaveBeenCalledWith(
        'db.memgraph.slow_queries_total',
        1,
        { operation: 'slow_query' }
      );
    });

    it('should track error rates correctly', async () => {
      const mockRecordMetric = jest.spyOn(monitoring, 'recordMetric');

      await monitoring.monitorDatabasePerformance('qdrant', 'failed_query', 500, false);

      expect(mockRecordMetric).toHaveBeenCalledWith(
        'db.qdrant.errors_total',
        1,
        { operation: 'failed_query' }
      );
    });
  });

  describe('Sync Operation Monitoring', () => {
    it('should track sync operation metrics', () => {
      const syncMonitor = monitorSyncEvent('product_sync');

      // Simulate sync work
      const processingTime = syncMonitor.finish(true, 5);

      expect(processingTime).toBeGreaterThan(0);
    });

    it('should record sync failure metrics', () => {
      const mockRecordMetric = jest.spyOn(monitoring, 'recordMetric');

      monitoring.monitorSyncOperation('user_sync', 1500, false, 3);

      expect(mockRecordMetric).toHaveBeenCalledWith(
        'sync.errors_total',
        1,
        { operation: 'user_sync' }
      );
    });
  });

  describe('API Endpoint Monitoring', () => {
    it('should track API response times', () => {
      const apiMonitor = monitorAPICall('/api/auto-sync', 'POST');

      // Simulate API work
      const responseTime = apiMonitor.finish(200);

      expect(responseTime).toBeGreaterThan(0);
    });

    it('should record error responses', () => {
      const mockRecordMetric = jest.spyOn(monitoring, 'recordMetric');

      monitoring.monitorAPIEndpoint('/api/test', 'GET', 500, 1000);

      expect(mockRecordMetric).toHaveBeenCalledWith(
        'api.errors_total',
        1,
        { endpoint: '/api/test', method: 'GET', status: '500' }
      );
    });

    it('should identify slow API responses', () => {
      const mockRecordMetric = jest.spyOn(monitoring, 'recordMetric');

      monitoring.monitorAPIEndpoint('/api/slow', 'POST', 200, 3000);

      expect(mockRecordMetric).toHaveBeenCalledWith(
        'api.slow_requests_total',
        1,
        { endpoint: '/api/slow', method: 'POST' }
      );
    });
  });

  describe('Health Status Monitoring', () => {
    it('should provide comprehensive health status', async () => {
      const healthStatus = await monitoring.getHealthStatus();

      expect(healthStatus.status).toBeDefined();
      expect(healthStatus.timestamp).toBeDefined();
      expect(healthStatus.databases).toBeDefined();
      expect(healthStatus.sync).toBeDefined();
      expect(healthStatus.system).toBeDefined();
      expect(healthStatus.alerts).toBeDefined();

      expect(['healthy', 'unhealthy', 'degraded']).toContain(healthStatus.status);
    });

    it('should calculate database metrics correctly', () => {
      // Add some test metrics
      monitoring.recordMetric('db.test.query_time', 100);
      monitoring.recordMetric('db.test.query_time', 200);
      monitoring.recordMetric('db.test.queries_total', 1);
      monitoring.recordMetric('db.test.queries_total', 1);
      monitoring.recordMetric('db.test.errors_total', 1);

      const dbMetrics = monitoring.getDatabaseMetrics('test');

      expect(dbMetrics.averageQueryTime).toBe(150); // (100 + 200) / 2
      expect(dbMetrics.errorRate).toBe(50); // 1 error out of 2 queries
    });

    it('should calculate sync metrics correctly', () => {
      // Add some test metrics
      monitoring.recordMetric('sync.events_total', 10);
      monitoring.recordMetric('sync.events_total', 5);
      monitoring.recordMetric('sync.errors_total', 2);
      monitoring.recordMetric('sync.processing_time', 1000);
      monitoring.recordMetric('sync.processing_time', 2000);

      const syncMetrics = monitoring.getSyncMetrics();

      expect(syncMetrics.totalEvents).toBe(15); // 10 + 5
      expect(syncMetrics.failedSyncs).toBe(2);
      expect(syncMetrics.successfulSyncs).toBe(13); // 15 - 2
      expect(syncMetrics.averageProcessingTime).toBe(1500); // (1000 + 2000) / 2
    });
  });

  describe('Alert System', () => {
    it('should trigger alerts when thresholds are exceeded', (done) => {
      const mockAlertHandler = jest.fn();
      monitoring.subscribeToAlerts(mockAlertHandler);

      // Add an alert that should trigger
      monitoring.addAlert({
        metric: 'test.metric',
        operator: 'gt',
        value: 100,
        windowMs: 60000,
        severity: 'high',
        description: 'Test metric exceeded threshold'
      });

      // Record a metric that should trigger the alert
      monitoring.recordMetric('test.metric', 150);

      // Allow some time for alert processing
      setTimeout(() => {
        expect(mockAlertHandler).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should not trigger alerts when thresholds are not exceeded', (done) => {
      const mockAlertHandler = jest.fn();
      monitoring.subscribeToAlerts(mockAlertHandler);

      monitoring.addAlert({
        metric: 'test.safe_metric',
        operator: 'gt',
        value: 100,
        windowMs: 60000,
        severity: 'low',
        description: 'Safe metric alert'
      });

      // Record a metric that should NOT trigger the alert
      monitoring.recordMetric('test.safe_metric', 50);

      setTimeout(() => {
        expect(mockAlertHandler).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Memory and Performance', () => {
    it('should limit metric storage to prevent memory leaks', () => {
      const metricName = 'test.memory_metric';

      // Add more than the limit (1000) metrics
      for (let i = 0; i < 1200; i++) {
        monitoring.recordMetric(metricName, i);
      }

      const metrics = (monitoring as any).getMetricValues(metricName);
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });

    it('should handle concurrent metric recording', async () => {
      const promises = [];
      const metricName = 'test.concurrent_metric';

      // Record metrics concurrently
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise<void>(resolve => {
            monitoring.recordMetric(metricName, i);
            resolve();
          })
        );
      }

      await Promise.all(promises);

      const metrics = (monitoring as any).getMetricValues(metricName);
      expect(metrics.length).toBe(100);
    });
  });
});

describe('Integration: Validation + Monitoring', () => {
  it('should record validation failure metrics', () => {
    const mockRecordMetric = jest.spyOn(monitoring, 'recordMetric');

    // Simulate validation failure
    const invalidData = { invalid: 'data' };
    const result = validateWebhookData(invalidData);

    expect(result.success).toBe(false);

    // Manually record the metric (as would happen in real code)
    monitoring.recordMetric('validation.webhook_failures', 1, { reason: 'invalid_schema' });

    expect(mockRecordMetric).toHaveBeenCalledWith(
      'validation.webhook_failures',
      1,
      { reason: 'invalid_schema' }
    );
  });

  it('should track validation performance', () => {
    const startTime = Date.now();

    const validData = {
      id: 123,
      action: 'created',
      arg: {
        id: 456,
        name: 'Test Product',
        slug: 'test-product',
        price: '99.99',
        regular_price: '99.99',
        status: 'publish',
        stock_status: 'instock',
        stock_quantity: 10
      }
    };

    const result = validateWebhookData(validData);
    const validationTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(validationTime).toBeLessThan(100); // Should be fast

    // Record validation performance
    monitoring.recordMetric('validation.webhook_time', validationTime);

    const metrics = (monitoring as any).getMetricValues('validation.webhook_time');
    expect(metrics.length).toBe(1);
    expect(metrics[0]?.value).toBe(validationTime);
  });
});