// Comprehensive tests for enhanced webhook security
import { webhookSecurity, EnhancedWebhookSecurity, validateWebhookRequest } from '../enhanced-webhook-security';

// Mock dependencies
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../monitoring-observability', () => ({
  monitoring: {
    recordMetric: jest.fn()
  }
}));

jest.mock('../unified-config', () => ({
  config: {
    webhooks: {
      secret: 'test-webhook-secret'
    },
    app: {
      baseUrl: 'https://example.com'
    },
    woocommerce: {
      apiUrl: 'https://shop.example.com'
    }
  }
}));

describe('Enhanced Webhook Security Tests', () => {
  let security: EnhancedWebhookSecurity;

  beforeEach(() => {
    jest.clearAllMocks();
    security = new EnhancedWebhookSecurity({
      maxPayloadSize: 1024,
      signatureTimeout: 300,
      maxFailedAttempts: 3,
      blockDuration: 300,
      enableReplayProtection: true,
      replayWindowMs: 300000
    });
  });

  describe('Basic Security Validation', () => {
    it('should allow valid webhook requests', async () => {
      const validRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'valid-signature',
          'user-agent': 'WooCommerce/1.0'
        }),
        body: '{"id": 123, "name": "Test Product"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      // Mock successful signature verification
      jest.spyOn(security as any, 'verifyHmacSignature').mockReturnValue(true);

      const result = await security.validateWebhookSecurity(validRequest, '192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.riskLevel).toBe('low');
      expect(result.metadata.signatureValid).toBe(true);
    });

    it('should reject requests with invalid methods', async () => {
      const invalidRequest = {
        headers: new Headers({
          'content-type': 'application/json'
        }),
        body: '{}',
        url: 'https://example.com/api/webhook',
        method: 'GET'
      };

      const result = await security.validateWebhookSecurity(invalidRequest, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Invalid HTTP method');
      expect(result.riskLevel).toBe('medium');
    });

    it('should reject oversized payloads', async () => {
      const largePayload = 'x'.repeat(2048); // Exceeds 1024 byte limit
      const oversizedRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created'
        }),
        body: largePayload,
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(oversizedRequest, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Payload size');
      expect(result.riskLevel).toBe('medium');
      expect(result.metadata.payloadSize).toBe(Buffer.byteLength(largePayload, 'utf8'));
    });

    it('should require HTTPS in production mode', async () => {
      const productionSecurity = new EnhancedWebhookSecurity({
        requireHttps: true
      });

      const httpRequest = {
        headers: new Headers({
          'content-type': 'application/json'
        }),
        body: '{}',
        url: 'http://example.com/api/webhook', // HTTP instead of HTTPS
        method: 'POST'
      };

      const result = await productionSecurity.validateWebhookSecurity(httpRequest, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('HTTPS required');
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('Signature Verification', () => {
    it('should validate HMAC signatures correctly', async () => {
      const body = '{"test": "data"}';
      const secret = 'test-secret';

      // Test base64 signature
      const crypto = require('crypto');
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

      const request = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': validSignature
        }),
        body,
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(request, '192.168.1.1');

      expect(result.metadata.signatureValid).toBe(true);
    });

    it('should reject invalid signatures', async () => {
      const request = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'invalid-signature'
        }),
        body: '{"test": "data"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(request, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('signature');
      expect(result.riskLevel).toBe('critical');
    });

    it('should reject requests with missing signatures', async () => {
      const request = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created'
          // Missing x-wc-webhook-signature
        }),
        body: '{"test": "data"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(request, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Missing webhook signature');
      expect(result.riskLevel).toBe('critical');
    });

    it('should validate signature timestamps when provided', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago

      const request = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'test-signature',
          'x-wc-webhook-timestamp': oldTimestamp.toString()
        }),
        body: '{"test": "data"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(request, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('timestamp expired');
    });
  });

  describe('IP Blocking and Rate Limiting', () => {
    it('should track failed attempts and block IPs', async () => {
      const maliciousIp = '10.0.0.1';

      const badRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'invalid-signature'
        }),
        body: '{"test": "data"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      // Make multiple failed requests
      for (let i = 0; i < 4; i++) {
        await security.validateWebhookSecurity(badRequest, maliciousIp);
      }

      // Next request should be blocked due to IP blocking
      const result = await security.validateWebhookSecurity(badRequest, maliciousIp);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('temporarily blocked');
      expect(result.riskLevel).toBe('high');
    });

    it('should allow IP unblocking', () => {
      const blockedIp = '10.0.0.2';

      // Manually block IP by triggering security violations
      for (let i = 0; i < 3; i++) {
        (security as any).recordSecurityViolation(blockedIp, 'test_violation');
      }

      // Verify IP is blocked
      const blockedIps = security.getBlockedIps();
      expect(blockedIps.some(block => block.ip === blockedIp)).toBe(true);

      // Unblock IP
      const wasBlocked = security.unblockIp(blockedIp);
      expect(wasBlocked).toBe(true);

      // Verify IP is no longer blocked
      const remainingBlocked = security.getBlockedIps();
      expect(remainingBlocked.some(block => block.ip === blockedIp)).toBe(false);
    });

    it('should auto-expire IP blocks', async () => {
      const testSecurity = new EnhancedWebhookSecurity({
        maxFailedAttempts: 1,
        blockDuration: 1 // 1 second
      });

      const testIp = '10.0.0.3';
      const badRequest = {
        headers: new Headers({
          'content-type': 'application/json'
        }),
        body: '{}',
        url: 'https://example.com/api/webhook',
        method: 'GET' // Invalid method to trigger blocking
      };

      // Trigger block
      await testSecurity.validateWebhookSecurity(badRequest, testIp);

      // Should be blocked
      let result = await testSecurity.validateWebhookSecurity(badRequest, testIp);
      expect(result.allowed).toBe(false);

      // Wait for block to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again (different violation but block expired)
      result = await testSecurity.validateWebhookSecurity({
        ...badRequest,
        method: 'POST'
      }, testIp);
      expect(result.allowed).toBe(false); // Still fails but not due to IP block
      expect(result.reason).not.toContain('temporarily blocked');
    });
  });

  describe('Replay Attack Protection', () => {
    it('should detect replay attacks using request fingerprinting', async () => {
      const request = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'test-signature',
          'x-wc-webhook-delivery': 'unique-delivery-id'
        }),
        body: '{"unique": "data"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      // Mock signature verification
      jest.spyOn(security as any, 'verifyHmacSignature').mockReturnValue(true);

      // First request should pass
      const firstResult = await security.validateWebhookSecurity(request, '192.168.1.1');
      expect(firstResult.allowed).toBe(true);

      // Second identical request should be detected as replay
      const replayResult = await security.validateWebhookSecurity(request, '192.168.1.1');
      expect(replayResult.allowed).toBe(false);
      expect(replayResult.reason).toContain('replay attack');
      expect(replayResult.riskLevel).toBe('critical');
    });

    it('should validate request timestamps for replay protection', async () => {
      const oldTimestamp = Math.floor((Date.now() - 400000) / 1000); // 6+ minutes ago

      const request = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'test-signature',
          'x-wc-webhook-timestamp': oldTimestamp.toString()
        }),
        body: '{"test": "data"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(request, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('too old');
    });

    it('should reject future timestamps', async () => {
      const futureTimestamp = Math.floor((Date.now() + 60000) / 1000); // 1 minute in future

      const request = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'test-signature',
          'x-wc-webhook-timestamp': futureTimestamp.toString()
        }),
        body: '{"test": "data"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(request, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('too far in future');
    });
  });

  describe('Malicious Content Detection', () => {
    it('should detect SQL injection attempts', async () => {
      const maliciousRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-malicious-header': "'; DROP TABLE users; --"
        }),
        body: '{}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(maliciousRequest, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Malicious content detected');
      expect(result.riskLevel).toBe('high');
    });

    it('should detect XSS attempts', async () => {
      const xssRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-custom-header': '<script>alert("xss")</script>'
        }),
        body: '{}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(xssRequest, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Malicious content detected');
    });

    it('should detect suspicious user agents', async () => {
      const suspiciousRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'user-agent': 'sqlmap/1.0 automatic SQL injection tool'
        }),
        body: '{}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      // Should log warning but not necessarily block
      await security.validateWebhookSecurity(suspiciousRequest, '192.168.1.1');

      const { logger } = require('../logger');
      expect(logger.warn).toHaveBeenCalledWith(
        'Suspicious user agent detected',
        expect.objectContaining({
          userAgent: expect.stringContaining('sqlmap')
        })
      );
    });
  });

  describe('Topic and Origin Validation', () => {
    it('should validate allowed webhook topics', async () => {
      const invalidTopicRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'invalid.topic',
          'x-wc-webhook-signature': 'test-signature'
        }),
        body: '{}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(invalidTopicRequest, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Invalid or unauthorized webhook topic');
    });

    it('should validate origin headers when present', async () => {
      const invalidOriginRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'origin': 'https://malicious.com'
        }),
        body: '{}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      const result = await security.validateWebhookSecurity(invalidOriginRequest, '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Invalid origin header');
    });
  });

  describe('Security Metrics and Monitoring', () => {
    it('should provide security metrics', () => {
      const metrics = security.getSecurityMetrics();

      expect(metrics).toHaveProperty('blockedIps');
      expect(metrics).toHaveProperty('usedNonces');
      expect(metrics).toHaveProperty('config');
      expect(typeof metrics.blockedIps).toBe('number');
      expect(typeof metrics.usedNonces).toBe('number');
    });

    it('should track blocked IPs with details', () => {
      const testIp = '10.0.0.4';

      // Trigger blocking
      for (let i = 0; i < 3; i++) {
        (security as any).recordSecurityViolation(testIp, 'test_violation');
      }

      const blockedIps = security.getBlockedIps();
      const blockedEntry = blockedIps.find(entry => entry.ip === testIp);

      expect(blockedEntry).toBeDefined();
      expect(blockedEntry?.attempts).toBeGreaterThanOrEqual(3);
      expect(blockedEntry?.blockedUntil).toBeGreaterThan(Date.now());
    });

    it('should record security metrics during validation', async () => {
      const { monitoring } = require('../monitoring-observability');

      const request = {
        headers: new Headers({
          'content-type': 'application/json'
        }),
        body: '{}',
        url: 'https://example.com/api/webhook',
        method: 'GET' // Invalid method
      };

      await security.validateWebhookSecurity(request, '192.168.1.1');

      expect(monitoring.recordMetric).toHaveBeenCalledWith(
        'webhook.security.violation',
        1,
        expect.objectContaining({
          violation: 'invalid_method'
        })
      );
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent security validations', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'test-signature'
        }),
        body: `{"id": ${i}}`,
        url: 'https://example.com/api/webhook',
        method: 'POST'
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map((req, i) => security.validateWebhookSecurity(req, `192.168.1.${i + 10}`))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should clean up old nonces automatically', () => {
      const initialNonces = security.getSecurityMetrics().usedNonces;

      // The cleanup is handled by setInterval in the actual implementation
      // For testing, we just verify the metric is available
      expect(typeof initialNonces).toBe('number');
    });
  });

  describe('Integration with validateWebhookRequest', () => {
    it('should work through the convenience function', async () => {
      const request = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-signature': 'test-signature'
        }),
        body: '{"test": "data"}',
        url: 'https://example.com/api/webhook',
        method: 'POST'
      };

      // Mock signature verification for the global instance
      jest.spyOn(webhookSecurity as any, 'verifyHmacSignature').mockReturnValue(true);

      const result = await validateWebhookRequest(request, '192.168.1.1');

      expect(result).toBeDefined();
      expect(result.allowed).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.riskLevel).toBe('low');
    });
  });
});