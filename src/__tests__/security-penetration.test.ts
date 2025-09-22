// Security Penetration Testing
// Tests the system's defenses against real-world attack scenarios

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auto-sync/route';
import crypto from 'crypto';

describe('Security Penetration Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Injection Attack Vectors', () => {
    it('should block SQL injection attempts in webhook data', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE products; --",
        "' OR '1'='1",
        "'; SELECT * FROM users; --",
        "' UNION SELECT * FROM admin_users --",
        "'; DELETE FROM orders WHERE id > 0; --",
        "' OR 1=1 /*",
        "'; EXEC xp_cmdshell('format c:'); --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.168.1.100'
          },
          body: JSON.stringify({
            productId: 123,
            eventType: 'product.created',
            productData: {
              id: 123,
              name: payload,
              description: payload,
              sku: payload
            }
          })
        });

        const response = await POST(request);

        // Should reject malicious input
        expect([400, 422, 403]).toContain(response.status);

        const result = await response.json();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it('should block NoSQL injection attempts', async () => {
      const noSqlInjectionPayloads = [
        { "$ne": null },
        { "$regex": ".*" },
        { "$where": "this.price < 0" },
        { "$gt": "" },
        { "$or": [{ "price": { "$ne": null } }] },
        { "$eval": "db.dropDatabase()" }
      ];

      for (const payload of noSqlInjectionPayloads) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            productId: payload,
            eventType: 'product.created',
            productData: {
              id: 123,
              name: 'Test Product',
              price: payload
            }
          })
        });

        const response = await POST(request);

        // Should reject NoSQL injection attempts
        expect([400, 422]).toContain(response.status);
      }
    });

    it('should sanitize XSS attempts in product data', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<link rel=stylesheet href="javascript:alert(1)">',
        '<style>@import"javascript:alert(1)"</style>',
        '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'
      ];

      for (const payload of xssPayloads) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            productId: 123,
            eventType: 'product.created',
            productData: {
              id: 123,
              name: payload,
              description: payload,
              short_description: payload
            }
          })
        });

        const response = await POST(request);

        if (response.status === 200) {
          // If accepted, ensure XSS was sanitized
          const result = await response.json();
          expect(result.sanitizedData?.name).not.toContain('<script>');
          expect(result.sanitizedData?.name).not.toContain('javascript:');
          expect(result.sanitizedData?.name).not.toContain('onerror=');
        } else {
          // Should reject or sanitize
          expect([400, 422]).toContain(response.status);
        }
      }
    });
  });

  describe('Authentication and Authorization Attacks', () => {
    it('should block requests with invalid webhook signatures', async () => {
      const invalidSignatures = [
        'sha256=invalid_signature',
        'sha256=',
        '',
        'malicious_signature',
        'sha256=' + 'x'.repeat(64),
        'md5=invalid_hash_algorithm',
        'sha1=old_insecure_algorithm'
      ];

      for (const signature of invalidSignatures) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-wc-webhook-signature': signature,
            'x-wc-webhook-topic': 'product.created'
          },
          body: JSON.stringify({
            productId: 123,
            eventType: 'product.created'
          })
        });

        const response = await POST(request);

        // Should reject invalid signatures
        expect([401, 403, 422]).toContain(response.status);
      }
    });

    it('should prevent signature bypass attempts', async () => {
      const bypassAttempts: Record<string, string>[] = [
        // Header manipulation attempts
        { 'x-wc-webhook-signature': 'valid_signature', 'x-webhook-signature': 'malicious' },
        { 'X-WC-WEBHOOK-SIGNATURE': 'case_bypass' },
        { 'x-wc-webhook-signature ': 'trailing_space' },
        { ' x-wc-webhook-signature': 'leading_space' },
        // Multiple signature headers (using string instead of array for compatibility)
        { 'x-wc-webhook-signature': 'valid,malicious' }
      ];

      for (const headers of bypassAttempts) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: new Headers({
            'content-type': 'application/json',
            ...headers
          }),
          body: JSON.stringify({
            productId: 123,
            eventType: 'product.created'
          })
        });

        const response = await POST(request);

        // Should not be fooled by bypass attempts
        expect([401, 403, 422]).toContain(response.status);
      }
    });

    it('should enforce webhook signature timing safety', async () => {
      // Test timing attack resistance
      const correctSecret = process.env.WEBHOOK_SECRET || 'test-secret';
      const payload = JSON.stringify({ productId: 123, eventType: 'product.created' });

      // Generate correct signature
      const correctSignature = 'sha256=' + crypto
        .createHmac('sha256', correctSecret)
        .update(payload)
        .digest('hex');

      // Generate almost-correct signature (differs by 1 character)
      const almostCorrectSignature = correctSignature.slice(0, -1) + 'x';

      const timingTests = [
        { signature: correctSignature, expectTiming: 'normal' },
        { signature: almostCorrectSignature, expectTiming: 'constant' },
        { signature: 'sha256=completely_wrong', expectTiming: 'constant' }
      ];

      const timings: number[] = [];

      for (const test of timingTests) {
        const startTime = performance.now();

        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-wc-webhook-signature': test.signature
          },
          body: payload
        });

        await POST(request);

        const endTime = performance.now();
        timings.push(endTime - startTime);
      }

      // Timing differences should be minimal (constant-time comparison)
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      const timingDifference = maxTiming - minTiming;

      // Should not reveal timing information (difference < 10ms)
      expect(timingDifference).toBeLessThan(10);
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should block rapid-fire requests from single IP', async () => {
      const attackerIp = '10.0.0.99';

      // Send 100 rapid requests
      const rapidRequests = Array.from({ length: 100 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': attackerIp
          },
          body: JSON.stringify({
            productId: i,
            eventType: 'product.created',
            timestamp: Date.now() + i
          })
        });
        return POST(request);
      });

      const responses = await Promise.all(rapidRequests);

      // Should start rate limiting after threshold
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(50); // Should block majority
    });

    it('should handle distributed DoS attacks', async () => {
      // Simulate attack from multiple IPs
      const distributedRequests = Array.from({ length: 50 }, (_, i) => {
        const attackerIp = `192.168.${Math.floor(i / 10)}.${i % 10}`;

        return Array.from({ length: 10 }, (_, j) => {
          const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': attackerIp,
              'user-agent': `AttackBot/${j}`
            },
            body: JSON.stringify({
              productId: i * 10 + j,
              eventType: 'product.created'
            })
          });
          return POST(request);
        });
      }).flat();

      const startTime = Date.now();
      const responses = await Promise.all(distributedRequests);
      const duration = Date.now() - startTime;

      // Should handle distributed attack efficiently
      expect(duration).toBeLessThan(10000); // Complete within 10 seconds

      // Should block or rate limit significant portion
      const successfulRequests = responses.filter(r => r.status < 400).length;
      expect(successfulRequests).toBeLessThan(responses.length * 0.5); // Block at least 50%
    });

    it('should implement exponential backoff for repeat offenders', async () => {
      const repeat_offender_ip = '10.0.0.88';
      const timings: number[] = [];

      // Multiple attack waves from same IP
      for (let wave = 0; wave < 3; wave++) {
        const waveStart = Date.now();

        const waveRequests = Array.from({ length: 20 }, () => {
          const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': repeat_offender_ip
            },
            body: JSON.stringify({
              productId: Math.random() * 1000,
              eventType: 'product.created'
            })
          });
          return POST(request);
        });

        await Promise.all(waveRequests);
        timings.push(Date.now() - waveStart);

        // Wait between waves
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Later waves should be blocked faster (exponential backoff)
      const firstTiming = timings[0];
      const thirdTiming = timings[2];
      if (firstTiming !== undefined && thirdTiming !== undefined) {
        expect(thirdTiming).toBeLessThanOrEqual(firstTiming);
      }
    });
  });

  describe('Data Validation Bypass Attempts', () => {
    it('should block oversized payload attacks', async () => {
      const oversizedPayloads = [
        // 10MB string
        { productData: { description: 'x'.repeat(10 * 1024 * 1024) } },
        // Deeply nested object
        (() => {
          let nested: any = { value: 'deep' };
          for (let i = 0; i < 1000; i++) {
            nested = { level: i, nested };
          }
          return { productData: nested };
        })(),
        // Array with many elements
        { productData: { tags: Array.from({ length: 100000 }, (_, i) => `tag${i}`) } }
      ];

      for (const payload of oversizedPayloads) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            productId: 123,
            eventType: 'product.created',
            ...payload
          })
        });

        const response = await POST(request);

        // Should reject oversized payloads
        expect([413, 400, 422]).toContain(response.status);
      }
    });

    it('should handle malformed JSON attacks', async () => {
      const malformedPayloads = [
        '{"productId": 123,}', // Trailing comma
        '{"productId": 123, "invalid": }', // Missing value
        '{"productId": 123, "nested": {"unclosed": }', // Unclosed object
        '{productId: 123}', // Unquoted keys
        '{"productId": "123"invalid}', // Invalid syntax
        '{"\\u0000": "null byte"}', // Null byte
        '{"unicode": "\\uD800"}', // Invalid unicode
        '{"recursive": {"recursive": {"recursive": "..."}}}' // Potential recursion
      ];

      for (const payload of malformedPayloads) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: payload
        });

        const response = await POST(request);

        // Should handle malformed JSON gracefully
        expect([400, 422]).toContain(response.status);

        const result = await response.json();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Header Manipulation Attacks', () => {
    it('should resist HTTP header injection', async () => {
      const maliciousHeaders = {
        'x-forwarded-for': '192.168.1.1\r\nX-Admin: true',
        'user-agent': 'Bot\r\nContent-Length: 0\r\n\r\nHTTP/1.1 200 OK',
        'content-type': 'application/json\r\nX-Malicious: header',
        'host': 'legitimate.com\r\nX-Override: malicious.com',
        'x-wc-webhook-topic': 'product.created\r\nAuthorization: Bearer stolen-token'
      };

      for (const [headerName, headerValue] of Object.entries(maliciousHeaders)) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            [headerName]: headerValue
          },
          body: JSON.stringify({
            productId: 123,
            eventType: 'product.created'
          })
        });

        const response = await POST(request);

        // Should not be influenced by header injection
        expect([400, 403, 422]).toContain(response.status);
      }
    });

    it('should validate Content-Type header strictly', async () => {
      const invalidContentTypes = [
        'text/plain',
        'application/xml',
        'multipart/form-data',
        'application/x-www-form-urlencoded',
        'text/html',
        'application/javascript',
        'image/jpeg',
        '', // Empty content type
        'application/json; charset=utf-8; boundary=malicious'
      ];

      for (const contentType of invalidContentTypes) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': contentType
          },
          body: JSON.stringify({
            productId: 123,
            eventType: 'product.created'
          })
        });

        const response = await POST(request);

        if (contentType.startsWith('application/json')) {
          // Should accept valid JSON content types
          expect([200, 403, 422, 429]).toContain(response.status);
        } else {
          // Should reject non-JSON content types
          expect([400, 415]).toContain(response.status);
        }
      }
    });
  });

  describe('Business Logic Attacks', () => {
    it('should validate business rule constraints', async () => {
      const businessLogicAttacks = [
        // Negative prices
        { productData: { id: 123, price: '-99.99', name: 'Negative Price Product' } },
        // Zero prices (might be valid for free products)
        { productData: { id: 123, price: '0.00', name: 'Free Product' } },
        // Extremely high prices
        { productData: { id: 123, price: '999999999.99', name: 'Overpriced Product' } },
        // Invalid product IDs
        { productData: { id: -1, name: 'Invalid ID Product' } },
        { productData: { id: 0, name: 'Zero ID Product' } },
        { productData: { id: 'not-a-number', name: 'Non-numeric ID' } },
        // Missing required fields
        { productData: { name: 'No ID Product' } },
        { productData: { id: 123 } }, // No name
        // Invalid status values
        { productData: { id: 123, name: 'Test', status: 'invalid_status' } },
        // Future dates in the past
        { productData: { id: 123, name: 'Test', date_created: '2050-01-01' } }
      ];

      for (const attack of businessLogicAttacks) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            productId: 123,
            eventType: 'product.created',
            ...attack
          })
        });

        const response = await POST(request);

        // Should validate business logic
        if (response.status === 200) {
          // If accepted, should be properly sanitized
          const result = await response.json();
          expect(result.sanitizedData).toBeDefined();
        } else {
          // Should reject invalid business data
          expect([400, 422]).toContain(response.status);
        }
      }
    });

    it('should prevent race condition exploits', async () => {
      // Simulate concurrent requests for same product
      const productId = 999;
      const concurrentRequests = Array.from({ length: 20 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_updated', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': `192.168.1.${i % 10}`
          },
          body: JSON.stringify({
            productId,
            eventType: 'product.updated',
            productData: {
              id: productId,
              name: `Product Update ${i}`,
              price: `${10 + i}.99`,
              version: i
            }
          })
        });
        return POST(request);
      });

      const responses = await Promise.all(concurrentRequests);

      // Should handle concurrent updates gracefully
      const successfulUpdates = responses.filter(r => r.status === 200);

      // Not all should succeed (some should be rejected due to conflicts)
      expect(successfulUpdates.length).toBeLessThan(concurrentRequests.length);

      // But system should not crash
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      });
    });
  });

  describe('Advanced Persistent Threats (APT)', () => {
    it('should detect and block sophisticated attack patterns', async () => {
      // Simulate advanced attack with multiple vectors
      const aptAttack = {
        // Start with reconnaissance
        phase1: Array.from({ length: 5 }, (_, i) => ({
          action: 'product_created',
          headers: {
            'user-agent': 'legitimate-bot/1.0',
            'x-forwarded-for': `203.0.113.${i}`
          },
          body: { productId: i, eventType: 'product.created' }
        })),

        // Escalate to payload delivery
        phase2: Array.from({ length: 3 }, (_, i) => ({
          action: 'product_updated',
          headers: {
            'user-agent': 'legitimate-bot/1.0',
            'x-forwarded-for': `203.0.113.${i}`,
            'x-wc-webhook-signature': 'sha256=sophisticated_fake'
          },
          body: {
            productId: i,
            eventType: 'product.updated',
            productData: {
              id: i,
              name: `<script>/*APT payload ${i}*/</script>`,
              description: "'; DROP TABLE products; -- APT"
            }
          }
        })),

        // Final attack phase
        phase3: [{
          action: 'product_deleted',
          headers: {
            'user-agent': 'legitimate-bot/1.0',
            'x-forwarded-for': '203.0.113.1',
            'x-wc-webhook-signature': 'sha256=final_payload'
          },
          body: {
            productId: 'all',
            eventType: 'product.deleted',
            productData: { id: '*', confirmation: true }
          }
        }]
      };

      let suspiciousActivityDetected = false;

      // Execute APT simulation
      for (const [phase, requests] of Object.entries(aptAttack)) {
        for (const req of requests) {
          const request = new NextRequest(`http://localhost:3000/api/auto-sync?action=${req.action}`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...req.headers
            },
            body: JSON.stringify(req.body)
          });

          const response = await POST(request);

          // Advanced threats should be detected and blocked
          if (response.status === 403) {
            suspiciousActivityDetected = true;
          }

          // System should not be compromised
          expect([200, 400, 401, 403, 422, 429]).toContain(response.status);
        }
      }

      // Should detect the sophisticated attack pattern
      expect(suspiciousActivityDetected).toBe(true);
    });
  });
});